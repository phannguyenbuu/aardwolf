import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { SSRPass } from 'three/examples/jsm/postprocessing/SSRPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { snapshotScene, syncCamera } from './StudioRenderer.js';

export class HdrSSRRenderer {
    constructor(renderer) {
        this.renderer = renderer;
        this.camera = new THREE.PerspectiveCamera();
        this.scene = new THREE.Scene();
        this.composer = new EffectComposer(renderer);
        this.ssr = new SSRPass({ renderer, scene: this.scene, camera: this.camera, width: 512, height: 512 });
        this.ssr.maxDistance = 12;
        this.ssr.thickness = 0.08;
        this.ssr.opacity = 0.65;
        this.ssr.blur = true;
        this.ssr.distanceAttenuation = true;
        this.ssr.fresnel = true;
        this.composer.addPass(this.ssr);
        this.composer.addPass(new OutputPass());
        this.pmrem = new THREE.PMREMGenerator(renderer);
        this.environments = new Map();
        this.textures = {};
        this.dirty = true; this.ready = false;
        const loadTexture = async (name, color) => {
            const texture = await new THREE.TextureLoader().loadAsync(`/assets/hdr-ssr/textures/${name}.png`);
            if (color) texture.colorSpace = THREE.SRGBColorSpace;
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(40, 40);
            texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
            return texture;
        };
        this.loading = Promise.all([
            ...[1, 3].map(async id => {
                const cube = await new THREE.CubeTextureLoader().setPath(`/assets/hdr-ssr/envmaps/${id}/`).loadAsync(['posx.jpg','negx.jpg','posy.jpg','negy.jpg','posz.jpg','negz.jpg']);
                cube.colorSpace = THREE.SRGBColorSpace;
                cube.needsUpdate = true;
                renderer.setRenderTarget(null);
                this.environments.set(id, { cube, filtered: this.pmrem.fromCubemap(cube) });
            }),
            loadTexture('street_albedo', true).then(t => { this.textures.map = t; }),
            loadTexture('street_normal', false).then(t => { this.textures.normalMap = t; }),
            loadTexture('street_aomap', false).then(t => { this.textures.aoMap = t; })
        ]).then(() => { this.ready = true; }).catch(error => { this.error = error; });
    }
    invalidate() { this.dirty = true; }
    clearScene() {
        this.scene.traverse(o => { if (o.isMesh) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); if (o.userData.ssrFloor) o.geometry.dispose(); } });
        this.scene.clear();
    }
    render(source, camera, options = {}) {
        if (this.error) throw this.error;
        if (!this.ready) return false;
        const env = this.environments.get(Number(options.hdrEnvironment) === 3 ? 3 : 1);
        if (this.dirty) {
            this.clearScene();
            const snapshot = snapshotScene(source, env.filtered.texture);
            for (const object of [...snapshot.children]) {
                if (object.isMesh && object.matrixAutoUpdate !== false) { object.geometry.dispose(); object.material.dispose(); continue; }
                this.scene.add(object);
            }
            const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ ...this.textures, roughness: 0.24, metalness: 0.3, normalScale: new THREE.Vector2(0.4, 0.4) }));
            floor.geometry.setAttribute('uv1', floor.geometry.attributes.uv.clone());
            floor.userData.ssrFloor = true;
            floor.rotation.x = -Math.PI / 2; floor.position.y = -0.003;
            this.scene.add(floor);
            this.ssr.selects = [floor, ...this.scene.children.filter(o => o.isMesh && (Array.isArray(o.material) ? o.material.some(m => m.metalness > 0.4) : o.material.metalness > 0.4))];
            this.dirty = false;
        }
        this.scene.environment = env.filtered.texture;
        this.scene.environmentIntensity = options.hdrIntensity ?? 2.8;
        this.scene.background = env.cube;
        this.scene.backgroundIntensity = options.hdrBackgroundIntensity ?? 1;
        syncCamera(camera, this.camera);
        const size = this.renderer.getSize(new THREE.Vector2());
        const key = `${size.x}:${size.y}`;
        if (key !== this.sizeKey) { this.composer.setPixelRatio(Math.min(this.renderer.getPixelRatio(), 1.25)); this.composer.setSize(size.x, size.y); this.sizeKey = key; }
        this.ssr.opacity = options.ssrOpacity ?? 0.65;
        const exposure = this.renderer.toneMappingExposure;
        this.renderer.toneMappingExposure = options.hdrExposure ?? 1.15;
        try { this.composer.render(); }
        finally { this.renderer.toneMappingExposure = exposure; }
        return true;
    }
    async export(source, camera, options, signal, onProgress) {
        const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
        renderer.setPixelRatio(1); renderer.setSize(3840, 2160);
        renderer.toneMapping = this.renderer.toneMapping;
        renderer.toneMappingExposure = this.renderer.toneMappingExposure;
        const job = new HdrSSRRenderer(renderer);
        try {
            onProgress?.(0);
            await job.loading;
            onProgress?.(70);
            if (signal.aborted) throw new DOMException('Render cancelled', 'AbortError');
            const exportCamera = camera.clone(); exportCamera.aspect = 3840 / 2160; exportCamera.updateProjectionMatrix();
            if (!job.render(source, exportCamera, options)) throw new Error('HDR environment could not load');
            onProgress?.(95);
            return await new Promise((resolve, reject) => renderer.domElement.toBlob(blob => blob ? resolve(blob) : reject(new Error('Image encoding failed')), 'image/png'));
        } finally { job.dispose(); renderer.dispose(); }
    }
    dispose() {
        this.loading.finally(() => {
            this.clearScene();
            this.environments.forEach(env => { env.cube.dispose(); env.filtered.dispose(); });
            Object.values(this.textures).forEach(t => t.dispose());
            this.composer.passes.forEach(pass => pass.dispose());
            this.composer.dispose(); this.pmrem.dispose();
        });
    }
}
