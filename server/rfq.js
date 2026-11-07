import { mkdir, writeFile, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const folder = () => path.join(process.env.SETTINGS_DIR || path.resolve('data'), 'rfq');
export async function createRfq(input) {
    if (!input || typeof input.name !== 'string' || !input.name.trim() || input.name.length > 160) throw new Error('Contact name is required (maximum 160 characters)');
    if (typeof input.email !== 'string' || input.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) throw new Error('A valid email is required');
    if (!input.configuration || typeof input.configuration !== 'object' || Array.isArray(input.configuration)) throw new Error('Configuration is required');
    if (input.notes && (typeof input.notes !== 'string' || input.notes.length > 5000)) throw new Error('Notes are too long');
    const id = randomUUID();
    const record = { id, createdAt: new Date().toISOString(), status: 'new', name: input.name.trim(), email: input.email.trim(), notes: input.notes || '', consultation: input.consultation === true, configuration: input.configuration, snapshot: typeof input.snapshot === 'string' && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(input.snapshot) ? input.snapshot : null };
    await mkdir(folder(), { recursive: true });
    await writeFile(path.join(folder(), id + '.json'), JSON.stringify(record, null, 2), { flag: 'wx', mode: 0o600 });
    return { id, createdAt: record.createdAt };
}
export async function listRfqs() {
    await mkdir(folder(), { recursive: true });
    const files = (await readdir(folder())).filter(name => /^[\da-f-]{36}\.json$/.test(name));
    const records = await Promise.all(files.map(async file => JSON.parse(await readFile(path.join(folder(), file), 'utf8'))));
    return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
