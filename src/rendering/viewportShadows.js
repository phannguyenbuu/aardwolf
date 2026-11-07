import * as THREE from 'three';

export function createViewportShadowLight() {
    const light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.name = 'viewport-shadow-light';
    // Sun about 50 degrees high, in front-left of the default camera: lit faces point at the viewer and shadows fall long behind to the right.
    light.position.set(-1495, 9000, 7050);
    light.target.position.set(1130, 0, 0);
    light.castShadow = true;
    light.shadow.mapSize.set(2048, 2048);
    Object.assign(light.shadow.camera, { left: -6000, right: 6000, top: 6000, bottom: -6000, near: 100, far: 24000 });
    light.shadow.bias = -0.0001;
    light.shadow.normalBias = 2;
    light.shadow.radius = 12;
    light.shadow.blurSamples = 24;
    return light;
}
