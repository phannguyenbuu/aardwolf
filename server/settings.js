import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { timingSafeEqual } from 'node:crypto';
const directory = process.env.SETTINGS_DIR || path.resolve('data');
const file = path.join(directory, 'settings.json');
let queue = Promise.resolve();
export async function readSettings() {
    try { return JSON.parse(await readFile(file, 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') return { version: 1, global: null, models: {} }; throw error; }
}
export function canWriteSettings(req) {
    const token = process.env.ADMIN_TOKEN;
    if (token) {
        const received = Buffer.from(req.headers.authorization || '');
        const expected = Buffer.from(`Bearer ${token}`);
        return received.length === expected.length && timingSafeEqual(received, expected);
    }
    const local = host => { try { return ['localhost', '127.0.0.1', '[::1]'].includes(new URL(host).hostname); } catch { return false; } };
    return ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress)
        && local(`http://${req.headers.host}`) && local(req.headers.origin || '')
        && req.headers['x-settings-client'] === 'configurator';
}
export function writeSettings(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)
        || !value.models || typeof value.models !== 'object' || Array.isArray(value.models)
        || (value.global !== null && (typeof value.global !== 'object' || Array.isArray(value.global)))) {
        throw new Error('Settings must contain global (object or null) and models (object)');
    }
    const document = { version: value.version === 2 ? 2 : 1, global: value.global, models: value.models, updatedAt: new Date().toISOString() };
    if (document.version === 2) {
        const record = item => item && typeof item === 'object' && !Array.isArray(item);
        if (![value.materials, value.materialMapping, value.assemblies].every(record)) throw new Error('Materials, materialMapping and assemblies are required');
        if (!Object.values(value.materials).every(record)) throw new Error('Invalid material definitions');
        if (!Object.values(value.materialMapping).every(id => typeof id === 'string' && Object.hasOwn(value.materials, id))) throw new Error('Mapping references an unknown material ID');
        if (!Object.values(value.assemblies).every(assembly => record(assembly) && Object.values(assembly).every(position => record(position) && ['x', 'y', 'z'].every(axis => Number.isFinite(position[axis]))))) throw new Error('Invalid assembly positions');
        if (value.global?.partOffsets || value.global?.customParams || value.global?.componentMaterials) throw new Error('Positions and materials must use assembly and mapping tables');
        for (const model of Object.values(value.models)) if (model.offset || model.params || model.material) throw new Error('Model position/material overrides must use assembly and mapping tables');
        document.materials = value.materials;
        document.materialMapping = value.materialMapping;
        document.assemblies = value.assemblies;
        if (value.legacySceneSettings) document.legacySceneSettings = value.legacySceneSettings;
    }
    const vector = v => Array.isArray(v) && v.length === 3 && v.every(Number.isFinite);
    const camera = v => v && vector(v.position) && vector(v.target) && Number.isFinite(v.fov) && v.fov > 0 && v.fov < 180;
    if (value.global?.camera && !camera(value.global.camera)) throw new Error('Invalid camera settings');
    if (value.global?.savedViews && !Object.values(value.global.savedViews).every(camera)) throw new Error('Invalid saved camera view');
    for (const model of Object.values(value.models)) {
        if (!model || typeof model !== 'object' || Array.isArray(model)) throw new Error('Invalid model settings');
        if (model.scale !== undefined && (!Number.isFinite(model.scale) || model.scale <= 0)) throw new Error('Model scale must be positive');
        if (model.rotation && !vector(model.rotation)) throw new Error('Invalid model rotation');
        if (model.offset && !Object.values(model.offset).every(Number.isFinite)) throw new Error('Invalid model offset');
        if (model.params && !Object.values(model.params).every(n => Number.isFinite(n) && n >= 0 && n <= 1)) throw new Error('Material parameters must be between 0 and 1');
    }
    const task = queue.then(async () => {
        await mkdir(directory, { recursive: true });
        await writeFile(file + '.tmp', JSON.stringify(document, null, 2));
        await rename(file + '.tmp', file);
        return document;
    });
    queue = task.catch(() => {});
    return task;
}
