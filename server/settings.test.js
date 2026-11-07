import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

test('v2 settings persist ID mappings, shared materials and separate assembly positions', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'aardwolf-settings-test-'));
    process.env.SETTINGS_DIR = directory;
    try {
        const { writeSettings, readSettings } = await import('./settings.js');
        const document = { version: 2, global: {}, models: {}, materials: { shared: { color: '#123456', roughness: 0.42, uvw: { tileU: 2 } } }, materialMapping: { 'one::0': 'shared', 'two::1': 'shared' }, assemblies: { A: { crane: { x: 12, y: 0, z: 0 } }, B: { crane: { x: 0, y: 99, z: 0 } } } };
        await writeSettings(document);
        const saved = await readSettings();
        for (const key of ['materials', 'materialMapping', 'assemblies']) assert.deepEqual(saved[key], document[key]);
        assert.throws(() => writeSettings({ ...document, materialMapping: { object: 'missing' } }), /unknown material/);
        assert.throws(() => writeSettings({ ...document, global: { partOffsets: {} } }), /assembly and mapping/);
        assert.throws(() => writeSettings({ ...document, models: { object: { offset: { x: 1 } } } }), /assembly and mapping/);
    } finally { delete process.env.SETTINGS_DIR; await rm(directory, { recursive: true, force: true }); }
});
