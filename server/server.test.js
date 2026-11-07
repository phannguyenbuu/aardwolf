import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { server } from './index.js';
let base;
before(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise(resolve => server.close(resolve)));
test('health endpoint', async () => {
    const res = await fetch(base + '/api/health');
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { status: 'ok' });
});
test('login rejects missing credentials without contacting upstream', async () => {
    const res = await fetch(base + '/api/login', { method: 'POST', body: '' });
    assert.equal(res.status, 400);
    assert.equal(res.headers.get('cache-control'), 'no-store');
});
test('login accepts only POST', async () => assert.equal((await fetch(base + '/api/login')).status, 405));
test('unknown API routes do not return frontend HTML', async () => assert.equal((await fetch(base + '/api/unknown')).status, 404));
test('source files are not exposed', async () => assert.equal((await fetch(base + '/server/index.js')).status, 404));
test('serves built frontend', async () => {
    const res = await fetch(base + '/');
    assert.equal(res.status, 200);
    assert.match(await res.text(), /<html/);
});
test('settings writes require authorization', async () => {
    const res = await fetch(base + '/api/settings', { method: 'PUT', body: '{}' });
    assert.equal(res.status, 401);
});
test('public render creation validates input without requiring an admin token', async () => {
    const res = await fetch(base + '/api/genai/jobs/edit-full', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}'
    });
    assert.equal(res.status, 400);
    assert.equal((await res.json()).error, 'A base64 viewport image is required');
});
test('model catalog returns FBX filenames', async () => {
    const res = await fetch(base + '/api/models');
    assert.equal(res.status, 200);
    const models = await res.json();
    assert.ok(models.length > 0);
    assert.ok(models.every(model => model.file.endsWith('.fbx') && model.key));
});
