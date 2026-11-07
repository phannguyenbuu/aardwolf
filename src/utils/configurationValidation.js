import { RULES } from '../constants/data.js';
import { isJibDisabled, isWllAllowed } from './configuratorHelpers.js';
import { selectionEligibility, LOAD_MATERIALS } from './selectionRules.js';

export function suctionEligibility(head, surface, load, environment, capacityKg) {
    return selectionEligibility(head, { surfaceType: surface, actualLoad: load, environment, capacityKg });
}

export function validateConfiguration(config) {
    const errors = [];
    const { craneType, jibLength, workLoadLimit, surfaceType, actualLoad, suctionHeadId, handleId, environment } = config;
    const wll = RULES.wllLevels.find(item => item.id === workLoadLimit);
    if (wll?.compatibilityStatus === 'pending_confirmation') errors.push('Nine-level WLL configuration requires confirmed crane, tube, motor and handle compatibility. Request consultation.');
    if (!RULES.cranes.some(item => item.id === craneType)) errors.push('Select a crane type.');
    if (isJibDisabled(craneType, jibLength)) errors.push('Jib is incompatible with the crane.');
    if (!isWllAllowed(craneType, jibLength, workLoadLimit)) errors.push('WLL is incompatible with the crane and jib.');
    if (!LOAD_MATERIALS.some(item => item.id === surfaceType)) errors.push('Select a load material.');
    if (!['porous', 'nonporous'].includes(environment)) errors.push('Select a load type.');
    if (RULES.surfaceTypes.find(item => item.id === surfaceType)?.consultationOnly) errors.push('This load material requires consultation and verified tooling.');
    for (const field of ['weight', 'length', 'width', 'height']) if (!Number.isFinite(actualLoad[field]) || actualLoad[field] <= 0) errors.push(`${field} must be greater than zero.`);
    if (actualLoad.weight > wll?.capacityKg) errors.push('Actual weight exceeds WLL.');
    if (!wll?.allowedHandles.includes(handleId)) errors.push('Handle is incompatible with WLL.');
    const head = RULES.suctionHeads.find(item => item.id === suctionHeadId);
    if (!head) errors.push('Select a suction head or request consultation.');
    else errors.push(...suctionEligibility(head, surfaceType, actualLoad, environment, wll?.capacityKg).reasons);
    if (config.config3D?.missingAssets.length) errors.push(`Missing verified assets: ${config.config3D.missingAssets.join(', ')}`);
    return { valid: errors.length === 0, errors: [...new Set(errors)] };
}
