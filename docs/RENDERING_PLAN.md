# High-quality rendering plan for Aardwolf

Assessment date: 2026-10-27. This is a source review and implementation plan, not a completed renderer upgrade or a measured GPU benchmark. No frontend or VPS deployment is part of this review.

## Decision

Build one shared product scene with two rendering paths:

1. Interactive raster preview for selection, orbit, transforms and material editing.
2. Progressive full-scene path tracing for a stationary preview and final product images.

Prioritize studio lighting, correct materials, surface detail and geometry before adding screen-space effects. Use C2 as the strongest local reference for physical shading, environment sampling and path integration. Run a bounded proof of concept against a Three.js-native path tracer before committing to a custom C2 adapter. Do not combine all twelve demo pipelines.

The preferred production candidate for the first integration experiment is `three-gpu-pathtracer` with its current WebGPU API, subject to dependency and scene compatibility checks. The local Aardwolf Three.js 0.170 dependency is not assumed compatible with current packages. Lock a tested version set in an isolated experiment; do not upgrade the configurator and renderer simultaneously without regression checks. C2 remains the alternative if it produces a materially better result and its integration cost is justified.

## What the existing app actually renders

Source: `src/components/ThreeViewer.jsx`, `src/context/ConfiguratorContext.jsx` and `src/components/tabs/TabEnvironment.jsx`.

- Uses WebGLRenderer, ACES tone mapping, PMREM/RoomEnvironment, shadow lights and MeshPhysicalMaterial.
- Animation loop calls `renderer.render(scene, camera)` directly.
- `viewportMode` currently changes wrapper classes and HUD visibility, not the rendering algorithm.
- Wavelet/SPP/iteration settings are stored in context and saved to settings, but are not consumed by a path-tracing or denoising pass in ThreeViewer.
- 4K export resizes the live renderer and renders a single raster frame. It has no sample convergence, final denoise or independent export job.
- A material edit can rebuild model groups; a path tracer must avoid unnecessary BVH rebuilds and release replaced GPU resources.
- Product scene uses assembly coordinates in millimetres. Rendering experiments must explicitly convert units, including camera, lights, attenuation distances and depth of field, while keeping UI coordinates intact.
- Diffuse maps and UVW transforms now exist. These must survive conversion to a tracing material rather than being replaced by preset defaults.

Therefore, changing the existing wavelet sliders cannot currently deliver the promised filtering or path-traced lighting.

## Route inventory and reuse assessment

Routes below are resolved from `D:/Dropbox/_Documents/Threejs/Domenicobrz/src/projects.js`; they are independent demo entry points, not one compatible renderer framework. `run_dashboard.js` serves these paths and redirects its root to the dashboard build.

| Demo | Actual local entry / source | Finding and use for Aardwolf |
| --- | --- | --- |
| C2 WebGPU Renderer | `C2-Renderer/build/`; `src/lib/C2.ts`, `sceneManager.ts`, `segment/integrators/`, `materials/`, `envmap/` | Full triangle/BVH pipeline with custom materials; MIS, environment importance sampling, anisotropic BRDFs, multiscatter compensation and separate simple/PT and ReSTIR-PT implementations. Primary reference for final quality; not a drop-in WebGLRenderer replacement. |
| R3F Meteor Impact | `R3F-IP-Meteor-Impact/dist/index.html`; `src/App.jsx`, `Scene.jsx` | Uses HDR environments, compositing and many texture-baked MeshBasicMaterial surfaces. Useful for art direction and coherent lighting; its cinematic appearance does not establish dynamic GI quality for editable CAD parts. |
| Anime.js Threejs | `Anime.js-demos/demos/threejs1/main.js` | Box scene with MeshPhongMaterial, shadow maps and animation/interaction. Useful for transitions only; no advanced rendering core to adopt. |
| GLSL Path Tracer | `GLSL-path-tracer/index.html`; `libs/createMeshes.js`, `libs/globals.js` | Specialized capsule-only tracer and KD-tree/BVH approach. General FBX triangle assemblies would require a substantial rewrite; do not use as product renderer. |
| Blurry | `Blurry/index.html`; `libs/createScene.js`, `libs/globals.js` | Stochastic depth of field for lines/quads. Useful as sampling/bokeh reference, not an arbitrary mesh DOF solution. |
| Threejs Practice 2 | `Threejs-in-practice/three-in-practice-2/index.html`; `src/index.js` | HDR + PMREM, physical materials, soft shadows and composition. Good baseline for a better raster studio. Uses older Three.js APIs that must be translated, not copied unchanged. |
| Glass Absorption | `threejs-glass-absorption/`; `js/main.js` | Depth-peeling/travel-distance absorption approximation, with no physically correct refracted path. Optional glass-study reference; secondary to metals/rubber/paint in this product. |
| SSPT | `SSPT-in-threejs/index.html`; `main.js`, `shaders/radiance.js`, `radianceAccum.js`, `history.js`, `atrous.js` | Screen-space ray marching plus temporal accumulation/SVGF-style filtering. Useful reference for temporal invalidation and denoising; missing off-screen geometry makes it unsuitable as the final-image ground truth. |
| Realtime Path Tracing | `Realtime-path-tracing-in-chrome/Cornell box/index.html`; `main.js`, `shaders/` | Actual multi-pass buffers for position/normal/material, history, radiance and A-trous filtering. Good explanation of what Aardwolf's current sliders would need behind them. Demo-specific pipeline requires adaptation to arbitrary geometry and current materials. |
| Dispersion Caustics | `WebGL-dispersion-caustics/`; `src/libs/index.js`, `computeCaustics`, shader modules | CPU photon accumulation and a specialized receiver plane; source notes hardcoded plane size. Useful for optional glass hero shots, not a general industrial rendering foundation. |
| WebGL2 SSR | `WebGL2-Screen-space-reflections/`; `src/libs/main.js` and shader modules | Custom PBR/reflection pipeline; README calls implementation unoptimized. Useful reflection reference, not a turnkey upgrade. |
| SSR & TAA | `SSR-TAA-in-threejs-/build/index.html`; `index.js`, `Components/ssr.js`, `taa.js`, `atrous.js`, `ssrBuffers.js` | Rough reflection sampling + temporal reconstruction. Strongest local reference for a hybrid raster reflection enhancement. Package references Three.js 0.129; shader/material integration must be ported and measured. |

Read README claims together with implementation. C2's Svelte stores/UI are coupled into core modules; its `C2Scene` contains triangles, materials, envmap and its own camera. `meshToTriangles()` accepts a material index for the conversion: preserve mesh groups and material assignment explicitly rather than applying a single material to an entire assembly. `SceneDataManager.update()` rebuilds scene buffers/BVH and even notes that the update can be expensive.

C2 has an MIT LICENSE in the local checkout. Preserve attribution if reusing it. Check licenses of each borrowed module and asset independently.

## Target look

- Industrial product photography: neutral background, readable yellow paint/logo, brushed metal highlights, matte rubber and clear contact with the floor.
- Large key softbox, controlled fill and rim light; a useful reflection shape in metal is more important than increasing light count.
- HDR illumination and background can be independently controlled. Avoid baking workshop colors into every material.
- Preserve diffuse branding; add real roughness/normal detail for rubber bellows and brushed steel. Material names alone do not create those details.
- Remove selection outlines, gizmos, grids, telemetry and UI overlays from final output.
- Default product image keeps the whole machine sharp. DOF is opt-in for close-up marketing views. Bloom, chromatic aberration and vignette are off by default.

## Proposed architecture

```text
VPS settings + model files + texture assets
                 |
          ProductSceneBuilder
          /                 \
 InteractiveRenderer       SceneSnapshot / MaterialAdapter
 raster + HDR + shadows       |
          |              ProgressiveRenderer
       overlays          full geometry + BVH + physical lights
                              |
                       ExportRenderJob
                       samples -> optional denoise -> tone map -> PNG
```

Suggested files, created only during implementation:

- `src/rendering/ProductSceneBuilder.js`: shared model catalog, transforms, geometry and materials.
- `src/rendering/MaterialAdapter.js`: diffuse image, wrap/repeat/offset/rotation, roughness, metalness, clearcoat, normal maps and glass volume parameters.
- `src/rendering/InteractiveRenderer.js`: responsive raster pipeline and selection overlays.
- `src/rendering/ProgressiveRenderer.js`: feature detection, tracing, invalidation, samples and cancellation.
- `src/rendering/ExportRenderJob.js`: immutable snapshot, independent output size/camera, progress and cleanup.
- `src/rendering/qualityPresets.js`: only settings that actually affect the selected engine.

Keep React/context responsible for user intent and saved settings; keep renderer resource lifecycles outside the large component. Do not store GPU resources or sample buffers in JSON settings.

## Implementation stages and acceptance gates

### 1. Establish a trustworthy baseline

Capture three fixed scenes: full machine, close-up tube/logo/rubber, metal handle/pump. Add one glass swatch only for optional transmission testing. Record camera, selected FBX, transforms, maps, lighting, resolution and GPU/browser.

Audit all current material assignments, UVs, normal directions and triangle counts. Check if model corners need bevels/normals work: no renderer can produce a realistic edge highlight on a perfectly sharp or broken surface. Keep originals; convert to optimized GLB only after comparing hierarchy, normals, dimensions and material groups.

Acceptance: reproducible baseline screenshots; labels in the UI match actual working rendering features. No performance promises before running on the target GPU.

### 2. Improve raster studio first

Correct color management: color/diffuse textures in sRGB, roughness/metalness/normal data in their appropriate non-color space, lighting calculations linear, output conversion and tone mapping applied once. Use a calibrated HDR studio, neutral floor and well-shaped key/fill/rim reflections. Use area-light look in raster through supported light/environment techniques; do not assume a rectangular light provides raster shadows automatically.

Tune shadow camera extents around the assembly, bias/normalBias in consistent units, and contact shadow/AO strength. Avoid dark AO halos. Introduce selective AA and adaptive resolution only after comparing current MSAA output.

Acceptance: visibly better material separation and contact shadows in the fixed scenes; unchanged orbit/selection/UVW/save behavior.

### 3. Compare two progressive render prototypes

Candidate A: Three.js-native WebGPU path tracer with a pinned, compatible dependency set. Candidate B: C2 adapter for the same product snapshot.

Compare at identical camera, lighting, scene scale, texture transforms, output size and wall-clock budget. Confirm multi-material support, thin surfaces, texture seams, clearcoat, normal maps, glass, shadows, resize and device-loss fallback. First use simple unbiased/path-tracing mode as a reference; evaluate ReSTIR acceleration later for stability and speed, not as an assumed quality win.

Acceptance: choose the candidate that preserves product materials and converges reliably with maintainable code. Do not choose C2 just because its demo is more cinematic; do not reject it merely because it uses Svelte.

### 4. Progressive Studio mode

During orbit, gizmo drag or material adjustment: use responsive raster. After a short idle interval, accumulate tracing samples. Reset accumulated lighting when the scene changes; preserve camera pose. On camera motion, update camera and restart samples; on material/texture/light changes update the relevant buffers. Rebuild/refit geometry acceleration only when geometry/transforms actually require it.

Proposed starting targets, to tune by measurement: 32-64 spp for preview, 128-256 for a cleaner still. These are quality knobs, not guaranteed convergence. Thin glossy metal and glass may need more samples.

Acceptance: no ghosted old object positions or old textures, no camera jumps, and no mixed-scene samples. Cancel jobs during repeated edits and dispose obsolete resources.

### 5. Real final-image export

Freeze a scene snapshot, switch off helper geometry, frame through the saved camera and render independently of the interactive canvas. Start testing 4K at 256-1024 spp, 6-8 bounces and a measured per-frame/tile work budget. Treat these as initial ranges, not fixed requirements for every material.

Do not stretch viewport pixels to 4K. Use actual target resolution, preserve intended crop/aspect, and render tiles if needed. Denoise only after sufficient samples; inspect text/logo edges, thin tubing and rough reflections. Export should show resolution, completed samples/progress, cancel and result preview. Restore UI state in a finally path after success, failure or cancel.

A single 3840x2160 RGBA32F buffer is about 126.6 MiB, before history, geometry, textures and denoising buffers. Full-resolution multi-pass SVGF can be costly; budget memory explicitly. Use GPU limits and test reduced resolution/tiling rather than assuming 4K always fits.

Acceptance: 4K image has real lighting convergence, correct logo/UVW, clean alpha/background choice and no gizmo/grid/HUD. A cancelled job leaves the viewport usable.

### 6. Optional refinements

Only after a stable final renderer: brushed-metal anisotropy, carefully limited rough reflections in raster, close-up DOF, physical glass absorption and optional caustics. Benchmark SSR/TAA in a separate hybrid mode; do not layer SSR on top of final full-scene traced reflections.

## Settings and backend responsibilities

Extend saved settings with a versioned rendering schema: engine, HDR asset/version, intensity/rotation, studio light rig, quality preset, sample/bounce budget, output size, background/alpha, denoise and per-model material maps. Store camera/world transforms consistently across preview and final render.

VPS stores configuration and assets. Browser GPU does preview/path tracing unless a separate render-worker system is deliberately added. The current VPS is not established as a GPU rendering host. Do not promise server-side path-traced jobs on the existing Node API.

Persist user choices, not transient counters, GPU handles, noisy frame history or partially converged images. Add settings migrations and fallback for older saved data. Texture cache needs a resource/memory policy when changing UVW frequently.

## Verification matrix

| Area | Required check |
| --- | --- |
| Product fidelity | dimensions, hierarchy, all configured parts, normals and material groups |
| Surface fidelity | tube logo, repeat/mirror/clamp, rotation, UV seam, metal/paint/rubber differentiation |
| Camera | saved views match raster/traced framing; edits never reset pose |
| Temporal state | camera/material/light/transform changes discard incompatible samples |
| Performance | frame times, convergence over time, BVH build time, texture memory; actual desktop and lower-end target |
| Compatibility | WebGPU available/unavailable, initialization failure, resize, device loss and raster fallback |
| Export | true dimensions, no helpers, consistent colors, cancel/retry, no live viewport corruption |
| Persistence | VPS save/load restores engine, cameras, material textures and render preset |

Do not declare one solution visually superior until both candidates have rendered the actual Aardwolf machine. This review did not run all demos or collect GPU timings.

## External references checked

- Three.js color management: https://threejs.org/manual/pages/color-management.html
- Three.js WebGPURenderer: https://threejs.org/manual/pages/webgpurenderer
- Current Three.js-native path tracer API and changelog: https://gkjohnson.github.io/tools/docs/three-gpu-pathtracer/
- Source/package compatibility to check when pinning: https://github.com/gkjohnson/three-gpu-pathtracer

The checked documentation currently exposes a WebGPUPathTracer path; older WebGL examples should not be treated as the current integration contract. WebGPURenderer itself is not automatically a full-scene path tracer.
