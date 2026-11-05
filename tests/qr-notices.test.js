'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { create, sections } = require('../frontend/public/cases-notices');

function storage() {
  const data = new Map();
  return { getItem: key => data.get(key) || null, setItem: (key, value) => data.set(key, value) };
}

test('every patient activity section has its own unread total and read position', () => {
  const notices = create({ code: 'center-a', storage: storage() });
  const counts = Object.fromEntries(sections.map((section, i) => [section, i + 1]));
  assert.deepEqual(notices.update(counts), sections);
  for (const section of sections) assert.equal(notices.unread(section), counts[section]);
  notices.markRead('ratings'); assert.equal(notices.unread('ratings'), 0);
  assert.equal(notices.unread('bookings'), 2);
  notices.update({ ratings: 2 }); assert.equal(notices.unread('ratings'), 1);
});

test('replayed events, duplicate tabs, and stale snapshots never double count or move totals backwards', () => {
  const shared = storage();
  const a = create({ code: 'center-a', storage: shared }), b = create({ code: 'center-a', storage: shared });
  a.update({ ratings: 5 }); b.update({ ratings: 5 });
  assert.deepEqual(a.update({ ratings: 5 }), []);
  a.update({ ratings: 4 }); assert.equal(a.unread('ratings'), 5);
  a.markRead('ratings'); assert.equal(b.unread('ratings'), 0);
  b.update({ ratings: 6 }); assert.equal(b.unread('ratings'), 1);
  b.markRead('ratings'); a.markRead('ratings');
  assert.equal(b.unread('ratings'), 0); // an older tab cannot undo the newer read position
});

test('read state survives a refresh and offline events reappear, isolated by center', () => {
  const shared = storage(), first = create({ code: 'center-a', storage: shared });
  first.update({ ratings: 3, results: 2 }); first.markRead('ratings');
  const reloaded = create({ code: 'center-a', storage: shared });
  reloaded.update({ ratings: 5, results: 2 });
  assert.equal(reloaded.unread('ratings'), 2); assert.equal(reloaded.unread('results'), 2);
  const other = create({ code: 'center-b', storage: shared }); other.update({ ratings: 5 });
  assert.equal(other.unread('ratings'), 5);
});

test('unavailable storage falls back to in-memory read positions', () => {
  const notices = create({ code: 'center-a', storage: { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } } });
  notices.update({ ratings: 2 }); notices.markRead('ratings');
  assert.equal(notices.unread('ratings'), 0);
  notices.update({ ratings: 3 }); assert.equal(notices.unread('ratings'), 1);
});

test('malformed counts and unrelated sections cannot create unread badges', () => {
  const notices = create({ code: 'center-a', storage: storage() });
  notices.update({ ratings: -1, bookings: 1.5, results: '2', complaints: Infinity, reports: NaN, unknown: 8 });
  notices.update(null); notices.markRead('unknown');
  for (const section of sections) assert.equal(notices.unread(section), 0);
});
