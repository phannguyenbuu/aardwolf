# Saved settings and administration

## Schema v2 — current code

The backend and frontend must both be deployed for v2 persistence. The implementation uses the existing JSON store, not a SQL database.

- `assemblies[assemblyKey][part]` stores XYZ offsets for each User Settings combination (unit, crane, jib, WLL, suction, environment, surface and workpiece dimensions). Changing the combination selects its own offsets.
- `materialMapping[modelName]` and `materialMapping[modelName::meshIndex]` store material IDs; procedural ground/workpiece use `@ground` and `@workpiece`. Assignments follow a model across assemblies.
- `materials[id]` is the single shared PBR/diffuse/UVW definition. Paste assigns only an ID. Editing an ID updates every object using it. Changing the selected material does not reset that material's properties.
- Configurator and Admin edit the same definitions. Save Settings persists changes; other tabs refresh shared materials after a save through BroadcastChannel or when focused.
- Old per-object looks migrate to explicit `legacy:` IDs to preserve differences. Legacy positions migrate to the saved assembly; `legacySceneSettings` retains the original data. Geometry rotation/scale remain model settings. Position and per-model PBR overrides no longer compete with assembly/mapping data.

The deployment notes below describe the previous schema where they mention global component materials and model offsets; these are superseded by v2.

The settings backend runs on https://vacumn.pkld.online. Local Vite development proxies all /api requests to this VPS; no local backend is required. The development write token is in ignored .env.local (DEV_SETTINGS_TOKEN), used only by the Vite server and never bundled into browser code. Restart Vite after changing this file. The production frontend has not been redeployed with the new administration UI.

- Configurator: http://localhost:3000/
- Administration: http://localhost:3000/admin
- Camera copy: Studio HD > Camera Telemetry > Copy Coordinates.
- Save Settings: top-left of the 3D viewer. Saves current camera, camera presets, named views, component offsets/materials/PBR values, selected configuration, scene lights, theme, wall colors and wavelet settings.
- Studio HD > Saved Camera Views: add a named camera view, then press Save Settings to persist it. Existing names replace the corresponding view. Camera preset IDs in savedViews override the corresponding built-in buttons.
- Admin > Global Settings: JSON editor for the complete saved configuration. Start by saving the current configurator once; initial value is null when no defaults exist.
- Admin > 3D File Settings: choose any FBX file, edit offset (mm), rotation (degrees), scale and material overrides; save. Overrides apply whenever that file is used in the configurator. Files not referenced by the current product catalog remain configurable but are not automatically added to product options.

The current settings are loaded when the configurator opens. Reload after admin changes. Per-file material/PBR overrides take priority over component settings; Reset File Overrides removes this priority. Per-file position offsets add to component offsets and assembly coordinates.

Backend endpoints: GET /api/settings, PUT /api/settings, GET /api/models. Settings are stored atomically in data/settings.json, excluded from Git and outside the public frontend directory. Set SETTINGS_DIR to use a persistent production directory.

Local writes require a loopback connection, localhost Host/Origin and the custom settings header. Production writes require ADMIN_TOKEN on the backend; enter it in the admin page (session storage only). The public configurator may load defaults without this token. Only administrators with the token may overwrite shared defaults. No VPS secrets are embedded in the frontend. Configure ADMIN_TOKEN before any future deployment; do not place it in Git. The Nginx/systemd/Docker templates have been prepared for persistent settings but not applied remotely.

The global editor configures saved runtime settings. Product business rules, API credentials and source-code behavior are not exposed as arbitrary executable settings.
