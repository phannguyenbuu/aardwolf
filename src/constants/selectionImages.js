const base = '/assets/configurator/';
export const craneImages = {
    'floor-mounted-crane': base + 'crane-floor-only.png',
    'mobile-crane': base + 'crane-mobile-only.png',
    'wall-mounted-crane': base + 'crane-wall-only.png',
};
export const handleImages = Object.fromEntries(['MHC', 'CF2', 'ETHV3', 'ETHV2'].map(key => [key, base + `handle-${key.toLowerCase()}.webp`]));
export function padImage(id) {
    const bellows = id.match(/bellow_cups_(\dx)_/);
    const name = bellows ? `pad-${bellows[1]}-bellows` : {
        oval_foam_suction_380x220mm: 'pad-oval', oval_foam_suction_300x200mm: 'pad-oval',
        rectangular_pads_2_125x325mm: 'pad-2x-rectangular',
        rectangular_pads_in_line_4_125x325mm: 'pad-inline',
        rectangular_pads_frame_4_125x325mm: 'pad-frame', multi_cup_matrix: 'pad-matrix',
        flat_cup_25mm: 'pad-flat', rectangular_flat_25mm: 'pad-rectangular-flat',
        rectangular_single_125x325: 'pad-rectangular-flat',
    }[id];
    return base + (name || 'pad-flat') + '.png';
}
