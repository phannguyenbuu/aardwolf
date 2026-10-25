import {
    ALL_SCENES,
    HEAD_STACKS,
    SUCTION_PACKS,
    PUMP_GROUPS,
    small_tube,
    big_tube,
    WORKLOAD_DATA,
    parseFeetAndInches
} from '../constants/data.js';

export function validateJibForCrane(craneType, currentJib) {
    if (craneType === 'mobile-crane') {
        if (currentJib === '4m' || currentJib === '5m') {
            return '2.5m';
        }
    } else if (craneType === 'wall-mounted-crane') {
        if (currentJib === '2.5m') {
            return '3m';
        }
    }
    return currentJib;
}

export function isJibDisabled(craneType, jib) {
    if (craneType === 'mobile-crane') {
        return jib === '4m' || jib === '5m';
    }
    if (craneType === 'wall-mounted-crane') {
        return jib === '2.5m';
    }
    return false;
}

export function get3DConfiguration(craneType, jibLengthStr, workLoadLimit, loadType, selectedUnit) {
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

    let outputFile = null;
    if (loadType) {
        if (loadType.toLowerCase().includes("300max")) {
            _head_stack = HEAD_STACKS[0];
            _suction_pack = SUCTION_PACKS[0];
            zoomft = { x: 0, y: -30, scale: 0.15 };
        } else if (loadType.toLowerCase().includes("400large")) {
            _head_stack = HEAD_STACKS[3];
            _suction_pack = SUCTION_PACKS[2];
            zoomft = { x: -2, y: -18, scale: 0.15 };
        } else if (loadType.toLowerCase().includes("bags")) {
            _head_stack = HEAD_STACKS[3];
            _suction_pack = SUCTION_PACKS[3];
            zoomft = { x: -5, y: -15, scale: 0.15 };
        } else if (loadType.toLowerCase().includes("medium")) {
            _head_stack = HEAD_STACKS[0];
            _suction_pack = SUCTION_PACKS[1];
            zoomft = { x: 0, y: -25, scale: 0.15 };
        } else if (loadType.toLowerCase().includes("high")) {
            _head_stack = HEAD_STACKS[1];
            _suction_pack = SUCTION_PACKS[2];
            zoomft = { x: -12, y: -2, scale: 0.11 };
        } else if (loadType.toLowerCase().includes("sheet")) {
            _head_stack = HEAD_STACKS[2];
            _suction_pack = SUCTION_PACKS[4];
            zoomft = { x: -10, y: -6, scale: 0.1 };
        }

        outputFile = `${selectedCraneType}_${jibLength}_${liftTubeSize}_${loadType}.pdf`;
    }

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

export function calculateTotalPrice(priceList, workLoadLimit, crane, headStack, suctionPack, selectedUnit) {
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
        }
    }

    const motor = liftTubePower
        ? liftTubePower.split('/').pop().replace(' ', '').replace('.0', '')
        : "3.8kw";

    if (priceList['motor'] && priceList['motor'][motor]) {
        total += priceList['motor'][motor];
    }

    if (crane && priceList['crane'] && priceList['crane'][crane.key]) {
        total += priceList['crane'][crane.key];
    }

    const filterKey = motor === '8kw' ? "zfp300" : "zfp120";
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
