# Studio rendering implementation

Implemented locally on 2026-10-27. Frontend has not been redeployed.

## Actual renderer

The existing Three.js 0.170 app now uses a pinned compatible WebGL progressive path tracer (`three-gpu-pathtracer` 0.0.23, `three-mesh-bvh` 0.8.3). This delivers full-scene tracing without replacing the application with C2/Svelte or upgrading its renderer to a newer WebGPU stack in the same change. C2's custom ReSTIR engine has not been ported. These are deliberate compatibility choices, not claims that this is the newest library release.

`src/rendering/StudioRenderer.js` owns physical scene snapshots, camera conversion, tracing, denoise and export. Scene coordinates are converted from mm to metres in a separate render snapshot; live model transforms and saved UI coordinates stay in mm.

## User controls

- Studio HD > Studio HD Render PRO: progressive preview after 600 ms of idle. Moving the camera/pointer or dragging a gizmo shows the responsive raster preview.
- Studio HD > 3D Interactive: raster rendering only.
- Environment > Progressive Path Tracing Quality: Preview Samples (default 128), Light Bounces (default 8), 4K Export Samples (default 512), Edge-preserving Denoise.
- Studio HD > Download 4K Render: independent 3840x2160 traced render, PNG output, progress and cancellation in the viewport toolbar.
- Existing Save Settings persists quality options in the existing waveletParams settings object. Old saved filter fields remain readable but are no longer shown as active filter controls.
- `?render=interactive` starts local inspection in raster mode when no saved mode overrides it.

The old disconnected Wavelet/SPP controls were replaced by controls connected to this renderer. The denoiser is the library's small edge-preserving spatial filter, not SVGF or an AI denoiser.

## Visual changes

- Procedural linear HDR studio environment with broad softbox highlights; PMREM in raster and unfiltered environment sampling in tracing.
- Product lights converted into broad area lights for traced studio shots; current color/intensity settings are retained.
- Neutral physical ground with traced contact/indirect shadows.
- Small procedural normal/roughness detail for brushed metal and rubber presets, preserving diffuse image/UVW controls.
- Product-only bounds for initial camera framing; transform-control geometry is excluded.
- Helpers, grid, labels, selection outlines and gizmos excluded from final traced scene.

## Runtime behavior

Scene/material/light/transform edits invalidate the render snapshot. Camera changes update only the tracing camera and reset accumulation. A converged preview stops adding samples; returning from a raster interaction presents the cached traced result again. Preview runs at 75% drawing-buffer size with 4x4 work tiles; final export uses full resolution with 4x4 work tiles. Tiles distribute work across calls, but the full render targets still require GPU memory.

Export freezes product matrices and cloned material parameters, creates a separate renderer/camera and leaves the live camera/canvas dimensions untouched. Cancel releases the export resources and returns to the viewport. Texture assets and shared source FBX geometry are not disposed with temporary snapshots.

The pinned library's public dispose function references a removed internal field. The adapter explicitly cleans up the corresponding resources in this pinned version; changing the package version requires revisiting this compatibility block.

## Verification

- Production build passes; backend's eight tests pass.
- Actual Aardwolf scene (approximately 35k product triangles) compiled and accumulated traced samples in Chrome with no page errors.
- 480x360 PNG export at 64 samples completed; cancellation was tested separately.
- The live camera position/aspect is checked across export.
- Export images are visually inspected for composition, materials, floor contact and missing helpers.

The complete 4K/512-sample job is configurable but not used as a speed benchmark. Render duration depends on the client GPU. First shader compilation can take time; the viewport reports preparation state and retains raster preview. Initialization/runtime tracing failures fall back to raster with status rather than claiming a successful path-traced output.

The implementation does not make geometry bevels, replace missing artist-authored textures or add a GPU worker to the VPS. Those remain further quality improvements for production assets.
