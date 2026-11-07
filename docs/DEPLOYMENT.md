# Backend and deployment

## Backend schema v2 update — 2026-10-27

Backend `server/index.js` and `server/settings.js` updated on the active VPS and `vacumn` restarted. `/api/settings` advertises `supportedSchemaVersion: 2` and accepts shared `materials`, ID-only `materialMapping` and per-configuration `assemblies`. Existing settings were left unchanged; the configurator migrates them when saving with v2. Remote storage round-trip test passed in a temporary directory.

Rollback backup: `/var/backups/vacumn/backend-v2-20261027-194752` (previous backend and settings copy). Public HTTPS health/schema checks passed. The local Vite server was unavailable during the deployment check. Frontend was not deployed in this update.

Backend: Node.js HTTP service, no extra runtime dependencies. It serves the built React frontend and provides:

- `GET /api/health`: health check.
- `POST /api/login`: forwards credentials to the existing Aardwolf pricing API and returns user/price data. This is an integration backend, not an independent account database.

## Local development

Run `rtk npm run dev:server` and `rtk npm run dev` in separate terminals. Vite proxies `/api` to port 3001.

## Production

Run `rtk npm run build`, then `rtk npm start`. Default binding is `127.0.0.1:3001`; configure `HOST`/`PORT` for the target environment. Serve behind an HTTPS reverse proxy.

For a Docker host, `docker compose up -d --build` builds frontend/backend and starts Caddy for `vacumn.pkld.online`. Caddy requires domain DNS pointing at that server and ports 80/443 available. If the server already runs Nginx, Apache or another proxy, integrate the app with that proxy instead of taking its ports. Do not replace an existing hosting configuration without inspecting it.

Check `/api/health`, frontend, FBX/SVG/font files, and login after deployment. Production credentials and server access are not stored in this repository.

## Active VPS deployment (2026-10-27)

- URL: https://vacumn.pkld.online
- App directory: `/var/www/vacumn.pkld.online`.
- Backend: systemd service `vacumn`, binds `127.0.0.1:3017`, runs as `www-data`.
- Nginx serves `dist` directly and proxies `/api/` to Node. Configuration: `/etc/nginx/sites-available/vacumn.pkld.online`.
- HTTPS: dedicated Let's Encrypt certificate; Certbot renewal timer is active and a deploy hook reloads Nginx.
- Deployment templates: `deploy/vacumn.service`, `deploy/nginx.conf`. Docker/Caddy is an alternative, not the running deployment.
- Verified production frontend, loaded crane model, no failed HTTP responses during browser check, and `/api/health` status `ok` over valid HTTPS. Login with real credentials has not been tested.

For updates, build locally, upload `dist` and `server` into a staged release, preserve the current release for rollback, switch only after checks, and restart `vacumn` when backend code changes. Do not upload `.env`, source archives or reference documents into the public web root.

## Full release — 2026-10-28

Deployed current local frontend, static models/assets and backend to https://vacumn.pkld.online (103.163.219.87). Build and all 10 backend tests passed locally; settings/RFQ tests passed on staged VPS release. Existing settings hash unchanged. Service health passed after restart.

Rollback backup: `/var/backups/vacumn/release-20261028-141245` contains the previous dist, server and package.json. Existing service environment and persistent data were preserved.

Completed the interrupted tube FBX repair using original geometry: ID 160/180/200 now have Y extent approximately 1949.383 with original dimensions and a baked 180-degree rotation about the vertical axis. Public model SHA-256 hashes match the corrected local files.

## Render Modal Module Federation — 2026-10-28

Remote deployed at https://genai.toolxprint.com/render-modal/assets/remoteEntry.js, container genaiRenderModal, exposed module ./RenderModal. Remote source/build instructions: modules/render-modal/README.md. CSS and React are isolated in Shadow DOM; host provides capture/render callbacks, working environment and camera metadata. The Aardwolf production frontend now loads this remote dynamically and retains its public /api/genai proxy.

Both remote and host builds pass. Production browser check loaded real remote chunks and all background images; mocked AI create/poll verified the image data URL, 4:3 ratio, result display and closing without creating a real generation job. All 11 backend tests pass. Host frontend rollback: /var/backups/vacumn/frontend-federation-20261028-220631/index.html. GenAI config/previous remote backup: /var/backups/genai-render-modal/20261028-220553.

## Generic Render Modal API — 2026-10-28

Current GenAI remote has no bundled Aardwolf/product/industrial prompt policy. Host-specific prompts, scene catalog, environment translation and download branding moved to src/rendering/renderModalConfig.js. Remote receives prompt/systemPrompt/scenePrompt/contextPrompt, scenes, title, downloadFileName and related options. Added onResult/onProgress/onError callbacks. Public docs at https://genai.toolxprint.com/render-modal/docs/ updated with inputs, outputs, prompt order, initialization behavior and migration notes.

Verified a separate shoe-product consumer with custom instructions/scene/name/engine and callbacks, no business-policy leakage. Three prompt tests pass. Production Aardwolf browser test loaded the actual deployed remote, all host-supplied scene assets and mocked creation/poll result correctly. Current remote JS was fetched and checked for absence of Aardwolf and machine-specific prompt content. Generation tests use mocked responses and do not create real AI jobs.

Backups: /var/backups/vacumn/frontend-federation-20261028-222802 (host index), /var/backups/genai-render-modal/generic-20261028-222737 (previous remote). Existing hashed remote chunks remain available for open pages.

## Mobile Federation — 2026-10-29

Published responsive Render Modal remote to GenAI. Portrait uses full-width preview and controls in a single scroll surface; low landscape uses two columns. Added touch targets, safe-area padding, visualViewport height tracking and body scroll restoration. Tested all three modes at 320x568, 390x844, 768x1024 and 844x390 against local build and public remote; generic consumer callback regression passed. Visual QA of 390x844 completed. Native keyboard/safe-area behavior still needs real-device verification. Remote rollback backup: /var/backups/genai-render-modal/generic-20261029-083207. Public API docs include mobile behavior.

## Four standard materials — 2026-10-29

Library reduced to Orange Painted Metal, Yellow Tube with Logo, Black Rubber and Silver Metal (fourth inferred from the user's three descriptions). Default FBX mesh/material-slot mapping uses source color/texture classification; it is an initial assignment, not a physical-material identification. Preserve generated wood workpiece/white studio floor outside the component library. Mixed FBX groups reference per-slot presets. Existing explicit custom mappings are retained; generated original-default mappings migrate once. Free component edits clone shared presets to scoped custom IDs.

Shared settings saved with 1129 mappings; previous document: work/settings-before-four-materials-20261029.json. Frontend updated for new preset IDs; remote index backup /var/backups/vacumn/frontend-federation-20261029-161951. New HDR asset copied as required by current Path Tracing frontend. Legacy material definitions retained internally for backwards compatibility, hidden from the standard library. This frontend build includes the preceding local UI changes.
