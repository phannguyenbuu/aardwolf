import * as THREE from 'three';

// An unfiltered linear HDR environment for importance-sampled tracing and PMREM.
export function createStudioEnvironment() {
    const width = 512, height = 256, data = new Float32Array(width * height * 4);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        const u = x / width, v = y / height;
        const key = Math.exp(-(((u - 0.22) / 0.065) ** 8) - ((v - 0.66) / 0.14) ** 8) * 3;
        const rim = Math.exp(-(((u - 0.72) / 0.035) ** 8) - ((v - 0.60) / 0.18) ** 8) * 2;
        const fill = Math.exp(-(((u - 0.47) / 0.13) ** 8) - ((v - 0.72) / 0.08) ** 8) * 1.3;
        const base = 0.12 + Math.max(0, v - 0.5) * 0.3;
        const i = (y * width + x) * 4;
        data[i] = base + key + rim * 0.9 + fill * 0.85;
        data[i + 1] = base + key * 0.97 + rim * 0.95 + fill * 0.93;
        data[i + 2] = base + key * 0.92 + rim + fill;
        data[i + 3] = 1;
    }
    const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.FloatType);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.needsUpdate = true;
    return texture;
}

