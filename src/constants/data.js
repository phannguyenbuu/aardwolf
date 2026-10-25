import rulesData from './rules.json';

// Unit conversion helpers
export const kgToLbs = (kg) => (kg * 2.20462).toFixed(0);
export const lbsToKg = (lbs) => (lbs / 2.20462).toFixed(1);
export const mToInch = (m) => m * 39.3701;
export const mmToInch = (mm) => mm / 25.4;
export const inchToMm = (inch) => Math.round(inch * 25.4);

export const inchToFeetInch = (inches) => {
    const feet = Math.floor(inches / 12);
    const inch = Math.round(inches % 12);
    return feet !== 0 ? `${feet}'${inch}"` : `${inch}"`;
};

export function parseFeetAndInches(input) {
    if (!input) return null;
    const regex = /(\d+)'(\d+)"/;
    const regexInchesOnly = /(\d+)"/;

    let match = input.match(regex);
    if (match) {
        const feet = parseInt(match[1], 10);
        const inches = parseInt(match[2], 10);
        let res = Math.round((feet * 12 + inches) * 25.4 / 10) * 10;
        if (res === 150) res = 160;
        return res;
    }

    match = input.match(regexInchesOnly);
    if (match) {
        const inches = parseInt(match[1], 10);
        let res = Math.round(inches * 25.4 / 10) * 10;
        if (res === 150) res = 160;
        return res;
    }

    return null;
}

export function generateInchData(data) {
    const convertedData = {};

    Object.keys(data).forEach((key) => {
        const metricData = data[key].m;

        const inchData = {
            maxLiftingCapacity: `${kgToLbs(parseFloat(metricData.maxLiftingCapacity.split(' ')[0]))} lbs`,
            minLiftingCapacity: `${kgToLbs(parseFloat(metricData.minLiftingCapacity))} lbs`,
            liftTube17: inchToFeetInch(mToInch(parseFloat(metricData.liftTube17.split(' ')[0]))),
            liftTube29: inchToFeetInch(mToInch(parseFloat(metricData.liftTube29.split(' ')[0]))),
            liftTubeSize: `${inchToFeetInch(mmToInch(parseFloat(metricData.liftTubeSize.split(' ')[0])))}`,
            liftTubePower: metricData.liftTubePower,
            priceLiftTubeSize: metricData.priceLiftTubeSize,
            priceLiftTubePower: metricData.priceLiftTubePower,
        };

        convertedData[key] = {
            ...data[key],
            Inch: inchData,
        };
    });

    return convertedData;
}

// Convert rulesData.wllLevels into dictionary format
const RAW_WORKLOAD_DICT = {};
rulesData.wllLevels.forEach(wll => {
    RAW_WORKLOAD_DICT[wll.id] = {
        capacityKg: wll.capacityKg,
        m: wll.m
    };
});

export const WORKLOAD_DATA = generateInchData(RAW_WORKLOAD_DICT);

export const ALL_SCENES = [
    {
        key: 'mobile_articulated_crane',
        name: "Mobile Articulated Jib Crane-Two Arm@p1_-87_0_0@p2_2612_0_2405",
        dx: [210, 1400, 1100], vy: [2730, 2500], dy: [2550, 2400]
    },
    {
        key: 'mobile_crane_250',
        name: "Mobile Over Braced Jib Crane-One Arm@p1_-113_-111_0@p2_3067_-111_3378",
        dx: [140, 3000, 0], vy: [3500, 2500], dy: [4100, 3430]
    },
    {
        key: 'floor_articulated_crane',
        name: "Articulated Jib Crane-Two Arm@p1_-87_0_0@p2_2612_0_2119",
        dx: [210, 1345, 1090], vx: [0, 1650, 1350], vy: [3450, 3200], dy: [2270, 2110]
    },
    {
        key: 'floor_jib_crane_250_3m',
        name: "Over Braced Jib Crane - 3m-125kg@p1_-90_-141_0@p2_2956_-141_3105",
        dx: [140, 3000, 0], vy: [4200, 3200], dy: [3840, 3170]
    },
    {
        key: 'floor_jib_crane_250_4m',
        name: "Over Braced Jib Crane - 4m - 250kg@p1_-100_-166_0@p2_3966_-166_3067",
        dx: [178, 4000, 0], vy: [4200, 3200], dy: [4050, 3120]
    },
    {
        key: 'floor_jib_crane_250_5m',
        name: "Over Braced Jib Crane - 5m - 250kg@p1_-100_-166_0@p2_4966_-166_3067",
        dx: [178, 5000, 0], vy: [4200, 3200], dy: [4050, 3120]
    },
    {
        key: 'wall_mounted_jib_crane_250_3m',
        name: "WALL BRACED JIB CRANE 3M 125KG@p1_-200_0_0@p2_3284_0_3029",
        dx: [470, 3000, 0], vy: [4200, 3200], dy: [4050, 3070]
    },
    {
        key: 'wall_mounted_jib_crane_250_4m',
        name: "WALL BRACED JIB CRANE 4M 250KG@p1_-200_0_0@p2_4085_0_2748",
        dx: [459, 4000, 0], vy: [4200, 3200], dy: [4000, 2820]
    },
    {
        key: 'wall_mounted_jib_crane_250_5m',
        name: "WALL BRACED JIB CRANE 5M 250KG@p1_-200_0_0@p2_5138_0_2748",
        dx: [472, 5000, 0], vy: [4200, 3200], dy: [4000, 2820]
    }
];

export const HEAD_STACKS = [
    { key: 'single_control_head', name: "Single control head", y: 342 },
    { key: 'hight_stack', name: "High stack", y: 247 },
    { key: 'extra_hand', name: "Extra Hand", y: 247 },
    { key: 'comfort_control_head', name: "Comfort control head", y: 190 }
];

export const SUCTION_PACKS = [
    { key: 'bellow_250', name: "suction_01" },
    { key: 'double_bellow_125', name: "suction_02" },
    { key: 'four_bellow_125', name: "suction_03" },
    { key: 'oval_foam_suction_380_220', name: "suction_04" },
    { key: 'sheet_metal_pad', name: "multi_suction_pad" }
];

export const PUMP_GROUPS = [
    { name: "Pump_group_1" },
    { name: "Pump_group_2" }
];

export const small_tube = { name: "TUBE LIFT ID 120" };
export const big_tube = { name: "TUBE LIFT ID 250" };
export const small_sm_tube = { name: "TUBE LIFT SM 120" };
export const big_sm_tube = { name: "TUBE LIFT SM 250" };

export const ALL_PRELOAD_ITEMS = [
    ...ALL_SCENES,
    ...HEAD_STACKS,
    ...SUCTION_PACKS,
    ...PUMP_GROUPS,
    small_tube,
    big_tube,
    small_sm_tube,
    big_sm_tube
];

export const RULES = rulesData;
