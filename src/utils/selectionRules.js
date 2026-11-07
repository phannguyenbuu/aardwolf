// Capacities are maximum working loads, not minimum load weights.
// Source: ref/SUCTION CUP TABLE latest 13-OCT 2.xlsx / suction pad .new!C7:H35.
export const LOAD_MATERIALS = [
    { id: 'carton_smooth', name: 'Carton box', family: 'board', image: 'material-carton.svg' },
    { id: 'sheet_metal', name: 'Sheet metal', family: 'board', image: 'material-metal.svg' },
    { id: 'slab', name: 'Slab', family: 'board', image: 'material-slab.svg' },
    { id: 'porous_rough', name: 'Wood', family: 'wood', image: 'material-wood.svg' },
    { id: 'stone', name: 'Stone', family: 'solid', image: 'material-stone.svg' },
    { id: 'concrete', name: 'Concrete', family: 'solid', image: 'material-concrete.svg' },
];

export const LOAD_TYPES = [
    { id: 'nonporous', name: 'Non-porous load' },
    { id: 'porous', name: 'Porous load' },
];

export function effectiveLoadType(environment, surface) {
    if (environment === 'porous' || environment === 'nonporous') return environment;
    // Legacy clean/dusty describe the workplace, not load permeability.
    return ['porous_rough', 'bag_woven'].includes(surface) ? 'porous' : 'nonporous';
}

export function padCapacity(head, loadType) {
    return loadType === 'porous' ? head.porousKg : head.maxKg;
}

export function padSupportsMaterial(head, surface) {
    if (head.supportedSurfaces?.includes(surface)) return true;
    const material = LOAD_MATERIALS.find(item => item.id === surface);
    if (!material) return false;
    const flat = /flat_cup|rectangular_flat/.test(head.id);
    if (material.family === 'solid') return flat;
    if (material.family === 'wood') return flat || !head.id.startsWith('oval_foam');
    return !flat;
}

export function selectionEligibility(head, { surfaceType, environment, actualLoad, capacityKg }) {
    const reasons = [];
    if (!head.modelAvailable) reasons.push('3D model unavailable');
    if (!padSupportsMaterial(head, surfaceType)) reasons.push('Not suitable for this material');
    const capacity = padCapacity(head, effectiveLoadType(environment, surfaceType));
    if (!(Number.isFinite(actualLoad.weight) && actualLoad.weight > 0 && actualLoad.weight <= capacity)) reasons.push('Load exceeds pad capacity');
    if (Number.isFinite(capacityKg) && actualLoad.weight > capacityKg) reasons.push('Load exceeds selected WLL');
    const { length, width } = actualLoad;
    if (!(length > 0 && width > 0 && ((head.minWidthMm <= width && head.minLengthMm <= length) || (head.minWidthMm <= length && head.minLengthMm <= width)))) reasons.push('Contact area too small');
    return { eligible: reasons.length === 0, reasons, capacity };
}

export function materialEligibility(heads, surfaceType, environment, actualLoad, capacityKg) {
    return heads.some(head => selectionEligibility(head, { surfaceType, environment, actualLoad, capacityKg }).eligible);
}

// Upstream edits revoke explicit answers downstream, even if a hidden default
// happens to be compatible. This prevents quoting a configuration never chosen.
export const STEP_ORDER = ['crane', 'jib', 'wll', 'environment', 'surface', 'handle', 'suction'];
export function clearFollowingSteps(previous, step) {
    const index = STEP_ORDER.indexOf(step);
    const next = new Set(previous);
    for (const key of STEP_ORDER.slice(index + 1)) next.delete(key);
    return next;
}
