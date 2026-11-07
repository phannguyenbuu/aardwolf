import {

    PRODUCT_CATALOG,

    ALL_SCENES,

    HEAD_STACKS,

    SUCTION_PACKS,

    PUMP_GROUPS,

    small_tube,

    big_tube,

    WORKLOAD_DATA,

    parseFeetAndInches,

    RULES

} from '../constants/data.js';

export function getCraneConfig(craneId) {

    return RULES.cranes.find(c => c.id === craneId) || RULES.cranes[0];

}

export function isJibDisabled(craneType, jibId) {

    const crane = getCraneConfig(craneType);

    return !crane.allowedJibs.includes(jibId);

}

export function isWllAllowed(craneType, jibId, wllId) {
    const wll = RULES.wllLevels.find(item => item.id === wllId);
    const prefix = craneType.includes('wall') ? 'WMC' : craneType.includes('mobile') ? 'MBC' : 'FM';
    const code = jibId === '2.5m' ? (craneType.includes('mobile') ? 'MC 2.5AJC' : 'FM 2.5 AJC') : prefix + parseFloat(jibId);
    return !!wll?.allowedCraneJibs.includes(code);
}

export function validateJibForCrane(craneType, currentJib) {

    const crane = getCraneConfig(craneType);

    if (!crane.allowedJibs.includes(currentJib)) {

        return crane.allowedJibs[0];

    }

    return currentJib;

}

export function getRecommendedSuctionHead(surfaceType, weightKg, lengthMm, widthMm) {

    const heads = RULES.suctionHeads;

    const porous = surfaceType === 'porous_rough' || surfaceType === 'bag_woven';

    const eligible = heads.filter(head => head.modelAvailable && head.supportedSurfaces?.includes(surfaceType) && (porous ? head.porousKg : head.maxKg) >= weightKg &&

        ((head.minWidthMm <= widthMm && head.minLengthMm <= lengthMm) || (head.minWidthMm <= lengthMm && head.minLengthMm <= widthMm)));

    return eligible.sort((a, b) => a.maxKg - b.maxKg)[0] || null;

}

export function checkCapacityStatus(wllId, weightKg, craneType, jibLength) {

    if (!wllId || !weightKg || weightKg <= 0) return { status: 'NORMAL', diff: 0, suggestedWll: null };

    const currentWll = RULES.wllLevels.find(w => w.id === wllId);

    if (!currentWll) return { status: 'NORMAL', diff: 0, suggestedWll: null };

    const capacity = currentWll.capacityKg;

    if (weightKg > capacity) {

        const sorted = RULES.wllLevels.filter(item => !craneType || isWllAllowed(craneType, jibLength, item.id)).sort((a, b) => a.capacityKg - b.capacityKg);

        const suitable = sorted.find(w => w.capacityKg >= weightKg);

        return {

            status: 'OVERLOAD',

            capacity,

            weightKg,

            suggestedWll: suitable?.id || null,

            suggestedCapacity: suitable?.capacityKg || null,

            message: `Actual weight (${weightKg} kg) exceeds rated WLL limit (${capacity} kg)!`

        };

    }

    if (weightKg < capacity * 0.30) {

        const sorted = RULES.wllLevels.filter(item => !craneType || isWllAllowed(craneType, jibLength, item.id)).sort((a, b) => a.capacityKg - b.capacityKg);

        const suitable = sorted.filter(w => w.capacityKg >= weightKg).shift();

        if (suitable && suitable.id !== wllId) {

            return {

                status: 'UNDERLOAD',

                capacity,

                weightKg,

                suggestedWll: suitable.id,

                suggestedCapacity: suitable.capacityKg,

                message: `Actual weight (${weightKg} kg) is significantly below rated WLL (${capacity} kg). An optimized lower rating is available.`

            };

        }

    }

    return {

        status: 'OPTIMAL',

        capacity,

        weightKg,

        suggestedWll: null,

        message: `Workload is well-balanced within rated WLL capacity (${capacity} kg).`

    };

}

export function get3DConfiguration(craneType, jibLengthStr, workLoadLimit, suctionHeadId, selectedUnit, handleId, suctionModelVariant = 'specific') {

    const jibLength = parseFloat((jibLengthStr || '2.5m').replace('m', ''));

    let selectedCraneType = craneType || 'floor-mounted-crane';

    let _crane = undefined;

    let _pump_group = undefined;

    let _tube = undefined;

    let _head_stack = undefined;

    let _suction_pack = undefined;

    let zoomft = { x: 0, y: 0, scale: 1 };

    if (selectedCraneType.toLowerCase().includes("wall")) {

        if (jibLength <= 3) _crane = ALL_SCENES[6];

        else if (jibLength < 5) _crane = ALL_SCENES[7];

        else _crane = ALL_SCENES[8];

        _pump_group = PUMP_GROUPS[1];

    } else {

        if (selectedCraneType.toLowerCase().includes("mobile")) {

            if (jibLength < 3) _crane = ALL_SCENES[0];

            else _crane = ALL_SCENES[1];

        } else {

            if (jibLength < 3) _crane = ALL_SCENES[2];

            else if (jibLength === 3) _crane = ALL_SCENES[3];

            else if (jibLength < 5) _crane = ALL_SCENES[4];

            else _crane = ALL_SCENES[5];

        }

        _pump_group = PUMP_GROUPS[0];

    }

    const wll = RULES.wllLevels.find(item => item.id === workLoadLimit) || RULES.wllLevels[0];

    const liftTubeSize = wll.m.liftTubeSize;

    // Temporarily use the ID 250 tube for every WLL level; per-diameter tubes come later.
    _tube = { name: 'TUBE LIFT ID 250', file: '/models/aardwolf_all_part_TUBE LIFT ID 250.fbx', previewSubstitute: true, requestedDiameterMm: wll.diameterMm };

    const legacyIds = { round_single: 'bellow_cups_1x_250', rectangular_double: 'bellow_cups_2x_125', four_bellow: 'bellow_cups_4x_125', foam_pad: 'oval_foam_suction_380x220mm', multi_pad: 'multi_cup_matrix', bag_suction: 'oval_foam_suction_380x220mm', high_stack: 'bellow_cups_4x_125', swivel_90: 'bellow_cups_4x_125' };

    const headObj = RULES.suctionHeads.find(h => h.id === (legacyIds[suctionHeadId] || suctionHeadId)) || RULES.suctionHeads[0];

    const pad = PRODUCT_CATALOG.suctionPads.find(item => item.id === headObj.padKey);

    const chosenHandle = wll.allowedHandles.includes(handleId) ? handleId : wll.allowedHandles[0];

    _head_stack = PRODUCT_CATALOG.handles.find(item => item.key === chosenHandle);

    _suction_pack = pad?.asset ? { ...pad.asset, key: pad.key, price: pad.price } : undefined;
    if (_suction_pack && pad.model.startsWith('bellow_cups_4x_') && suctionModelVariant === 'shared') {
        _suction_pack = { ...PRODUCT_CATALOG.assets.find(asset => asset.name === 'bellow_cups_4x'), key: pad.key, price: pad.price };
    }

    const missingAssets = [...(! _tube ? [`Tube diameter ${wll.diameterMm} mm`] : []), ...(! _suction_pack ? [pad?.name || headObj.name] : [])];

    if (headObj.type === 'round') zoomft = { x: 0, y: -30, scale: 0.15 };

    else if (headObj.type === 'rectangular') zoomft = { x: 0, y: -25, scale: 0.15 };

    else if (headObj.type === 'multi') zoomft = { x: -2, y: -18, scale: 0.15 };

    else if (headObj.type === 'foam' || headObj.type === 'bag') zoomft = { x: -5, y: -15, scale: 0.15 };

    else if (headObj.type === 'sheet') zoomft = { x: -10, y: -6, scale: 0.1 };

    else if (headObj.type === 'arm') zoomft = { x: -12, y: -2, scale: 0.11 };

    else zoomft = { x: -5, y: -10, scale: 0.12 };

    const outputFile = `${selectedCraneType}_${jibLength}_${liftTubeSize || 'std'}_${headObj.id}.pdf`;

    const data3D = [_crane, _pump_group, _tube, _head_stack, _suction_pack];

    return {

        missingAssets,

        selectedHandleId: chosenHandle,

        crane: _crane,

        pumpGroup: _pump_group,

        tube: _tube,

        headStack: _head_stack,

        suctionPack: _suction_pack,

        zoomft,

        outputFile,

        data3D

    };

}

export function calculateTotalPrice(priceList, workLoadLimit, crane, headStack, suctionPack, environment, selectedUnit) {

    if (!priceList || !workLoadLimit || !WORKLOAD_DATA[workLoadLimit]) return null;

    const itm = WORKLOAD_DATA[workLoadLimit].m;

    const wll = RULES.wllLevels.find(item => item.id === workLoadLimit);

    const tubePrice = wll.tubePriceKey ? PRODUCT_CATALOG.tubePrices[wll.tubePriceKey] : null;

    if (tubePrice == null || !headStack || !suctionPack) return null;

    let liftTubeSize = itm.liftTubeSize;

    let liftTubePower = itm.liftTubePower;

    let total = 0;

    total += tubePrice;

    const motor = `${wll.motorKw}kw`;

    const motorPrice = PRODUCT_CATALOG.motorPrices[String(wll.motorKw)] ?? priceList.motor?.[motor];

    if (motorPrice == null) return null;

    total += Number(motorPrice);

    if (crane && priceList['crane'] && priceList['crane'][crane.key]) {

        total += priceList['crane'][crane.key];

    }

    const filterKey = (environment === 'dusty' || motor === '8kw' || motor === '9.2kw' || motor === '12.5kw') 

        ? "zfp300" 

        : "zfp120";

    if (priceList['filter'] && priceList['filter'][filterKey]) {

        total += priceList['filter'][filterKey];

    }

    if (priceList['power'] && priceList['power']["power_1"]) {

        total += priceList['power']["power_1"];

    }

    total += headStack.price;

    total += suctionPack.price;

    const complete = priceList.crane?.[crane?.key] != null && priceList.filter?.[filterKey] != null && priceList.power?.power_1 != null;
    return complete ? total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '$' : null;

}

export function extractPoint3(inputString) {

    if (!inputString) return [null, null];

    const p1Match = inputString.match(/p1_(-?\d+)_(-?\d+)_(-?\d+)/);

    const p2Match = inputString.match(/p2_(-?\d+)_(-?\d+)_(-?\d+)/);

    const parsePoint = (match) => {

        if (!match) return null;

        return {

            x: parseFloat(match[1]),

            y: parseFloat(match[2]),

            z: parseFloat(match[3]),

        };

    };

    return [parsePoint(p1Match), parsePoint(p2Match)];

}
