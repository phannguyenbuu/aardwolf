export const STANDARD_MATERIALS = [
    { id: 'orange_painted_metal', name: 'Orange Painted Metal', category: 'Metals', previewColor: '#ed8b00', badge: 'Painted', params: { color: '#ed8b00', metalness: 0, roughness: .42, clearcoat: .25 } },
    { id: 'yellow_tube_logo', name: 'Yellow Tube', category: 'Rubbers & Suction', previewColor: '#f8db00', badge: 'Logo', params: { color: '#ffffff', metalness: 0, roughness: .75, diffuseImage: '/models/logo_tube.jpg' } },
    { id: 'black_rubber', name: 'Black Rubber', category: 'Rubbers & Suction', previewColor: '#202020', badge: 'Rubber', params: { color: '#ffffff', metalness: 0, roughness: .55, clearcoat: 1, clearcoatRoughness: .3, diffuseImage: '/models/black-rubber-diffuse.png', bumpImage: '/models/black-rubber-bump.png', bumpContrast: 1, bumpScale: .15 } },
    { id: 'silver_metal', name: 'Chrome', category: 'Metals', previewColor: '#d9dde2', badge: 'Chrome', params: { color: '#d9dde2', metalness: 1, roughness: .055, envMapIntensity: 1.35, diffuseImage: '/models/chrome-diffuse.png', diffuseContrast: 1.8, bumpImage: '/models/chrome-diffuse.png', bumpContrast: 100, bumpScale: .15 } },
    { id: 'wall_surface', name: 'Wall Surface', category: 'Ground & Surfaces', previewColor: '#a88b64', badge: 'Wall', params: { color: '#ffffff', metalness: 0, roughness: .95, diffuseImage: '/models/concrete.jpg', diffuseUVW: { worldSize: true, sizeX: 400, sizeY: 400 } } },
    { id: 'white_plastic', name: 'White Plastic', category: 'Polymers & Enamels', previewColor: '#f4f4f4', badge: 'Plastic', params: { color: '#f4f4f4', metalness: 0, roughness: .42, clearcoat: .15, diffuseImage: '/models/chrome-diffuse.png', diffuseContrast: 1.8, bumpImage: '/models/chrome-diffuse.png', bumpContrast: 100, bumpScale: .15 } },
    { id: 'workpiece_wood', name: 'Wood', category: 'Ground & Surfaces', previewColor: '#a87945', badge: 'Wood', params: { color: '#ffffff', roughness: .85, metalness: 0, diffuseImage: '/textures/workpiece-wood.png' } },
    { id: 'blank_white', name: 'Blank White', category: 'Ground & Surfaces', previewColor: '#ffffff', badge: 'White', params: { color: '#ffffff', metalness: 0, roughness: 1, toneMapped: false } },
];

export function defaultSurfacePreset(model, surface) {
    const rgb = /^#[0-9a-f]{6}$/i.test(surface.color || '') ? [1,3,5].map(i=>parseInt(surface.color.slice(i,i+2),16)) : [180,180,180];
    const [r,g,b] = rgb;
    if (/concrete/i.test(surface.diffuseImage || '')) return 'wall_surface';
    if (r > 225 && g > 225 && b > 225 && !surface.diffuseImage) return 'white_plastic';
    if (/tube lift/i.test(model) && (surface.diffuseImage || (r > 130 && g > 90 && b < 100))) return 'yellow_tube_logo';
    if (r > 130 && r > b * 1.5 && g > 45 && b < 100) return 'orange_painted_metal';
    if (Math.max(...rgb) < 100) return 'black_rubber';
    if (/bellow|suction|foam|rectangular_pads|multi_cup/i.test(model) && Math.max(...rgb) <= 185) return 'black_rubber';
    return 'silver_metal';
}
