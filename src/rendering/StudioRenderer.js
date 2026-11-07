import * as THREE from 'three';
import { WebGLPathTracer, DenoiseMaterial } from 'three-gpu-pathtracer';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';

import { createStudioEnvironment } from './studioEnvironment.js';
export { createStudioEnvironment } from './studioEnvironment.js';

export function snapshotScene(source, environment) {
    source.updateMatrixWorld(true);
    const scene = new THREE.Scene();
    scene.background = source.background?.isColor ? source.background.clone() : new THREE.Color('#ffffff');
    scene.environment = environment;
    scene.environmentIntensity = source.environmentIntensity;
    scene.environmentRotation.copy(source.environmentRotation);
    scene.backgroundRotation.copy(source.backgroundRotation);
    scene.backgroundIntensity = source.backgroundIntensity;
    // Render in metres without changing millimetre coordinates in the configurator.
    source.traverseVisible(object => {
        if (object.isDirectionalLight || object.isRectAreaLight || object.isSpotLight || object.isPointLight) {
            // The canvas uses one dedicated directional light to cast its shadows.
            // Keep fill lights in the preview; avoid extra trace shadows that change its direction.
            if (object.isDirectionalLight && object.name !== 'viewport-shadow-light') return;
            const light = object.clone();
            light.position.copy(object.getWorldPosition(new THREE.Vector3())).multiplyScalar(0.001);
            light.quaternion.copy(object.getWorldQuaternion(new THREE.Quaternion()));
            if (object.target) { light.target = object.target.clone(); light.target.position.copy(object.target.getWorldPosition(new THREE.Vector3())).multiplyScalar(0.001); scene.add(light.target); }
            if (object.isRectAreaLight) { light.width *= 0.001; light.height *= 0.001; }
            if (light.isSpotLight || light.isPointLight) light.distance *= 0.001;
            scene.add(light); light.updateMatrixWorld(true); light.target?.updateMatrixWorld(true); return;
        }
        if (!object.isMesh || !object.userData.partKey) return;
        const convertMaterial = original => {
            if (original.isMeshStandardMaterial || original.isMeshPhysicalMaterial) return original.clone();
            const result = new THREE.MeshStandardMaterial({
                color: original.color || 0xffffff, map: original.map || null,
                roughness: 0.65, metalness: 0,
                transparent: original.transparent, opacity: original.opacity,
                side: original.side, vertexColors: original.vertexColors,
                normalMap: original.normalMap || null, alphaMap: original.alphaMap || null,
            });
            if (original.emissive) result.emissive.copy(original.emissive);
            result.emissiveMap = original.emissiveMap || null;
            result.emissiveIntensity = original.emissiveIntensity ?? 1;
            return result;
        };
        const material = object.material.isShadowMaterial
            ? new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, metalness: 0 })
            : Array.isArray(object.material) ? object.material.map(convertMaterial) : convertMaterial(object.material);
        // The tracer writes per-vertex material IDs. Shared FBX geometry must not
        // let another instance overwrite those IDs with a different material.
        const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
        geometry.deleteAttribute('materialIndex');
        // This tracer version creates one merged material group per mesh, not
        // per source FBX group. Flatten multi-material meshes before generation.
        const groups = Array.isArray(material)
            ? geometry.groups.length ? geometry.groups : [{ start: 0, count: geometry.attributes.position.count, materialIndex: 0 }]
            : [{ start: 0, count: geometry.attributes.position.count, materialIndex: 0 }];
        for (const group of groups) {
            const selected = Array.isArray(material) ? material[group.materialIndex] : material;
            if (!selected) continue;
            const partGeometry = new THREE.BufferGeometry();
            for (const [name, attr] of Object.entries(geometry.attributes)) {
                const end = Math.min(group.start + group.count, attr.count);
                const data = new attr.array.constructor((end - group.start) * attr.itemSize);
                for (let i = group.start; i < end; i++) for (let c = 0; c < attr.itemSize; c++) {
                    data[(i - group.start) * attr.itemSize + c] = attr.array[i * attr.itemSize + c];
                }
                partGeometry.setAttribute(name, new THREE.BufferAttribute(data, attr.itemSize, attr.normalized));
            }
            const mesh = new THREE.Mesh(partGeometry, selected.clone());
            mesh.name = object.name;
            mesh.userData.partKey = object.userData.partKey;
            mesh.matrixAutoUpdate = false;
            mesh.matrix.copy(object.matrixWorld).premultiply(new THREE.Matrix4().makeScale(0.001, 0.001, 0.001));
            mesh.matrixWorld.copy(mesh.matrix);
            scene.add(mesh);
        }
        geometry.dispose();
        (Array.isArray(material) ? material : [material]).forEach(mat => mat.dispose());
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, metalness: 0 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.002;
    if (!scene.children.some(object => object.userData.partKey === 'ground')) scene.add(floor);
    else { floor.geometry.dispose(); floor.material.dispose(); }
    return scene;
}

export function syncCamera(source, camera) {
    camera.copy(source);
    camera.position.multiplyScalar(0.001);
    camera.near = 0.01; camera.far = 200;
    camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
}

export class StudioRenderer {
    constructor(renderer) {
        this.renderer = renderer;
        this.environment = createStudioEnvironment();
        this.tracer = new WebGLPathTracer(renderer);
        this.tracer.bounces = 8;
        this.tracer.filterGlossyFactor = 0.05;
        this.tracer.renderDelay = 0;
        this.tracer.fadeDuration = 0;
        this.tracer.minSamples = 1;
        this.tracer.tiles.set(4, 4);
        this.tracer.renderScale = 1;
        this.tracer.textureSize.set(2048, 2048);
        this.camera = new THREE.PerspectiveCamera();
        this.denoiseEnabled = true;
        this.denoiseQuad = new FullScreenQuad(new DenoiseMaterial({ sigma: 0.8, kSigma: 1, threshold: 0.045 }));
        this.dirty = true; this.lastChange = performance.now();
        this.lastPose = ''; this.scene = null;
    }
    invalidate() { this.dirty = true; this.lastChange = performance.now(); }
    disposeSnapshot() {
        this.scene?.traverse(object => { if (object.isMesh) { (Array.isArray(object.material) ? object.material : [object.material]).forEach(mat => mat.dispose()); if (!object.userData.sourceGeometry) object.geometry.dispose(); } });
        this.scene = null;
    }
    prepare(source, camera, { environment, background } = {}) {
        this.disposeSnapshot();
        this.scene = snapshotScene(source, environment || this.environment);
        if (background) this.scene.background = background;
        this.scene.backgroundIntensity = 1;
        // Snapshot geometry is owned by this job and disposed with the snapshot.
        syncCamera(camera, this.camera);
        this.tracer.setScene(this.scene, this.camera);
        this.tracer.updateEnvironment();
        this.dirty = false;
    }
    render(source, camera, enabled, maxSamples = 128) {
        const pose = [...camera.position.toArray(), ...camera.quaternion.toArray(), camera.fov, camera.aspect].map(n => n.toFixed(5)).join(',');
        if (pose !== this.lastPose) { this.lastPose = pose; this.lastChange = performance.now(); if (!this.dirty && this.scene) { syncCamera(camera, this.camera); this.tracer.updateCamera(); } }
        if (!enabled || performance.now() - this.lastChange < 600) { this.wasRaster = true; return false; }
        if (this.dirty) this.prepare(source, camera);
        if (this.tracer.samples >= maxSamples && !this.wasRaster) return true;
        this.tracer.pausePathTracing = this.tracer.samples >= maxSamples;
        this.tracer.renderSample();
        if (this.denoiseEnabled && this.tracer.samples >= 8) this.denoise();
        this.wasRaster = false;
        return true;
    }
    denoise() {
        this.denoiseQuad.material.map = this.tracer.target.texture;
        this.renderer.setRenderTarget(null);
        this.denoiseQuad.render(this.renderer);
    }
    async export(source, camera, { width = 3840, height = 2160, samples = 512, signal, onProgress }) {
        const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
        renderer.setPixelRatio(1); renderer.setSize(width, height);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = this.renderer.toneMappingExposure;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        const job = new StudioRenderer(renderer);
        try {
            job.tracer.bounces = this.tracer.bounces;
            job.tracer.tiles.set(4, 4);
            job.tracer.renderScale = 1;
            const exportCamera = camera.clone(); exportCamera.aspect = width / height; exportCamera.updateProjectionMatrix();
            job.prepare(source, exportCamera);
            while (job.tracer.samples < samples) {
                if (signal.aborted) throw new DOMException('Render cancelled', 'AbortError');
                job.tracer.renderSample();
                onProgress?.(Math.min(100, Math.floor(job.tracer.samples / samples * 100)));
                await new Promise(resolve => setTimeout(resolve, 0));
            }
            if (this.denoiseEnabled) job.denoise();
            return await new Promise((resolve, reject) => renderer.domElement.toBlob(blob => blob ? resolve(blob) : reject(new Error('Image encoding failed')), 'image/png'));
        } finally { job.dispose(); renderer.dispose(); renderer.forceContextLoss(); }
    }
    dispose() {
        // 0.0.23's public dispose refers to the removed _renderQuad field.
        // Dispose the actual resources in this pinned release explicitly.
        this.tracer._quad?.material.dispose();
        this.tracer._quad?.dispose();
        this.tracer._pathTracer?.dispose();
        this.tracer._lowResPathTracer?.dispose();
        this.tracer._internalBackground?.dispose();
        this.tracer._generator?.geometry?.dispose();
        this.denoiseQuad.material.dispose(); this.denoiseQuad.dispose();
        this.disposeSnapshot(); this.environment.dispose();
    }
}
