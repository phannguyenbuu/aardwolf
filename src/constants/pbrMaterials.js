/**
 * Photorealistic PBR Material Library for Three.js & WebGL Suites
 * Extracted and calibrated from:
 * - Realtime Path Tracing (Cornell Box)
 * - Three.js Glass Absorption (Beer-Lambert spectral decay)
 * - WebGL Dispersion Caustics (Cauchy IOR & Dispersion)
 * - WebGL2 Screen Space Reflections & SSPT (Cook-Torrance GGX & Fresnel Schlick)
 * - C2 WebGPU Renderer (Anisotropic specular highlights)
 */
import * as THREE from 'three';
import { STANDARD_MATERIALS } from './standardMaterials.js';

export const PBR_MATERIAL_CATEGORIES = {
    METALS: 'Metals',
    GLASS: 'Glass & Optics',
    PLASTICS: 'Polymers & Enamels',
    RUBBERS: 'Rubbers & Suction',
    SURFACES: 'Ground & Surfaces'
};

export const LEGACY_PBR_MATERIALS = [
    {
        id: 'workpiece_wood', name: 'Workpiece Wood', category: PBR_MATERIAL_CATEGORIES.SURFACES,
        params: { color: '#ffffff', roughness: 0.85, metalness: 0, diffuseImage: '/textures/workpiece-wood.png' }
    },
    // ==========================================
    // METALS (KIM LOẠI)
    // ==========================================
    {
        id: 'gold_24k',
        category: PBR_MATERIAL_CATEGORIES.METALS,
        name: '24K Royal Gold',
        previewColor: '#FFD700',
        badge: 'Precious',
        params: {
            color: 0xffd700,
            metalness: 1.0,
            roughness: 0.12,
            clearcoat: 0.35,
            clearcoatRoughness: 0.1,
            reflectivity: 0.95
        }
    },
    {
        id: 'gold_rose',
        category: PBR_MATERIAL_CATEGORIES.METALS,
        name: 'Rose Gold',
        previewColor: '#B76E79',
        badge: 'Precious',
        params: {
            color: 0xb76e79,
            metalness: 1.0,
            roughness: 0.16,
            clearcoat: 0.25,
            clearcoatRoughness: 0.12
        }
    },
    {
        id: 'aluminum_brushed',
        category: PBR_MATERIAL_CATEGORIES.METALS,
        name: 'Brushed Aluminum',
        previewColor: '#D1D5DB',
        badge: 'Industrial',
        params: {
            color: 0xd1d5db,
            metalness: 0.92,
            roughness: 0.32,
            clearcoat: 0.15,
            clearcoatRoughness: 0.2
        }
    },
    {
        id: 'aluminum_polished',
        category: PBR_MATERIAL_CATEGORIES.METALS,
        name: 'Polished Aluminum',
        previewColor: '#E5E7EB',
        badge: 'Specular',
        params: {
            color: 0xe5e7eb,
            metalness: 0.98,
            roughness: 0.08,
            clearcoat: 0.5,
            clearcoatRoughness: 0.08
        }
    },
    {
        id: 'copper',
        category: PBR_MATERIAL_CATEGORIES.METALS,
        name: 'Pure Red Copper',
        previewColor: '#C87A5B',
        badge: 'Pure Metal',
        params: {
            color: 0xc87a5b,
            metalness: 1.0,
            roughness: 0.18,
            clearcoat: 0.2,
            clearcoatRoughness: 0.15
        }
    },
    {
        id: 'brass',
        category: PBR_MATERIAL_CATEGORIES.METALS,
        name: 'Industrial Brass',
        previewColor: '#D4AF37',
        badge: 'Alloy',
        params: {
            color: 0xd4af37,
            metalness: 0.96,
            roughness: 0.22,
            clearcoat: 0.25,
            clearcoatRoughness: 0.15
        }
    },
    {
        id: 'steel_brushed',
        category: PBR_MATERIAL_CATEGORIES.METALS,
        name: 'Brushed Stainless Steel',
        previewColor: '#8A9EA7',
        badge: 'Structural',
        params: {
            color: 0x8a9ea7,
            metalness: 0.88,
            roughness: 0.35,
            clearcoat: 0.3,
            clearcoatRoughness: 0.25
        }
    },
    {
        id: 'chrome_mirror',
        category: PBR_MATERIAL_CATEGORIES.METALS,
        name: 'Mirror Polished Chrome',
        previewColor: '#F8FAFC',
        badge: 'Ultra Mirror',
        params: {
            color: 0xf8fafc,
            metalness: 1.0,
            roughness: 0.02,
            clearcoat: 1.0,
            clearcoatRoughness: 0.02,
            reflectivity: 1.0
        }
    },
    {
        id: 'titanium_dark',
        category: PBR_MATERIAL_CATEGORIES.METALS,
        name: 'Dark Titanium',
        previewColor: '#475569',
        badge: 'Aerospace',
        params: {
            color: 0x475569,
            metalness: 0.95,
            roughness: 0.32,
            clearcoat: 0.2,
            clearcoatRoughness: 0.2
        }
    },
    {
        id: 'cast_iron',
        category: PBR_MATERIAL_CATEGORIES.METALS,
        name: 'Rough Cast Iron',
        previewColor: '#27272A',
        badge: 'Heavy Cast',
        params: {
            color: 0x27272a,
            metalness: 0.82,
            roughness: 0.65,
            clearcoat: 0.05
        }
    },

    // ==========================================
    // GLASS & OPTICS (KÍNH & QUANG HỌC)
    // ==========================================
    {
        id: 'glass_clear',
        category: PBR_MATERIAL_CATEGORIES.GLASS,
        name: 'Ultra-Clear Float Glass',
        previewColor: '#E2E8F0',
        badge: 'Float Glass',
        params: {
            color: 0xffffff,
            transmission: 0.98,
            opacity: 1.0,
            transparent: true,
            ior: 1.52,
            roughness: 0.02,
            thickness: 1.5,
            specularIntensity: 1.0
        }
    },
    {
        id: 'glass_amber',
        category: PBR_MATERIAL_CATEGORIES.GLASS,
        name: 'Amber Absorption Glass',
        previewColor: '#CD5615',
        badge: 'Absorption',
        params: {
            color: 0xcd5615,
            transmission: 0.92,
            opacity: 1.0,
            transparent: true,
            ior: 1.54,
            roughness: 0.04,
            attenuationColor: new THREE.Color(0xcd5615),
            attenuationDistance: 0.45,
            thickness: 2.0
        }
    },
    {
        id: 'glass_tinted_blue',
        category: PBR_MATERIAL_CATEGORIES.GLASS,
        name: 'Cyan/Blue Tinted Glass',
        previewColor: '#38BDF8',
        badge: 'Solar Tint',
        params: {
            color: 0xe0f2fe,
            transmission: 0.95,
            opacity: 1.0,
            transparent: true,
            ior: 1.52,
            roughness: 0.03,
            attenuationColor: new THREE.Color(0x0284c7),
            attenuationDistance: 0.75,
            thickness: 1.8
        }
    },
    {
        id: 'glass_emerald',
        category: PBR_MATERIAL_CATEGORIES.GLASS,
        name: 'Emerald Architectural Glass',
        previewColor: '#10B981',
        badge: 'Tinted',
        params: {
            color: 0xecfdf5,
            transmission: 0.94,
            opacity: 1.0,
            transparent: true,
            ior: 1.53,
            roughness: 0.03,
            attenuationColor: new THREE.Color(0x059669),
            attenuationDistance: 0.6,
            thickness: 1.8
        }
    },
    {
        id: 'glass_frosted',
        category: PBR_MATERIAL_CATEGORIES.GLASS,
        name: 'Frosted Sandblasted Glass',
        previewColor: '#CBD5E1',
        badge: 'Diffused',
        params: {
            color: 0xf8fafc,
            transmission: 0.88,
            opacity: 1.0,
            transparent: true,
            ior: 1.48,
            roughness: 0.44,
            thickness: 1.0
        }
    },
    {
        id: 'glass_dispersion',
        category: PBR_MATERIAL_CATEGORIES.GLASS,
        name: 'Dispersion Prism Glass',
        previewColor: '#A855F7',
        badge: 'Dispersion',
        params: {
            color: 0xffffff,
            transmission: 0.98,
            opacity: 1.0,
            transparent: true,
            ior: 1.62,
            roughness: 0.02,
            thickness: 2.5,
            specularIntensity: 1.2
        }
    },

    // ==========================================
    // POLYMERS & PLASTICS (NHỰA & LỚP PHỦ)
    // ==========================================
    {
        id: 'plastic_yellow_aardwolf',
        category: PBR_MATERIAL_CATEGORIES.PLASTICS,
        name: 'Aardwolf Safety Yellow',
        previewColor: '#F59E0B',
        badge: 'OEM Coating',
        params: {
            color: 0xf59e0b,
            metalness: 0.05,
            roughness: 0.18,
            clearcoat: 0.85,
            clearcoatRoughness: 0.1,
            reflectivity: 0.7
        }
    },
    {
        id: 'plastic_crimson_gloss',
        category: PBR_MATERIAL_CATEGORIES.PLASTICS,
        name: 'Glossy Crimson Enamel',
        previewColor: '#DC2626',
        badge: 'High Gloss',
        params: {
            color: 0xdc2626,
            metalness: 0.02,
            roughness: 0.08,
            clearcoat: 0.98,
            clearcoatRoughness: 0.06
        }
    },
    {
        id: 'plastic_piano_black',
        category: PBR_MATERIAL_CATEGORIES.PLASTICS,
        name: 'Glossy Jet Piano Black',
        previewColor: '#111827',
        badge: 'Piano Finish',
        params: {
            color: 0x111827,
            metalness: 0.05,
            roughness: 0.05,
            clearcoat: 1.0,
            clearcoatRoughness: 0.03
        }
    },
    {
        id: 'plastic_white_enamel',
        category: PBR_MATERIAL_CATEGORIES.PLASTICS,
        name: 'Glossy Ceramic White',
        previewColor: '#F9FAFB',
        badge: 'Ceramic Enamel',
        params: {
            color: 0xf9fafb,
            metalness: 0.02,
            roughness: 0.1,
            clearcoat: 0.9,
            clearcoatRoughness: 0.08
        }
    },
    {
        id: 'plastic_matte_abs',
        category: PBR_MATERIAL_CATEGORIES.PLASTICS,
        name: 'Matte Heavy ABS',
        previewColor: '#374151',
        badge: 'Matte ABS',
        params: {
            color: 0x374151,
            metalness: 0.0,
            roughness: 0.65,
            clearcoat: 0.0
        }
    },
    {
        id: 'polymer_polycarbonate',
        category: PBR_MATERIAL_CATEGORIES.PLASTICS,
        name: 'Translucent PC',
        previewColor: '#94A3B8',
        badge: 'Translucent',
        params: {
            color: 0xf1f5f9,
            transmission: 0.78,
            transparent: true,
            opacity: 0.95,
            ior: 1.58,
            roughness: 0.32,
            thickness: 1.2
        }
    },

    // ==========================================
    // RUBBERS & SUCTION (CAO SU & GIÁC HÚT)
    // ==========================================
    {
        id: 'rubber_suction_pad',
        category: PBR_MATERIAL_CATEGORIES.RUBBERS,
        name: 'Vacuum Suction Pad',
        previewColor: '#18181B',
        badge: 'Heavy Grip',
        params: {
            color: 0x18181b,
            metalness: 0.0,
            roughness: 0.88,
            clearcoat: 0.0
        }
    },
    {
        id: 'rubber_silicone_orange',
        category: PBR_MATERIAL_CATEGORIES.RUBBERS,
        name: 'Orange Silicone',
        previewColor: '#EA580C',
        badge: 'High Heat',
        params: {
            color: 0xea580c,
            metalness: 0.0,
            roughness: 0.72,
            clearcoat: 0.1
        }
    },
    {
        id: 'rubber_corrugated_tube',
        category: PBR_MATERIAL_CATEGORIES.RUBBERS,
        name: 'Corrugated Bellows',
        previewColor: '#27272A',
        badge: 'Flexible Bellow',
        params: {
            color: 0x27272a,
            metalness: 0.03,
            roughness: 0.82,
            clearcoat: 0.05
        }
    },
    {
        id: 'concrete_ground', category: PBR_MATERIAL_CATEGORIES.SURFACES,
        name: 'Matte Ground', previewColor: '#c6cbd2', badge: 'Surface',
        params: { color: 0xc6cbd2, roughness: 0.7, metalness: 0, clearcoat: 0 }
    }
];

/**
 * Instantiate a live Three.js MeshPhysicalMaterial from library ID
 * @param {string} materialId
 * @param {object} [customOverrides] Optional physical overrides (roughness, metalness, clearcoat, transmission, ior)
 * @returns {THREE.MeshPhysicalMaterial}
 */
const diffuseTextureCache = new Map();
const surfaceTextureCache = new Map();
function getSurfaceDetail(kind) {
    if (surfaceTextureCache.has(kind)) return surfaceTextureCache.get(kind);
    const size = 128, rough = new Uint8Array(size * size * 4), normal = new Uint8Array(size * size * 4);
    let seed = 73;
    const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
    for (let y = 0; y < size; y++) {
        const band = random();
        for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4;
            const noise = kind === 'brushed' ? band * 0.85 + random() * 0.15 : random();
            const r = Math.round(220 + noise * 35);
            rough.set([r, r, r, 255], i);
            const bump = Math.round((noise - 0.5) * (kind === 'brushed' ? 12 : 18));
            normal.set([128 + (kind === 'brushed' ? 0 : bump), 128 + bump, 255, 255], i);
        }
    }
    const make = data => { const texture = new THREE.DataTexture(data, size, size); texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(kind === 'brushed' ? 4 : 12, kind === 'brushed' ? 16 : 12); texture.magFilter = THREE.LinearFilter; texture.minFilter = THREE.LinearMipmapLinearFilter; texture.generateMipmaps = true; texture.needsUpdate = true; return texture; };
    const result = { roughness: make(rough), normal: make(normal) };
    surfaceTextureCache.set(kind, result); return result;
}
export const PBR_MATERIALS = STANDARD_MATERIALS;
export function createPBRMaterial(materialId, customOverrides = null, definitions = {}) {
    if (customOverrides?.originalSurfaces?.length) {
        const { originalSurfaces, ...shared } = customOverrides;
        const materials = originalSurfaces.map(surface => surface.presetId
            ? createPBRMaterial(surface.presetId, { ...shared, ...definitions[surface.presetId] }, definitions)
            : createPBRMaterial(materialId, { ...shared, ...surface }, definitions));
        return materials.length === 1 ? materials[0] : materials;
    }
    const matDef = [...PBR_MATERIALS, ...LEGACY_PBR_MATERIALS].find(m => m.id === materialId || (materialId === 'white_electrical_cabinet' && m.id === 'white_plastic')) || PBR_MATERIALS[3];
    const params = { ...matDef.params, ...(customOverrides || {}) };
    const edgeChamferRadius = params.edgeChamferRadius ?? 0;
    delete params.edgeChamferRadius;
    const diffuseImage = params.diffuseImage;
    const diffuseContrast = params.diffuseContrast ?? 1;
    delete params.diffuseContrast;
    const uvw = params.diffuseUVW || params.uvw || {};
    const bumpUVW = params.bumpUVW || params.uvw || {};
    delete params.diffuseUVW;
    delete params.bumpUVW;
    delete params.diffuseImage;
    delete params.workpieceTextureApplied;
    delete params.groundDefaultApplied;
    delete params.fourMaterialDefaults;
    delete params.chromeDefaultsApplied;
    delete params.plasticDiffuseVersion;
    delete params.rubberTextureVersion;
    delete params.uvw;
    const surface = /brushed/.test(materialId) ? getSurfaceDetail('brushed') : /rubber|abs_matte/.test(materialId) ? getSurfaceDetail('rubber') : null;
    if (surface) {
        params.roughnessMap = surface.roughness;
        params.normalMap = surface.normal;
        params.normalScale = new THREE.Vector2(0.25, 0.25);
    }
    if (diffuseImage) {
        const textureKey = diffuseImage + JSON.stringify(uvw) + ":contrast:" + diffuseContrast;
        if (!diffuseTextureCache.has(textureKey)) {
            const texture = new THREE.TextureLoader().load(diffuseImage, loaded => {
                if (diffuseContrast === 1) { loaded.userData.ready = true; loaded.userData.pendingCopies?.forEach(copy => { copy.image = loaded.image; copy.needsUpdate = true; }); return; }
                const canvas = document.createElement('canvas');
                canvas.width = loaded.image.width;
                canvas.height = loaded.image.height;
                const context = canvas.getContext('2d');
                context.filter = `contrast(${diffuseContrast})`;
                context.drawImage(loaded.image, 0, 0);
                loaded.image = canvas;
                loaded.needsUpdate = true;
                loaded.userData.ready = true;
                loaded.userData.pendingCopies?.forEach(copy => { copy.image = loaded.image; copy.needsUpdate = true; });
                loaded.userData.pendingCopies?.clear();
            });
            texture.colorSpace = THREE.SRGBColorSpace;
            diffuseTextureCache.set(textureKey, texture);
        }
        params.map = diffuseTextureCache.get(textureKey);
        params.map.wrapS = params.map.wrapT = uvw.type === 'clamp' ? THREE.ClampToEdgeWrapping : uvw.type === 'mirror' ? THREE.MirroredRepeatWrapping : THREE.RepeatWrapping;
        params.map.repeat.set(uvw.tileU ?? 1, uvw.tileV ?? 1);
        params.map.offset.set(uvw.offsetU ?? 0, uvw.offsetV ?? 0);
        params.map.center.set(0.5, 0.5);
        params.map.rotation = THREE.MathUtils.degToRad(uvw.rotation || 0);
        if (params.map.image) params.map.needsUpdate = true;
        params.color = '#ffffff';
    }
    
    // Derive a high-contrast grayscale bump from the same source image.
    if (params.bumpImage) {
        const bumpImage = params.bumpImage;
        const contrast = params.bumpContrast ?? 100;
        const key = bumpImage + ':bump:' + contrast + JSON.stringify(bumpUVW);
        if (!diffuseTextureCache.has(key)) {
            const bump = new THREE.TextureLoader().load(bumpImage, loaded => {
                const canvas = document.createElement('canvas');
                canvas.width = loaded.image.width;
                canvas.height = loaded.image.height;
                const context = canvas.getContext('2d');
                context.filter = `grayscale(1) contrast(${contrast})`;
                context.drawImage(loaded.image, 0, 0);
                loaded.image = canvas;
                loaded.needsUpdate = true;
                loaded.userData.ready = true;
                loaded.userData.pendingCopies?.forEach(copy => { copy.image = loaded.image; copy.needsUpdate = true; });
                loaded.userData.pendingCopies?.clear();
            });
            bump.colorSpace = THREE.NoColorSpace;
            diffuseTextureCache.set(key, bump);
        }
        params.bumpMap = diffuseTextureCache.get(key);
        params.bumpMap.wrapS = params.bumpMap.wrapT = THREE.RepeatWrapping;
        params.bumpMap.repeat.set(bumpUVW.tileU ?? 1, bumpUVW.tileV ?? 1);
        params.bumpMap.offset.set(bumpUVW.offsetU ?? 0, bumpUVW.offsetV ?? 0);
        params.bumpMap.center.set(.5, .5);
        params.bumpMap.rotation = THREE.MathUtils.degToRad(bumpUVW.rotation || 0);
    }
    if (params.bumpImage) {
        // The supplied bump controls relief; procedural normals would mask its grain.
        delete params.normalMap;
        delete params.normalScale;
    }
    delete params.bumpImage;
    delete params.bumpContrast;

    // Ensure Color instance
    if (typeof params.color === 'number' || typeof params.color === 'string') {
        params.color = new THREE.Color(params.color);
    }
    if (params.attenuationColor && !(params.attenuationColor instanceof THREE.Color)) {
        params.attenuationColor = new THREE.Color(params.attenuationColor);
    }

    const mat = new THREE.MeshPhysicalMaterial(params);
    mat.userData = { 
        edgeChamferRadius,
        materialId: matDef.id, 
        materialName: matDef.name,
        customParams: customOverrides || {}
    };
    mat.userData.textureMapping = { diffuse: uvw, bump: bumpUVW };
    if (materialId === 'blank_white') {
        // Keep a white backdrop while compositing the shadow mask independently of HDR exposure.
        mat.toneMapped = false;
        mat.userData.shadowDarknessUniform = { value: 1 };
        mat.onBeforeCompile = shader => {
            shader.uniforms.groundShadowDarkness = mat.userData.shadowDarknessUniform;
            shader.vertexShader = 'varying vec3 vGroundWorldPosition;\n' + shader.vertexShader;
            shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvGroundWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;');
            shader.fragmentShader = 'uniform float groundShadowDarkness; varying vec3 vGroundWorldPosition;\n' + shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace('#include <shadowmap_pars_fragment>', '#include <shadowmap_pars_fragment>\n#include <shadowmask_pars_fragment>');
            shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', 'float groundShadow = clamp((1.0 - getShadowMask()) * groundShadowDarkness, 0.0, 1.0); float groundFade = 1.0 - smoothstep(6500.0, 10000.0, length(vGroundWorldPosition.xz)); outgoingLight = mix(vec3(1.0), diffuse * (1.0 - groundShadow * 0.85), groundFade);\n#include <opaque_fragment>');
        };
        mat.customProgramCacheKey = () => 'blank-white-shadow-mask-fade';
    }

    return mat;
}

export function applyWorldTextureSize(mesh, material) {
    const materials = Array.isArray(material) ? material : [material];
    const sourceGeometry = mesh.userData.textureMappingSourceGeometry || mesh.geometry;
    mesh.userData.textureMappingSourceGeometry = sourceGeometry;
    if (!materials.some(mat => Object.values(mat.userData.textureMapping || {}).some(mapping => mapping.worldSize))) {
        if (mesh.geometry !== sourceGeometry) { mesh.geometry.dispose(); mesh.geometry = sourceGeometry; }
        return;
    }
    mesh.updateWorldMatrix(true, false);
    const previousGeometry = mesh.geometry;
    const geometry = sourceGeometry.index ? sourceGeometry.toNonIndexed() : sourceGeometry.clone();
    const positions = geometry.attributes.position;
    const uv = geometry.attributes.uv ? geometry.attributes.uv.clone() : new THREE.BufferAttribute(new Float32Array(positions.count * 2), 2);
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
    const normal = new THREE.Vector3(), point = new THREE.Vector3();
    const groups = geometry.groups.length ? geometry.groups : [{ start: 0, count: positions.count, materialIndex: 0 }];
    for (const group of groups) {
        const mat = materials[group.materialIndex];
        if (!mat || !Object.values(mat.userData.textureMapping || {}).some(mapping => mapping.worldSize)) continue;
        for (let i = group.start; i < group.start + group.count; i += 3) {
            // One projection per triangle prevents UV seams inside a face.
            const a = new THREE.Vector3().fromBufferAttribute(positions, i);
            const b = new THREE.Vector3().fromBufferAttribute(positions, i + 1);
            const c = new THREE.Vector3().fromBufferAttribute(positions, i + 2);
            normal.crossVectors(b.sub(a), c.sub(a)).applyNormalMatrix(normalMatrix);
            const axis = Math.abs(normal.x) > Math.abs(normal.y) && Math.abs(normal.x) > Math.abs(normal.z) ? 'x' : Math.abs(normal.y) > Math.abs(normal.z) ? 'y' : 'z';
            for (let j = i; j < i + 3; j++) {
                point.fromBufferAttribute(positions, j).applyMatrix4(mesh.matrixWorld);
                uv.setXY(j, axis === 'x' ? point.z : point.x, axis === 'y' ? point.z : point.y);
            }
        }
    }
    geometry.setAttribute('uv', uv);
    mesh.geometry = geometry;
    if (previousGeometry !== sourceGeometry) previousGeometry.dispose();
    for (const mat of materials) {
        for (const [channel, mapKey] of [['diffuse', 'map'], ['bump', 'bumpMap']]) {
            const mapping = mat.userData.textureMapping?.[channel];
            const texture = mat[mapKey];
            if (!texture || !mapping?.worldSize) continue;
            const own = texture.clone();
            own.repeat.set((mapping.tileU ?? 1) / Math.max(.01, mapping.sizeX ?? 100), (mapping.tileV ?? 1) / Math.max(.01, mapping.sizeY ?? 100));
            if (texture.userData.ready || texture.image?.complete || texture.image?.data) own.needsUpdate = true;
            else {
                texture.userData.pendingCopies ||= new Set();
                texture.userData.pendingCopies.add(own);
            }
            mat[mapKey] = own;
        }
    }
}

export const PART_LABELS = {
    ground: 'Ground Plane',
    crane: 'Crane Arm',
    pump: 'Vacuum Pump',
    tube: 'Vacuum Tube',
    head: 'Handle Unit',
    suction: 'Suction Cups',
    workpiece: 'Workpiece'
};

export const PART_ICONS = {
    ground: '▱',
    crane: '🏗️',
    pump: '⚡',
    tube: '🌀',
    head: '🕹️',
    suction: '🧲',
    workpiece: '📦'
};

const FOUR_MATERIAL_PRESETS = [{ name: 'Standard Materials', mats: { crane: 'orange_painted_metal', pump: 'silver_metal', tube: 'yellow_tube_logo', head: 'silver_metal', suction: 'black_rubber' } }];
export const PBR_PRESETS = [
    {
        name: '⭐ 24K Luxury Gold',
        mats: {
            crane: 'gold_24k',
            pump: 'gold_24k',
            tube: 'rubber_corrugated_tube',
            head: 'gold_rose',
            suction: 'rubber_suction_pad',
            workpiece: 'aluminum_polished'
        }
    },
    {
        name: '🪞 Mirror Chrome',
        mats: {
            crane: 'chrome_mirror',
            pump: 'chrome_mirror',
            tube: 'polymer_polycarbonate',
            head: 'chrome_mirror',
            suction: 'rubber_suction_pad',
            workpiece: 'steel_brushed'
        }
    },
    {
        name: '🔬 Dispersion & Glass Optics',
        mats: {
            crane: 'aluminum_brushed',
            pump: 'titanium_dark',
            tube: 'glass_amber',
            head: 'aluminum_polished',
            suction: 'rubber_silicone_orange',
            workpiece: 'glass_dispersion'
        }
    },
    {
        name: '🏭 Aardwolf Standard Industrial',
        mats: {
            crane: 'steel_brushed',
            pump: 'plastic_yellow_aardwolf',
            tube: 'rubber_corrugated_tube',
            head: 'titanium_dark',
            suction: 'rubber_suction_pad',
            workpiece: 'aluminum_brushed'
        }
    },
    {
        name: '✨ Titanium & Clear Glass',
        mats: {
            crane: 'titanium_dark',
            pump: 'plastic_piano_black',
            tube: 'glass_clear',
            head: 'aluminum_brushed',
            suction: 'rubber_suction_pad',
            workpiece: 'glass_tinted_blue'
        }
    }
];

