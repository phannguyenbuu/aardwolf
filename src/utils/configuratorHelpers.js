import {
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

export function validateJibForCrane(craneType, currentJib) {
    const crane = getCraneConfig(craneType);
    if (!crane.allowedJibs.includes(currentJib)) {
        return crane.allowedJibs[0];
    }
    return currentJib;
}

export function getRecommendedSuctionHead(surfaceType, weightKg, lengthMm, widthMm) {
    const heads = RULES.suctionHeads;

    if (surfaceType === 'high_stack') {
        return heads.find(h => h.id === 'high_stack') || heads[0];
    }
    if (surfaceType === 'swivel_90') {
        return heads.find(h => h.id === 'swivel_90') || heads[0];
    }
    if (surfaceType === 'bag_woven') {
        return heads.find(h => h.id === 'bag_suction') || heads[0];
    }
    if (surfaceType === 'porous_rough') {
        return heads.find(h => h.id === 'foam_pad') || heads[0];
    }

    if (lengthMm > 1000 || widthMm > 600 || weightKg > 100 || surfaceType === 'sheet_metal') {
        return heads.find(h => h.id === 'multi_pad') || heads[0];
    }

    if (weightKg > 50 || lengthMm > 400 || widthMm > 400) {
        return heads.find(h => h.id === 'four_bellow') || heads[0];
    }

    if (weightKg > 30 || lengthMm > 300) {
        return heads.find(h => h.id === 'rectangular_double') || heads[0];
    }

    return heads.find(h => h.id === 'round_single') || heads[0];
}

export function checkCapacityStatus(wllId, weightKg) {
    if (!wllId || !weightKg || weightKg <= 0) return { status: 'NORMAL', diff: 0, suggestedWll: null };

    const currentWll = RULES.wllLevels.find(w => w.id === wllId);
    if (!currentWll) return { status: 'NORMAL', diff: 0, suggestedWll: null };

    const capacity = currentWll.capacityKg;

    if (weightKg > capacity) {
        const sorted = [...RULES.wllLevels].sort((a, b) => a.capacityKg - b.capacityKg);
        const suitable = sorted.find(w => w.capacityKg >= weightKg);
        return {
            status: 'OVERLOAD',
            capacity,
            weightKg,
            suggestedWll: suitable ? suitable.id : sorted[sorted.length - 1].id,
            suggestedCapacity: suitable ? suitable.capacityKg : sorted[sorted.length - 1].capacityKg,
            message: `Actual weight (${weightKg} kg) exceeds rated WLL limit (${capacity} kg)!`
        };
    }

    if (weightKg < capacity * 0.35) {
        const sorted = [...RULES.wllLevels].sort((a, b) => a.capacityKg - b.capacityKg);
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

export function get3DConfiguration(craneType, jibLengthStr, workLoadLimit, suctionHeadId, selectedUnit) {
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

    let liftTubeSize = null;
    if (workLoadLimit && WORKLOAD_DATA[workLoadLimit]) {
        liftTubeSize = WORKLOAD_DATA[workLoadLimit][selectedUnit].liftTubeSize;
    }

    if (liftTubeSize) {
        let sizeVal;
        if (liftTubeSize.includes('"')) {
            sizeVal = parseFeetAndInches(liftTubeSize);
        } else {
            sizeVal = Number(liftTubeSize.replace('mm', '').trim());
        }
        _tube = { name: sizeVal <= 120 ? small_tube.name : big_tube.name };
    } else {
        _pump_group = undefined;
    }

    const headObj = RULES.suctionHeads.find(h => h.id === suctionHeadId) || RULES.suctionHeads[0];
    _head_stack = HEAD_STACKS.find(hs => hs.key === headObj.headKey) || HEAD_STACKS[0];
    _suction_pack = SUCTION_PACKS.find(sp => sp.key === headObj.padKey) || SUCTION_PACKS[0];

    if (headObj.type === 'round') zoomft = { x: 0, y: -30, scale: 0.15 };
    else if (headObj.type === 'rectangular') zoomft = { x: 0, y: -25, scale: 0.15 };
    else if (headObj.type === 'multi') zoomft = { x: -2, y: -18, scale: 0.15 };
    else if (headObj.type === 'foam' || headObj.type === 'bag') zoomft = { x: -5, y: -15, scale: 0.15 };
    else if (headObj.type === 'sheet') zoomft = { x: -10, y: -6, scale: 0.1 };
    else if (headObj.type === 'arm') zoomft = { x: -12, y: -2, scale: 0.11 };
    else zoomft = { x: -5, y: -10, scale: 0.12 };

    const outputFile = `${selectedCraneType}_${jibLength}_${liftTubeSize || 'std'}_${headObj.id}.pdf`;

    if (_tube && _crane && _crane.name.toLowerCase().includes('articulated')) {
        _tube = { name: _tube.name.replace(' ID ', ' SM ') };
    }

    const data3D = [_crane, _pump_group, _tube, _head_stack, _suction_pack];

    return {
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

    const itm = WORKLOAD_DATA[workLoadLimit][selectedUnit];
    let liftTubeSize = itm.liftTubeSize;
    let liftTubePower = itm.liftTubePower;

    let total = 0;

    if (liftTubeSize) {
        if (liftTubeSize.includes('"')) {
            liftTubeSize = parseFeetAndInches(liftTubeSize).toString();
        } else {
            liftTubeSize = liftTubeSize.replace('mm', '').trim();
        }

        if (priceList['tube'] && priceList['tube'][liftTubeSize]) {
            total += priceList['tube'][liftTubeSize];
        } else if (itm.priceLiftTubeSize) {
            total += itm.priceLiftTubeSize;
        }
    }

    const motor = liftTubePower
        ? liftTubePower.split('/').pop().replace(' ', '').replace('.0', '')
        : "3.8kw";

    if (priceList['motor'] && priceList['motor'][motor]) {
        total += priceList['motor'][motor];
    } else if (itm.priceLiftTubePower) {
        total += Math.round(itm.priceLiftTubePower * 1000);
    }

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

    if (headStack && suctionPack) {
        if (priceList['control_head'] && priceList['control_head'][headStack.key]) {
            total += priceList['control_head'][headStack.key];
        }
        if (priceList['suction_pad'] && priceList['suction_pad'][suctionPack.key]) {
            total += priceList['suction_pad'][suctionPack.key];
        }
    }

    return total ? total.toLocaleString('en-US') + '$' : null;
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
