import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';
import { fileURLToPath } from 'node:url';

export default defineConfig({
    root: fileURLToPath(new URL('.', import.meta.url)),
    base: 'https://genai.toolxprint.com/render-modal/',
    plugins: [react(), federation({
        name: 'genaiRenderModal', filename: 'remoteEntry.js',
        exposes: { './RenderModal': fileURLToPath(new URL('./src/mount.jsx', import.meta.url)) }
    })],
    build: { target: 'esnext', outDir: 'dist', emptyOutDir: true, minify: true },
    preview: { port: 5005, cors: true }
});
