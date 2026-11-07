import * as THREE from 'three';
import { extractPoint3 } from './configuratorHelpers.js';
export function defaultGrips(part, config) {
    if (part === 'crane') {
        const [p1, p2] = extractPoint3(config.crane?.name);
        const convert = p => ({ x: p.x, y: p.z, z: p.y });
        return { p1: convert(p1 || { x: -87, y: 0, z: 0 }), p2: convert(p2 || { x: 2612, y: 0, z: 2119 }) };
    }
    const height = part === 'tube' ? config.tube?.heightMm || 1949.383 : part === 'head' ? (config.headStack?.boundsMm ? config.headStack.boundsMm.max[2] - config.headStack.boundsMm.min[2] : config.headStack?.heightMm || 0) : 0;
    return { p1: { x: 0, y: 0, z: 0 }, p2: { x: 0, y: -height, z: 0 } };
}
// Saved grips over the defaults. Imported handles are recentred so their origin is the top centre
// of the connector, so both handle grips stay on that vertical axis; only their heights are editable.
export function resolveGrips(part, config, saved) {
    const grips = { ...defaultGrips(part, config), ...saved };
    if (part === 'head') for (const key of ['p1', 'p2']) grips[key] = { ...grips[key], x: 0, z: 0 };
    return grips;
}
export const gripModelNames = config => ({ crane: config.crane?.name, pump: config.pumpGroup?.name, tube: config.tube?.name, head: config.headStack?.name, suction: config.suctionPack?.name });
// World-space bottom centre of the tube body, used as the tube's p2. The body can be split into
// several meshes (e.g. two halves), so union every mesh that reaches the lowest point.
export function tubeBottomCenter(tube) {
    if (!tube) return null;
    tube.updateWorldMatrix(true, true);
    const boxes = [];
    tube.traverse(object => { if (object.isMesh) boxes.push(new THREE.Box3().setFromObject(object)); });
    if (!boxes.length) return null;
    const bottom = Math.min(...boxes.map(box => box.min.y));
    const bodyBounds = new THREE.Box3();
    boxes.filter(box => box.min.y - bottom < 1).forEach(box => bodyBounds.union(box));
    const center = bodyBounds.getCenter(new THREE.Vector3());
    return new THREE.Vector3(center.x, bottom, center.z);
}
