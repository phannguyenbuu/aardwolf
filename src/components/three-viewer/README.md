# ThreeViewer

`../ThreeViewer.jsx` renders the viewport controls and dialogs.
`useThreeViewport` connects the configurator context to the viewport lifecycle.
The remaining modules each own a distinct responsibility:

| Module | Responsibility |
| --- | --- |
| `useViewportRefs` | Stable handles for scene objects, renderers, controls, caches, and camera animation |
| `useViewportScene` | Mount/unmount WebGL, postprocessing, stage, controls, pointer listeners, and ResizeObserver |
| `createCornellEnvironment` | Build the Cornell room, emitter, and bounce lights |
| `startViewportLoop` | Camera animation/telemetry and choosing raster, legacy, or HDR rendering; returns the frame cancellation function |
| `useModelLoading` | Load selected FBX files, reuse in-flight requests, retry, and prefetch catalog bytes |
| `useAssembly` | Retain/rebuild part groups, apply initial materials, generate the workpiece, and frame the initial camera |
| `useAssemblyInteractions` | Offsets, grip alignment, step visibility, gizmo attachment, and selection bounds |
| `useViewportMaterials` | Reapply changed materials and update the element catalog |
| `useCameraRestore` / `useCameraPresets` | Saved-camera restoration and explicit camera transitions |
| `useViewportLighting` | Theme visibility, lights, and Cornell colors |
| `useViewportCapture` / `useViewportExport` | Dialog preview/capture and cancellable 4K export |

## Lifecycle rules

- Initialize refs before passing them to another hook. The `refs` object and its
  handles remain stable across renders; changing `.current` does not render React.
- Scene initialization is tied to mount/unmount. Reloading files clears the
  appropriate model cache and increments the model retry counter, without
  recreating the camera or WebGL canvas.
- Selected models load before assembly updates. Catalog prefetch stores bytes;
  parsing is deferred until selection. Effect cleanup cancels scheduled startup
  and ignores obsolete results in that loading effect.
- Keep the assembly sync and interaction effects in order: rebuild, offsets,
  grip alignment, visibility, then selection/gizmo updates.
- Frame the camera once. Assembly/material edits must preserve user camera
  changes, and delayed settings must not overwrite an already adjusted view.
- Path trace dialogs own the GPU while open; the viewport loop skips rendering.
- Scene cleanup owns animation cancellation, observers, pointer listeners,
  controls, renderers, and postprocessing disposal. Do not start a second loop
  from another hook.

## Validation

Run the render-loop regression tests:

```powershell
node --test src/components/three-viewer/startViewportLoop.test.js
npm run build
```

The refactor also has a local browser comparison harness in
`tmp/check-three-viewer.mjs`. It compares the original and refactored components
under React StrictMode, using a small real FBX as a fixture for model requests.
It covers loading, part offsets, camera presets, material changes without camera
movement, snapshots, reload, and renderer disposal on unmount. Backend requests
are blocked and GPU shadows are disabled in that harness; it does not benchmark
production models or validate full photorealistic exports.

Validated on 2026-10-30: four render-loop tests pass; the production build passes;
original/refactored scene snapshots match after initial load, offset changes,
camera preset changes, and reload. Both variants also pass the capture,
camera-preservation, and StrictMode renderer-disposal checks.
