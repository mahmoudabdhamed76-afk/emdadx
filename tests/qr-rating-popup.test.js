'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Minimal DOM boundary for the real shared popup code, with controllable HTTP failures.
function popup(fetch) {
  const classes = () => ({ add() {}, remove() {}, toggle() {} });
  const buttons = [1, 2, 3, 4, 5].map(n => ({ dataset: { ps: String(n) }, classList: classes() }));
  const alert = { hidden: true, textContent: '' }, content = { innerHTML: '' };
  const element = {
    classList: classes(), setAttribute() {}, addEventListener() {}, remove() {},
    querySelectorAll() { return buttons; },
    querySelector(selector) { return selector === '.rp-pop-c' ? content : alert; }
  };
  const storage = new Map([['qrd-staff', '1']]);
  const context = {
    window: {}, location: { pathname: '/test' },
    document: { createElement: () => element, body: { appendChild() {} }, addEventListener() {}, removeEventListener() {} },
    localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    sessionStorage: { setItem: (key, value) => storage.set(key, value) },
    requestAnimationFrame: fn => fn(), setTimeout() {}, fetch
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../frontend/public/cases-kit.js'), 'utf8'), context);
  return { open: context.window.OZK.ratePop, buttons, alert, content, storage };
}
const settle = () => new Promise(resolve => setImmediate(resolve));

test('patient popup submits and acknowledges JSON success even with the legacy staff marker', async () => {
  let calls = 0, done;
  const ui = popup(async (url, options) => {
    calls++; assert.equal(url, '/h/abcdefgh/rate');
    assert.equal(JSON.parse(options.body).stars, 5);
    return { ok: true, json: async () => ({ ok: true }) };
  });
  ui.open({ url: '/h/abcdefgh/rate', onDone: n => { done = n; } });
  ui.buttons[4].onclick(); ui.buttons[4].onclick();
  await settle();
  assert.equal(calls, 1); assert.equal(done, 5);
  assert.equal(ui.storage.get('ozx_rated_s'), '1');
  assert.match(ui.content.innerHTML, /شكرًا/);
});

test('HTTP, network, and non-JSON success responses stay open and can be retried', async () => {
  for (const failure of [
    async () => ({ ok: false, json: async () => ({ message: 'استنى شوية' }) }),
    async () => { throw new Error('Network failed'); },
    async () => ({ ok: true, json: async () => { throw new Error('HTML fallback'); } }),
    async () => ({ ok: true, json: async () => ({}) })
  ]) {
    let calls = 0, done = 0;
    const ui = popup(async () => ++calls === 1 ? failure() : { ok: true, json: async () => ({ ok: true }) });
    ui.open({ url: '/h/abcdefgh/rate', onDone: () => { done++; } });
    ui.buttons[2].onclick(); await settle();
    assert.equal(done, 0); assert.equal(ui.storage.has('ozx_rated_s'), false);
    assert.equal(ui.alert.hidden, false); assert.ok(ui.alert.textContent);
    assert.ok(ui.buttons.every(b => !b.disabled));
    ui.buttons[2].onclick(); await settle();
    assert.equal(done, 1); assert.equal(calls, 2); assert.match(ui.content.innerHTML, /شكرًا/);
  }
});

test('explicit design preview never sends or marks a patient rating as saved', async () => {
  let calls = 0;
  const ui = popup(async () => { calls++; });
  ui.open({ dry: true }); ui.buttons[4].onclick(); await settle();
  assert.equal(calls, 0); assert.equal(ui.storage.has('ozx_rated_s'), false);
  assert.match(ui.content.innerHTML, /شكرًا/);
});
