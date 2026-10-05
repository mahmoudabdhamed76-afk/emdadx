'use strict';
/* ════════════════════════════════════════════════════════════════════
   EmdadX · auth — real login on the server (zero dependencies)
   · passwords: scrypt (node:crypto) — stored as  scrypt$<salt>$<hash>
     old plain-text passwords are upgraded automatically on start
   · sessions: random 32-byte token in an HttpOnly cookie; only its
     SHA-256 is stored, so a copy of the database can't be used to log in
   · login throttling per IP + username
════════════════════════════════════════════════════════════════════ */
const crypto = require('node:crypto');
const { db } = require('../db');

const COOKIE = 'emx_sid';
const SESSION_DAYS = 365;   // 4.13 · stays signed in (sliding: every use pushes it a year ahead)
const SESSION_MS = SESSION_DAYS * 864e5;

/* ── passwords ── */
function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const h = crypto.scryptSync(String(pw), salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
  return 'scrypt$' + salt + '$' + h;
}
function isHash(v) { return typeof v === 'string' && v.startsWith('scrypt$') && v.split('$').length === 3; }
function verifyPassword(pw, stored) {
  if (!stored) return false;
  if (!isHash(stored)) {                       // legacy plain text (upgraded right after)
    const a = Buffer.from(String(pw)), b = Buffer.from(String(stored));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }
  const [, salt, h] = stored.split('$');
  const calc = crypto.scryptSync(String(pw), salt, 64, { N: 16384, r: 8, p: 1 });
  const want = Buffer.from(h, 'hex');
  return want.length === calc.length && crypto.timingSafeEqual(want, calc);
}
/* upgrade every plain-text password in the database */
function migratePasswords() {
  const rows = db.prepare('SELECT id, password FROM users').all();
  let n = 0;
  for (const r of rows) {
    if (!isHash(r.password)) {
      db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashPassword(r.password || ''), r.id);
      n++;
    }
  }
  if (n) console.log('🔐 Upgraded', n, 'password(s) to scrypt hashes');
}
function storedHash(userId) { const r = db.prepare('SELECT password FROM users WHERE id = ?').get(userId); return r ? r.password : null; }

/* ── sessions ── */
const sha = t => crypto.createHash('sha256').update(String(t)).digest('hex');
const cache = new Map();   // sha(token) → { userId, lastSeen }
function loadSessions() {
  const cut = Date.now() - SESSION_MS;
  db.prepare('DELETE FROM sessions WHERE last_seen < ?').run(cut);
  for (const r of db.prepare('SELECT id, user_id, last_seen FROM sessions').all()) cache.set(r.id, { userId: r.user_id, lastSeen: r.last_seen });
}
function createSession(userId, req) {
  const token = crypto.randomBytes(32).toString('hex'), id = sha(token), now = Date.now();
  db.prepare('INSERT INTO sessions (id, user_id, created_at, last_seen, ua, ip) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, userId, now, now, String(req.headers['user-agent'] || '').slice(0, 200), clientIp(req));
  cache.set(id, { userId, lastSeen: now });
  return token;
}
function dropSession(token) { const id = sha(token); cache.delete(id); db.prepare('DELETE FROM sessions WHERE id = ?').run(id); }
function dropUserSessions(userId, exceptToken) {
  const keep = exceptToken ? sha(exceptToken) : null;
  for (const [id, s] of cache) if (s.userId === userId && id !== keep) cache.delete(id);
  if (keep) db.prepare('DELETE FROM sessions WHERE user_id = ? AND id <> ?').run(userId, keep);
  else db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
}
function dropSessionById(id) { cache.delete(id); db.prepare('DELETE FROM sessions WHERE id = ?').run(id); }
function listSessions() {
  return db.prepare('SELECT id, user_id, created_at, last_seen, ua, ip FROM sessions ORDER BY last_seen DESC').all();
}
function parseCookies(req) {
  const out = {}, h = req.headers.cookie || '';
  h.split(';').forEach(p => { const i = p.indexOf('='); if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); });
  return out;
}
function tokenOf(req) {
  const c = parseCookies(req)[COOKIE];
  if (c) return c;
  const a = req.headers.authorization || '';
  if (a.startsWith('Bearer ')) return a.slice(7).trim();
  /* 4.13 · the live stream (EventSource can't send headers) may carry the device token */
  const u = String(req.url || '');
  if (u.indexOf('/api/events') >= 0) { const m = u.match(/[?&]t=([a-f0-9]{64})/); if (m) return m[1]; }
  return null;
}
/* → user id of a valid session, or null */
function sessionUserId(req) {
  const t = tokenOf(req); if (!t) return null;
  const id = sha(t), s = cache.get(id); if (!s) return null;
  const now = Date.now();
  if (now - s.lastSeen > SESSION_MS) { dropSessionById(id); return null; }
  if (now - s.lastSeen > 3600e3) { s.lastSeen = now; db.prepare('UPDATE sessions SET last_seen = ? WHERE id = ?').run(now, id); }
  return s.userId;
}
function isHttps(req) { return !!(req.socket && req.socket.encrypted) || String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https'; }
function cookieHeader(req, token) {
  const base = COOKIE + '=' + (token || '') + '; Path=/; HttpOnly; SameSite=Lax' + (isHttps(req) ? '; Secure' : '');
  return token ? base + '; Max-Age=' + Math.floor(SESSION_MS / 1000) : base + '; Max-Age=0';
}
function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || (req.socket && req.socket.remoteAddress) || '';
}

/* ── throttling: 8 wrong tries in 10 minutes → wait ── */
const tries = new Map();
function throttled(req, username) {
  const k = clientIp(req) + '|' + String(username || '').toLowerCase(), now = Date.now();
  const t = (tries.get(k) || []).filter(x => now - x < 600e3);
  tries.set(k, t);
  return t.length >= 8 ? Math.ceil((600e3 - (now - t[0])) / 60000) : 0;
}
function failed(req, username) {
  const k = clientIp(req) + '|' + String(username || '').toLowerCase();
  const t = tries.get(k) || []; t.push(Date.now()); tries.set(k, t);
}
function succeeded(req, username) { tries.delete(clientIp(req) + '|' + String(username || '').toLowerCase()); }

module.exports = {
  COOKIE, hashPassword, isHash, verifyPassword, migratePasswords, storedHash,
  loadSessions, createSession, dropSession, dropUserSessions, dropSessionById, listSessions,
  tokenOf, sessionUserId, cookieHeader, clientIp, throttled, failed, succeeded, sha
};
