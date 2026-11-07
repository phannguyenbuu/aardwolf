import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat, readdir, mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readSettings, writeSettings, canWriteSettings } from './settings.js';
import { createRfq, listRfqs } from './rfq.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.fbx': 'application/octet-stream' };
function json(res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(data));
}

export const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    try {
        const url = new URL(req.url, 'http://localhost');
        if (url.pathname === '/api/rfq') {
            if (req.method === 'GET') {
                if (!canWriteSettings(req)) return json(res, 401, { error: 'Admin token required' });
                return json(res, 200, await listRfqs());
            }
            if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
            let body = '';
            for await (const chunk of req) {
                body += chunk;
                if (Buffer.byteLength(body) > 5242880) return json(res, 413, { error: 'Request too large' });
            }
            try { return json(res, 201, await createRfq(JSON.parse(body))); }
            catch (error) { return json(res, 400, { error: error.message }); }
        }
        if (url.pathname.startsWith('/api/genai/jobs/')) {
            const route = url.pathname.replace('/api/genai', '/api');
            const create = route === '/api/jobs/edit-full' && req.method === 'POST';
            const poll = /^\/api\/jobs\/[a-zA-Z0-9_-]+$/.test(route) && req.method === 'GET';
            const cancel = /^\/api\/jobs\/[a-zA-Z0-9_-]+\/cancel$/.test(route) && req.method === 'POST';
            if (!create && !poll && !cancel) return json(res, 404, { error: 'Unknown job route' });
            let body;
            if (create) {
                let raw = '';
                for await (const chunk of req) { raw += chunk; if (Buffer.byteLength(raw) > 12582912) return json(res, 413, { error: 'Image request too large' }); }
                let input; try { input = JSON.parse(raw); } catch { return json(res, 400, { error: 'Invalid JSON' }); }
                if (!Array.isArray(input.reference_images) || !input.reference_images.length || !input.reference_images.every(image => /^data:image\/(png|jpeg);base64,/.test(image))) return json(res, 400, { error: 'A base64 viewport image is required' });
                body = JSON.stringify({ engine: 'chatgpt', job_type: 'edit_full', prompt: String(input.prompt || ''), new_chat: false, reference_images: input.reference_images, aspect_ratio: '16:9' });
            }
            const upstream = await fetch('https://genai.toolxprint.com' + route, { method: req.method, headers: { 'Content-Type': 'application/json' }, body, signal: AbortSignal.timeout(60000) });
            let data; try { data = await upstream.json(); } catch { return json(res, 502, { error: 'Invalid rendering service response' }); }
            // Return only job fields used by this app, never upstream internal credentials/logs.
            const job = data.job || data;
            return json(res, upstream.status, { id: job.id || data.job_id, job_id: data.job_id || job.id, status: job.status, progress: job.progress, current_step: job.current_step, result_image_url: job.result_image_url, outputs: job.outputs, error: job.error || data.error });
        }
        const uploadRoot = path.join(process.env.SETTINGS_DIR || path.resolve('data'), 'textures');
        if (url.pathname === '/api/textures' && req.method === 'POST') {
            if (!canWriteSettings(req)) return json(res, 401, { error: 'Admin token required' });
            const type = req.headers['content-type'];
            const ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/avif': 'avif' }[type];
            if (!ext) return json(res, 400, { error: 'Use PNG, JPEG, WebP or AVIF' });
            const chunks = []; let size = 0;
            for await (const chunk of req) { size += chunk.length; if (size > 8388608) return json(res, 413, { error: 'Maximum image size is 8 MB' }); chunks.push(chunk); }
            const bytes = Buffer.concat(chunks);
            const valid = ext === 'png' ? bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : ext === 'jpg' ? bytes[0] === 255 && bytes[1] === 216 : ext === 'avif' ? bytes.length >= 16 && bytes.readUInt32BE(0) >= 16 && bytes.readUInt32BE(0) <= bytes.length && bytes.toString('ascii',4,8) === 'ftyp' && [bytes.toString('ascii',8,12), ...Array.from({ length: Math.max(0, Math.floor((bytes.readUInt32BE(0) - 16) / 4)) }, (_, i) => bytes.toString('ascii',16+i*4,20+i*4))].some(brand => brand === 'avif' || brand === 'avis') : bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP';
            if (!valid) return json(res, 400, { error: 'Invalid image file' });
            await mkdir(uploadRoot, { recursive: true });
            const name = `${randomUUID()}.${ext}`;
            await writeFile(path.join(uploadRoot, name), bytes);
            return json(res, 201, { url: `/api/textures/${name}` });
        }
        if (/^\/api\/textures\/[a-f0-9-]+\.(png|jpg|webp|avif)$/.test(url.pathname) && req.method === 'GET') {
            const file = path.join(uploadRoot, path.basename(url.pathname));
            let info; try { info = await stat(file); } catch { return json(res, 404, { error: 'Image not found' }); }
            res.writeHead(200, { 'Content-Type': { '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif' }[path.extname(file)], 'Content-Length': info.size, 'Cache-Control': 'public, max-age=31536000, immutable' });
            return createReadStream(file).on('error', () => res.destroy()).pipe(res);
        }
        if (url.pathname === '/api/health' && req.method === 'GET') return json(res, 200, { status: 'ok' });
        if (url.pathname === '/api/models' && req.method === 'GET') {
            return json(res, 200, (await readdir(path.join(root, 'models'))).filter(name => name.toLowerCase().endsWith('.fbx'))
                .map(file => ({ file, key: file.replace(/^aardwolf_all_part_/, '').replace(/\.fbx$/i, '') })));
        }
        if (url.pathname === '/api/settings') {
            if (req.method === 'GET') return json(res, 200, { ...await readSettings(), supportedSchemaVersion: 2 });
            if (req.method !== 'PUT') return json(res, 405, { error: 'Method not allowed' });
            if (!canWriteSettings(req)) return json(res, 401, { error: 'Admin token required' });
            let body = '';
            for await (const chunk of req) {
                body += chunk;
                if (Buffer.byteLength(body) > 524288) return json(res, 413, { error: 'Settings too large' });
            }
            let value;
            try { value = JSON.parse(body); } catch { return json(res, 400, { error: 'Invalid JSON' }); }
            try { return json(res, 200, await writeSettings(value)); }
            catch (error) { return json(res, 400, { error: error.message }); }
        }
        if (url.pathname === '/api/login') {
            if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
            let body = '';
            for await (const chunk of req) {
                body += chunk;
                if (Buffer.byteLength(body) > 8192) return json(res, 413, { error: 'Request too large' });
            }
            const input = new URLSearchParams(body);
            if (!input.get('txtUserName') || !input.get('txtPassword')) return json(res, 400, { error: 'Username and password are required' });
            const form = new URLSearchParams({ txtUserName: input.get('txtUserName'), txtPassword: input.get('txtPassword'), _submit_login: '1' });
            const upstream = await fetch('https://www.aardwolf.com.au/api/get_price.php', {
                method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: form, signal: AbortSignal.timeout(15000), redirect: 'error'
            });
            if (!upstream.ok) return json(res, 502, { error: 'Pricing service unavailable' });
            const data = await upstream.json();
            return json(res, 200, { user: data.user, price: data.price });
        }
        if (url.pathname.startsWith('/api/')) return json(res, 404, { error: 'API route not found' });
        if (!['GET', 'HEAD'].includes(req.method)) return json(res, 405, { error: 'Method not allowed' });
        const name = decodeURIComponent(url.pathname);
        let file = path.resolve(root, '.' + name);
        if (file !== root && !file.startsWith(root + path.sep)) return json(res, 403, { error: 'Forbidden' });
        if (name === '/') file = path.join(root, 'index.html');
        let info;
        try { info = await stat(file); } catch {
            if (path.extname(name)) return json(res, 404, { error: 'File not found' });
            file = path.join(root, 'index.html');
            info = await stat(file);
        }
        if (!info.isFile()) return json(res, 404, { error: 'File not found' });
        res.writeHead(200, {
            'Content-Type': types[path.extname(file)] || 'application/octet-stream',
            'Content-Length': info.size,
            'Cache-Control': file.endsWith('.html') ? 'no-cache' : 'public, max-age=3600'
        });
        if (req.method === 'HEAD') return res.end();
        createReadStream(file).on('error', () => res.destroy()).pipe(res);
    } catch {
        if (!res.headersSent) json(res, 502, { error: 'Request could not be completed' });
        else res.destroy();
    }
});

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const port = Number(process.env.PORT || 3001);
    server.listen(port, process.env.HOST || '127.0.0.1', () => console.log(`Aardwolf server listening on port ${port}`));
}
