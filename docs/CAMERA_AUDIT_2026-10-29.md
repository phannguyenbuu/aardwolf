# Camera audit — localhost, 2026-10-29

Runtime audit: 24 User Setting interactions (accordion groups, enabled crane/jib/WLL/environment/handle radios, blank panel, reload models, resize, window focus) preserve camera UUID, position, target and FOV. Resize changes aspect only. Eleven context actions (material, theme, viewport mode, dimensions, unit, admin mode and four admin tabs) preserve the pose. OrbitControls floating-point noise was rounded to 0.0001 for comparison.

Confirmed bug: delayed initial GET /api/settings restores global.camera after the user has already manipulated the live view. Reproduced by gating the response, adjusting camera, then releasing the response. Position changed from [5000,4000,6000] to the saved view. Fixed by marking camera user-controlled on OrbitControls start and explicit camera-preset requests; pending saved pose is discarded and initial framing cannot overwrite the active view. Orbit interaction also stops an in-progress preset animation. Controls listener and controls instance are disposed on teardown.

Post-fix delayed-settings reproduction: position remains [5000,4000,6000]. Normal startup still restores saved view until the user interacts. Explicit view presets and turntable remain deliberate camera actions. Source initialization executes once (sceneReload is never incremented); model reload clears model caches without recreating camera. Raster/path tracing/SSR camera copies do not mutate the live camera. Export render uses a cloned camera. HMR edits to ThreeViewer can still remount during development, unlike ordinary panel clicks.

Other visible changes: accordion scrollIntoView scrolls the page; responsive viewport resize changes projection aspect; progressive renderer invalidation clears samples after scene/material/light edits. These are distinct from camera-position resets.

Scripts: work/audit-camera.mjs and work/audit-camera-state.mjs. Tests alter local browser state only; no shared settings were saved. No production deployment in this fix.
