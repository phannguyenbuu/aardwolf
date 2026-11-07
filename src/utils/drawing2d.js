import { extractPoint3 } from './configuratorHelpers.js';
import { HEAD_STACKS } from '../constants/data.js';

// 2D drawing geometry for the PDF, matching the legacy SVG set in /models/svg.
const TUBE_HEIGHT = 1918.86;
const TUBE_OFFSET = 25.5;
const TUBE_SVGS = ['TUBE LIFT ID 120', 'TUBE LIFT ID 250', 'TUBE LIFT SM 120', 'TUBE LIFT SM 250'];

// The handle SVGs keep their legacy names (same products, renamed).
const HANDLE_SVGS = {
    'mhc-one_hand': 'Single control head',
    'cf2-comfort_grip': 'Comfort control head',
    'ethv3-long_reach': 'Extra Hand',
    'ethv2-high_reach': 'High stack'
};

function padSvg(name = '') {
    if (name.startsWith('bellow_cups_1x')) return 'suction_01';
    if (name.startsWith('bellow_cups_2x')) return 'suction_02';
    if (name.startsWith('bellow_cups_4x') || name.startsWith('bellow_cups_6x')) return 'suction_03';
    if (name.startsWith('oval_foam')) return 'suction_04';
    return 'multi_suction_pad';
}

export function build2dDrawing(config3D) {
    const { crane, pumpGroup, tube, headStack, suctionPack } = config3D;
    if (!crane || !pumpGroup || !tube || !headStack || !suctionPack) return null;
    const [p1, p2] = extractPoint3(crane.name);
    if (!p1 || !p2) return null;
    const craneName = crane.name.toLowerCase();
    const pumpZ = p1.z + (craneName.includes('mobile') ? 310 : 0);
    const tubeHeight = TUBE_HEIGHT - (craneName.includes('articulated') ? 300 : 0);
    const handle = HANDLE_SVGS[headStack.name] || headStack.name;
    const handleHeight = HEAD_STACKS.find(item => item.name === handle)?.y ?? 0;
    const pad = { x: p2.x - TUBE_OFFSET, z: p2.z - tubeHeight - handleHeight };
    return [
        { path: crane.name, x: 0, y: 0 },
        { path: pumpGroup.name, x: p1.x, y: -pumpZ },
        { path: TUBE_SVGS.includes(tube.name) ? tube.name : 'TUBE LIFT ID 250', x: p2.x, y: -p2.z },
        { path: handle, x: pad.x, y: -pad.z },
        { path: padSvg(suctionPack.name), x: pad.x, y: -pad.z }
    ];
}
