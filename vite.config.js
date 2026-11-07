import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function staticAssetsPlugin() {
  return {
    name: 'copy-static-assets',
    closeBundle() {
      copyDir('models', 'dist/models');
      copyDir('assets', 'dist/assets');
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
  plugins: [react(), staticAssetsPlugin()],
  server: {
    proxy: {
      '/api': {
        target: 'https://vacumn.pkld.online',
        changeOrigin: true,
        secure: true,
        configure(proxy) {
          proxy.on('proxyReq', (proxyReq, req) => {
            if (((req.method === 'PUT' && req.url.split('?')[0] === '/api/settings') || (req.method === 'POST' && req.url === '/api/textures') || req.url.startsWith('/api/genai/jobs/')) && env.DEV_SETTINGS_TOKEN) {
              proxyReq.setHeader('Authorization', `Bearer ${env.DEV_SETTINGS_TOKEN}`);
            }
          });
        }
      }
    },
    port: 3000,
    open: true
  }
};
});
