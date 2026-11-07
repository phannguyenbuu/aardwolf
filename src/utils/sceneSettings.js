import { PBR_MATERIALS, LEGACY_PBR_MATERIALS } from '../constants/pbrMaterials.js';
import { defaultSurfacePreset } from '../constants/standardMaterials.js';
import originalModelSurfaces from '../constants/originalModelSurfaces.json';

import { get3DConfiguration } from './configuratorHelpers.js';

export const DEFAULT_MATERIALS = { ground: 'blank_white', crane: 'steel_brushed', pump: 'plastic_yellow_aardwolf', tube: 'rubber_corrugated_tube', head: 'titanium_dark', suction: 'rubber_suction_pad', workpiece: 'workpiece_wood' };

export const materialPreviewColor = value => typeof value === 'number' ? '#' + value.toString(16).padStart(6, '0') : value;

export const defaultMaterialDefinitions = () => Object.fromEntries([...LEGACY_PBR_MATERIALS, ...PBR_MATERIALS].map(material => [material.id, { ...material.params, ...(material.id === 'rubber_corrugated_tube' ? { diffuseImage: '/models/logo_tube.jpg' } : {}) }]));

export function assemblyKey(config) {

    return JSON.stringify([config.unit || 'm', config.craneType || 'floor-mounted-crane', config.jibLength || '2.5m', config.workLoadLimit || '40kg', config.suctionHeadId || 'round_single', config.environment || 'clean', config.surfaceType || 'carton_smooth', config.actualLoad?.length ?? 400, config.actualLoad?.width ?? 300, config.actualLoad?.height ?? 250, config.handleId || 'CF2', config.suctionModelVariant || 'specific']);

}

export function objectKeys(config) {

    return { crane: config?.crane?.name, pump: config?.pumpGroup?.name, tube: config?.tube?.name, head: config?.headStack?.name, suction: config?.suctionPack?.name, ground: '@ground', workpiece: '@workpiece' };

}

export function mappingKey(target, keys) {

    const parts = target.split('::');

    if (parts.length >= 3) return parts.slice(1).join('::');

    if (parts[0] === 'ground' || parts[0] === 'workpiece') return keys[parts[0]];

    return keys[target] || target;

}

export function resolveMaterial(mapping, part, model, index) {

    const key = model || `@${part}`;

    return mapping[index == null ? key : `${key}::${index}`] || mapping[key] || DEFAULT_MATERIALS[part] || 'steel_brushed';

}

export function migrateSceneSettings(document) {

    const global = document.global || {};

    const config = get3DConfiguration(global.craneType || 'floor-mounted-crane', global.jibLength || '2.5m', global.workLoadLimit || '40kg', global.suctionHeadId || 'round_single', global.unit || 'm');

    const keys = objectKeys(config);

    const materials = { ...defaultMaterialDefinitions(), ...document.materials };

    if (materials.silver_metal?.chromeDefaultsApplied !== 4) {
        materials.silver_metal = { ...defaultMaterialDefinitions().silver_metal, chromeDefaultsApplied: 4 };
    }
    if (materials.white_plastic?.plasticDiffuseVersion !== 2) {
        materials.white_plastic = { ...defaultMaterialDefinitions().white_plastic, plasticDiffuseVersion: 2 };
    }
    if (materials.black_rubber?.rubberTextureVersion !== 2) {
        materials.black_rubber = { ...defaultMaterialDefinitions().black_rubber, rubberTextureVersion: 2 };
    }
    if (!materials.wall_surface?.diffuseUVW) materials.wall_surface = { ...materials.wall_surface, diffuseUVW: { worldSize: true, sizeX: 400, sizeY: 400 } };
    const mapping = { ...document.materialMapping };
    if (!materials.blank_white?.groundDefaultApplied) {
        materials.blank_white = { ...defaultMaterialDefinitions().blank_white, ...materials.blank_white, groundDefaultApplied: true };
        mapping['@ground'] = 'blank_white';
        mapping['ground::plane'] = 'blank_white';
    }
    for (const [key, sourceSurfaces] of Object.entries(originalModelSurfaces)) {
        const modelName = key.slice(0, key.lastIndexOf('::'));
        const surfaces = sourceSurfaces.map(surface => {
            const presetId = defaultSurfacePreset(modelName, surface);
            return ['orange_painted_metal', 'yellow_tube_logo', 'silver_metal', 'white_plastic', 'black_rubber', 'wall_surface'].includes(presetId)
                ? { presetId } : surface;
        });
        // Default surfaces follow the source FBX; explicit custom materials keep their edits.
        if (mapping[key] === `original-default:${key}`) {
            materials[mapping[key]] = { ...materials[mapping[key]], originalSurfaces: surfaces };
        }
        if (mapping[key]) continue;
        const model = key.slice(0, key.lastIndexOf('::'));
        const baseId = mapping[model] || (/TUBE LIFT/i.test(model) ? DEFAULT_MATERIALS.tube : /pump/i.test(model) ? DEFAULT_MATERIALS.pump : /crane/i.test(model) ? DEFAULT_MATERIALS.crane : /control|stack|hand|ETHV|MHC|CF2/i.test(model) ? DEFAULT_MATERIALS.head : DEFAULT_MATERIALS.suction);
        const id = `original-default:${key}`;
        materials[id] = { ...materials[baseId], originalSurfaces: surfaces };
        mapping[key] = id;
    }
    if (!materials.workpiece_wood?.workpieceTextureApplied) {
        mapping['@workpiece'] = 'workpiece_wood';
        materials.workpiece_wood = { ...materials.workpiece_wood, workpieceTextureApplied: true };
    }

    const models = structuredClone(document.models || {});

    const positions = structuredClone(document.assemblies || {});

    if (document.version >= 2) return { materials, mapping, models, positions };

    const offsets = structuredClone(global.partOffsets || {});

    const migrateMaterial = (key, id, params) => {

        if (!id || !key) return;

        // Legacy per-object edits become explicit reusable IDs; no silent merge of different looks.

        const materialId = params && Object.keys(params).length ? `legacy:${key}` : id;

        if (materialId !== id) materials[materialId] = { ...materials[id], ...params };

        mapping[key] = materialId;

    };

    for (const [part, key] of Object.entries(keys)) {

        const model = models[key] || {};

        const params = { ...global.customParams?.[part], ...model.params };

        if (part === 'tube' && params.diffuseImage == null) params.diffuseImage = '/models/logo_tube.jpg';

        migrateMaterial(key, model.material || global.componentMaterials?.[part] || DEFAULT_MATERIALS[part], params);

        if (model.offset) offsets[part] = Object.fromEntries(['x', 'y', 'z'].map(axis => [axis, (offsets[part]?.[axis] || 0) + (model.offset[axis] || 0)]));

    }

    const targets = new Set([...Object.keys(global.componentMaterials || {}), ...Object.keys(global.customParams || {})]);

    for (const target of targets) {

        if (!target.includes('::')) continue;

        const key = mappingKey(target, keys), part = target.split('::')[0];

        migrateMaterial(key, global.componentMaterials?.[target] || mapping[keys[part]] || DEFAULT_MATERIALS[part], { ...global.customParams?.[part], ...global.customParams?.[target] });

    }

    for (const [key, model] of Object.entries(models)) {

        if (!mapping[key] && model.material) migrateMaterial(key, model.material, model.params);

        delete model.offset; delete model.material; delete model.params;

    }

    positions[assemblyKey(global)] = offsets;

    return { materials, mapping, models, positions };

}


