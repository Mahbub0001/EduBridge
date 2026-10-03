import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

function client({ production = true, base = 'https://example.onrender.com/', health } = {}) {
  let request;
  let now = 1000;
  const probes = [];
  const api = {
    defaults: {},
    get() {},
    interceptors: {
      request: { use(callback) { request = callback; } },
      response: { use() {} },
    },
  };
  const source = readFileSync(new URL('../src/services/api.ts', import.meta.url), 'utf8')
    .replace(/import\.meta\.env/g, 'deploymentEnv');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(compiled, {
    exports: {},
    require(name) {
      if (name === 'axios') return { __esModule: true, default: {
        create(config) { api.defaults = config; return api; },
        get(url, config) { probes.push({ url, config }); return health ? health() : Promise.resolve({ status: 200 }); },
      } };
      if (name === './firebase') return { auth: { currentUser: null } };
      throw new Error(`Unexpected import: ${name}`);
    },
    deploymentEnv: { PROD: production, VITE_API_BASE_URL: base },
    window: { location: { origin: 'https://frontend.vercel.app' } },
    localStorage: { getItem() { return null; } },
    Date: { now: () => now },
    URL, Map, console,
  });
  return { request: () => request({ headers: {} }), probes, api, advance(ms) { now += ms; } };
}

test('concurrent requests wait for a single wake check before dispatch', async () => {
  let resolve;
  const c = client({ health: () => new Promise(done => { resolve = done; }) });
  let finished = 0;
  const pending = [c.request(), c.request()].map(p => p.then(() => finished++));
  await Promise.resolve();
  assert.equal(finished, 0);
  assert.equal(c.probes.length, 1);
  assert.equal(c.probes[0].url, 'https://example.onrender.com/health');
  assert.equal(c.probes[0].config.timeout, 120000);
  assert.equal(c.api.defaults.timeout, 30000);
  assert.equal(c.api.defaults.baseURL, 'https://example.onrender.com/api');
  resolve({ status: 200 });
  await Promise.all(pending);
  assert.equal(finished, 2);
  await c.request();
  assert.equal(c.probes.length, 1);
});

test('failed wake blocks the API request and a later attempt can recover', async () => {
  let fail = true;
  const c = client({ health: () => fail ? Promise.reject(new Error('backend asleep')) : Promise.resolve({ status: 200 }) });
  await assert.rejects(c.request(), /backend asleep/);
  fail = false;
  await c.request();
  assert.equal(c.probes.length, 2);
  c.advance(10 * 60 * 1000);
  await c.request();
  assert.equal(c.probes.length, 3);
});

test('development and other hosting providers do not get wake probes', async () => {
  for (const options of [{ production: false }, { base: 'https://api.example.com' }]) {
    const c = client(options);
    await c.request();
    assert.equal(c.probes.length, 0);
  }
});
