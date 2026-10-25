import { defineConfig } from 'vite';
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

export default defineConfig({
  plugins: [react(), staticAssetsPlugin()],
  server: {
    port: 3000,
    open: true
  }
});
