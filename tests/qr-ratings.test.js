'use strict';

// Real HTTP server and a disposable SQLite database; no production data or services.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { DatabaseSync } = require('node:sqlite');

let child, origin, admin, a, b, cookie, token, db;
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'emdadx-ratings-'));
const password = 'Ratings-test-only-987!';
let logs = '';

async function request(route, { method = 'GET', body, cookie: session, headers = {} } = {}) {
  const response = await fetch(origin + route, {
    method,
    headers: { ...(session ? { Cookie: session } : {}), ...headers },
    body: body === undefined ? undefined : typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body)
  });
  const text = await response.text();
  let json; try { json = JSON.parse(text); } catch (_) {}
  return { status: response.status, headers: response.headers, json, text };
}
const post = (route, body, session, headers = {}) => request(route, {
  method: 'POST', body, cookie: session, headers: { 'Content-Type': 'application/json', ...headers }
});

before(async () => {
  const probe = net.createServer();
  probe.listen(0, '127.0.0.1'); await once(probe, 'listening');
  const port = probe.address().port; await new Promise(resolve => probe.close(resolve));
  origin = 'http://127.0.0.1:' + port;
  child = spawn(process.execPath, ['backend/server.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, DATA_DIR: dataDir, ADMIN_PASSWORD: password, HOST: '127.0.0.1', PORT: String(port), APP_PATH: '' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  child.stdout.on('data', chunk => { logs += chunk; });
  child.stderr.on('data', chunk => { logs += chunk; });
  for (let i = 0; ; i++) {
    try { if ((await request('/api/health')).status === 200) break; } catch (_) {}
    if (i >= 100 || child.exitCode !== null) throw new Error('Test server failed: ' + logs);
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  const login = await post('/api/login', { username: 'admin', password });
  assert.equal(login.status, 200);
  admin = login.headers.get('set-cookie').split(';')[0];
  async function make(cid) {
    const r = await post('/api/portal/cases/make', { cid, name: 'Test ' + cid, pass: password }, admin);
    assert.equal(r.status, 200); return r.json.site;
  }
  a = await make('ratings-a'); b = await make('ratings-b');
  const centerLogin = await post('/k/' + a.code + '/login', { pass: password });
  assert.equal(centerLogin.status, 200);
  cookie = centerLogin.headers.get('set-cookie').split(';')[0];
  const uploaded = await post('/k/' + a.code + '/case', Buffer.alloc(40), cookie, {
    'Content-Type': 'application/octet-stream',
    'X-Meta': Buffer.from(JSON.stringify({ patient: 'Test Patient', exam: 'Test exam', name: 'test.pdf' })).toString('base64url')
  });
  assert.equal(uploaded.status, 200); token = uploaded.json.item.token;
  db = new DatabaseSync(path.join(dataDir, 'ozarex.db'));
});

after(async () => {
  if (db) db.close();
  if (child && child.exitCode === null) { const exit = once(child, 'exit'); child.kill(); await exit; }
  fs.rmSync(dataDir, { recursive: true, force: true });
});

test('public fixed QR rating persists, updates, and appears only in its authenticated center', async () => {
  const route = '/h/' + a.pub + '/rate';
  assert.equal((await post(route, { stars: 5, vid: 'fixed-visitor' })).status, 200);
  assert.equal((await post(route, { stars: 2, vid: 'fixed-visitor' })).status, 200);
  const rows = db.prepare('SELECT * FROM case_rating WHERE token = ?').all('h:' + a.pub);
  assert.equal(rows.length, 1); assert.equal(rows[0].stars, 2);
  assert.equal(rows[0].customer_id, 'ratings-a');
  const ratings = '/k/' + a.code + '/ratings?days=365';
  assert.equal((await request(ratings)).status, 401);
  const list = await request(ratings, { cookie });
  assert.equal(list.status, 200); assert.equal(list.json.list[0].stars, 2);
  assert.equal(list.json.list[0].token, 'h:' + a.pub);
  assert.equal(list.json.months[0].n, 1);
  const otherLogin = await post('/k/' + b.code + '/login', { pass: password });
  const otherCookie = otherLogin.headers.get('set-cookie').split(';')[0];
  assert.equal((await request(ratings, { cookie: otherCookie })).status, 401);
  assert.deepEqual((await request('/k/' + b.code + '/ratings', { cookie: otherCookie })).json.list, []);
});

test('case QR rating keeps notes/tags, updates once, and reaches dashboard and monthly report', async () => {
  const route = '/v/' + token + '/rate';
  const tags = ['التقرير واضح', 'unknown'];
  assert.equal((await post(route, { stars: 4, vid: 'case-visitor', tags, note: 'Test note' })).status, 200);
  assert.equal((await post(route, { stars: 5, vid: 'case-visitor', tags, note: 'Updated note' })).status, 200);
  const rows = db.prepare('SELECT * FROM case_rating WHERE token = ?').all(token);
  assert.equal(rows.length, 1); assert.equal(rows[0].stars, 5);
  assert.deepEqual(JSON.parse(rows[0].tags), ['التقرير واضح']);
  const list = (await request('/k/' + a.code + '/ratings', { cookie })).json.list;
  const rating = list.find(r => r.token === token);
  assert.equal(rating.patient, 'Test Patient'); assert.equal(rating.note, 'Updated note');
  const dash = (await request('/k/' + a.code + '/dash', { cookie })).json.dash;
  assert.equal(dash.rate.n, 2); assert.equal(dash.rate.avg, 3.5);
  const report = (await request('/k/' + a.code + '/report', { cookie })).json.report;
  assert.equal(report.cur.rated, 2); assert.equal(report.cur.stars, 3.5);
  assert.equal(report.cur.happy, 1);
});

test('rating event reaches the live center after the database write', async () => {
  const controller = new AbortController();
  const response = await fetch(origin + '/k/' + a.code + '/live', { headers: { Cookie: cookie }, signal: controller.signal });
  const reader = response.body.getReader();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    await reader.read(); // hello; subscription is now registered
    assert.equal((await post('/h/' + a.pub + '/rate', { stars: 3, vid: 'live-visitor' })).status, 200);
    let events = '';
    while (!events.includes('event: rating')) {
      const next = await reader.read(); assert.equal(next.done, false);
      events += Buffer.from(next.value).toString();
    }
    assert.match(events, /"stars":3/);
    assert.equal(db.prepare('SELECT COUNT(*) n FROM case_rating WHERE stars = 3').get().n, 1);
  } finally { clearTimeout(timeout); controller.abort(); }
});

test('invalid bodies, unknown links, wrong methods, and stopped links never acknowledge success', async () => {
  for (const route of ['/h/' + a.pub + '/rate', '/v/' + token + '/rate']) {
    for (const body of ['null', '{', '{"stars":2.5}', '{"stars":0}', '{"stars":6}', '{}']) {
      const r = await post(route, body, undefined, { 'X-Forwarded-For': 'invalid-' + route + body });
      assert.equal(r.status, 400, route + ' ' + body); assert.notEqual(r.json.ok, true);
    }
    const r = await request(route);
    assert.equal(r.status, 405); assert.equal(r.headers.get('allow'), 'POST');
  }
  for (const route of ['/h/ZZZZZZZZ/rate', '/v/ZZZZZZZZZZZZ/rate']) {
    const r = await post(route, { stars: 5 }); assert.equal(r.status, 404); assert.notEqual(r.json.ok, true);
  }
  assert.equal((await post('/k/' + a.code + '/item/' + token + '/stop', {}, cookie)).status, 200);
  assert.equal((await post('/v/' + token + '/rate', { stars: 5 })).status, 410);
  await post('/k/' + a.code + '/item/' + token + '/start', {}, cookie);
  await post('/api/portal/cases/stop', { cid: 'ratings-a', on: false }, admin);
  assert.equal((await post('/h/' + a.pub + '/rate', { stars: 5 })).status, 404);
  assert.equal((await post('/v/' + token + '/rate', { stars: 5 })).status, 410);
  await post('/api/portal/cases/stop', { cid: 'ratings-a', on: true }, admin);
});

test('rate limiting returns 429 without saving excess ratings', async () => {
  const headers = { 'X-Forwarded-For': 'ratings-limit-test' };
  for (let i = 0; i < 20; i++) {
    assert.equal((await post('/h/' + a.pub + '/rate', { stars: 1, vid: 'limit' }, undefined, headers)).status, 200);
  }
  const r = await post('/h/' + a.pub + '/rate', { stars: 5, vid: 'limit' }, undefined, headers);
  assert.equal(r.status, 429); assert.notEqual(r.json.ok, true);
});
