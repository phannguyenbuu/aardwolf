// Default startup camera.
export const DEFAULT_CAMERA = { position: [1591, 1750, 10524], target: [1567, 1982, 578], fov: 34 };

export function defaultCameraViews(center, size, padX = center.x) {
    const span = Math.max(size.x, size.y, 3000);
    const target = [center.x, center.y, center.z];
    return {
        'cornell-reference': { position: [center.x, 3200, 9600], target: [center.x, 3200, 0], fov: 45 },
        'front-view': { position: [center.x, center.y, Math.max(6400, span * 1.75)], target, fov: 34 },
        'left-view': { position: [center.x + Math.max(6400, span * 1.75), center.y, 0], target, fov: 34 },
        'right-view': { position: [center.x - Math.max(6400, span * 1.75), center.y, 0], target, fov: 34 },
        'top-view': { position: [center.x, Math.max(7200, span * 1.95), 0], target, fov: 34 },
        'ortho-view': { position: [center.x + span * 0.45, center.y + span * 0.38, Math.max(6000, span * 1.65)], target, fov: 34 },
        'focus-suction': { position: [padX + 900, 750, 1600], target: [padX, 350, 0], fov: 32 }
    };
}
