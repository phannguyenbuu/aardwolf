# Blender / Cycles automatic bake

Requires Blender 4.x/5.x with Cycles. Validated on Blender 5.1. Run from repository root:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.1\blender.exe' `
  --background --factory-startup --python-exit-code 1 `
  --python tools/bake/cycles_bake.py -- `
  --manifest tools/bake/example.json --device AUTO
```

Input and output paths resolve relative to the manifest. Output must not already exist; choose a new directory for every run. Failed jobs leave partial output for diagnosis. The source asset is never overwritten. Use --python-exit-code 1 so script failures produce a failing process exit code.

## GPU

AUTO probes OPTIX, CUDA, HIP, ONEAPI and METAL, then falls back to CPU. Select explicitly with --device CUDA (NVIDIA), OPTIX, HIP (AMD), ONEAPI (Intel), METAL (Apple), or CPU. An explicitly requested unavailable backend fails rather than silently using CPU. Device enumeration alone does not prove a backend can render; if a driver/kernel fails, rerun into a new output folder with CUDA or CPU. This script does not retry a partially failed GPU bake automatically. Result manifest records the backend and device names.

GPU memory use grows with geometry, textures and resolution. Start with 512/64 samples on a real asset, then increase to 1024–2048 and 128–512 samples based on noise; 3000 is the maximum accepted target, not a required setting.

## Inputs

- GLB/glTF preferred: retains PBR parameters and textures more predictably than FBX.
- FBX: import supported, but FBX shader conversion cannot reproduce arbitrary V-Ray/Corona/Three.js materials. Explicit overrides or canonical GLB exported from the web are needed for faithful web material matching.
- One asset or one fixed assembly per job. Existing imported lights remain; job lights are additive. Use an asset without extra lights for a controlled studio rig.
- `materials` keys match exact imported material names. No automatic guess from a name such as “metal” or “wood”. Unmatched names retain imported materials. Manifest is a trusted local job configuration.

```json
{
  "input": "model.glb",
  "output": "baked/model-v1",
  "resolution": 1024,
  "samples": 128,
  "margin": 16,
  "passes": ["baseColor", "roughness", "normal", "ao", "irradiance"],
  "worldStrength": 0.35,
  "lights": [{ "position": [3, 10, 4], "target": [0, 0, 0], "power": 1500, "size": 5 }],
  "materials": {
    "Paint": { "baseColor": "#ff9900", "roughness": 0.6, "metallic": 0 },
    "Wood": { "baseColorMap": "wood.png", "normalMap": "wood-normal.png", "roughness": 0.65 },
    "Steel": { "baseColor": "#c0c0c0", "metallic": 1, "roughness": 0.3 },
    "Glass": { "transmission": 1, "ior": 1.45, "roughness": 0.05 }
  }
}
```

Color hex is sRGB and converted to linear before assigning nodes. Base-color images use sRGB; normal, roughness and metalness images use Non-Color. Map override keys: baseColorMap, roughnessMap, metallicMap, normalMap. Normal maps must be tangent-space OpenGL orientation. Maps default to source UV0; uvMap can explicitly select a named UV. Material overrides require a Principled BSDF node. Skin/leather, wood, rubber and paint use the same PBR inputs; complex procedural graphs are retained only to the extent Blender imports/supports them.

Positions and size are Blender world units (normally metres); watts apply to area lights. Verify imported FBX scale against a known dimension before production baking. The script does not guess millimetre/metre scale. AO and irradiance include other imported meshes in the same job; choose isolated component jobs for reusable component bakes.

## Outputs

- `model.glb`: original PBR materials, source UV0 and generated BakeUV. No destructive replacement of glass/metal with flat color.
- One PNG per mesh/pass, not one global atlas. Base color is sRGB; the remaining images contain linear data.
- `bake-manifest.json`: object name, bake UV name, texture filenames, hashes, resolution, samples, device and elapsed time.

Texture maps are **not automatically bound** in the exported GLB. A runtime loader must apply the bake UV channel (verify TEXCOORD index in the export), lightmap/AO and color space correctly. Original UVs continue to drive logos and PBR maps. This script is the offline generation stage; it does not switch the configurator to baked rendering.

`normal` bakes the current mesh shading; it is not a high-to-low projection/cage workflow. `irradiance` uses diffuse DIRECT + INDIRECT without material color. Pure metals/glass may have little or no diffuse contribution: keep runtime environment reflection/transmission. Do not multiply this irradiance over real-time diffuse lighting again. No denoise, texture compression, ORM packing, LOD creation, global atlas or cache invalidation is implemented in this initial script. Preserve linear intermediates / add a denoise stage before using high quality production lightmaps. PNG linear lightmaps here are 8-bit and are intended for initial validation, not HDR energy preservation.

## Smoke test

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.1\blender.exe' --background --factory-startup --python-exit-code 1 --python tools/bake/cycles_bake.py -- --manifest tools/bake/smoke.json --smoke --device AUTO
```

Creates an orange cube with 32px maps at 2 samples. Validated all five passes, GLB export, and output manifest on this machine using OPTIX / NVIDIA GeForce GTX 1080 Ti. These are test-quality settings, not final artwork.
