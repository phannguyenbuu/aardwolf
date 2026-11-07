import * as THREE from 'three';

// Match the original GitHub viewer without changing the saved PBR scene.
export class LegacyPreview {
    constructor() {
        this.originalMaterials = new WeakMap();
        this.fallbacks = new Map();
        this.intensity = 1;
        this.ambient = new THREE.AmbientLight(0xffffff, 0.45);
        this.directional = new THREE.DirectionalLight(0xffffff, 1.2);
        this.directional.castShadow = true;
        this.directional.shadow.mapSize.set(2048, 2048);
        Object.assign(this.directional.shadow.camera, { left: -6000, right: 6000, top: 6000, bottom: -6000, near: 100, far: 24000 });
        this.directional.shadow.bias = -0.0001;
        this.directional.shadow.normalBias = 2;
        this.directional.shadow.radius = 12;
        this.directional.shadow.blurSamples = 25;
        this.directional.target.position.set(1130, 0, 0);
        this.directional.position.set(-340, 14000, -2000);
    }

    render(renderer, scene, camera) {
        this.ambient.intensity = this.intensity;
        this.directional.intensity = 1.5 * this.intensity;
        const environment = scene.environment, background = scene.background;
        const toneMapping = renderer.toneMapping, shadows = renderer.shadowMap.enabled;
        const hidden = [], materials = [];
        scene.traverse(object => {
            // Keep selection and transform helpers, including their child materials.
            for (let parent = object; parent; parent = parent.parent) {
                if (parent.userData.isEditorHelper) return;
            }
            if ((object.isLight && object.name !== 'viewport-shadow-light') || (object.isStageElement && object.name !== 'ground_plane')) {
                hidden.push([object, object.visible]);
                object.visible = false;
            }
            if (!object.isMesh || !object.material || object.isStageElement || object.material.isShadowMaterial) return;
            const source = object.material;
            // Both modes now share the database color/texture; Low only simplifies shading.
            let plain;
            if (!plain) {
                const convert = material => {
                    let cached = this.fallbacks.get(material);
                    if (!cached) {
                        cached = new THREE.MeshPhongMaterial({
                            color: material.color || 0xffffff, map: material.map,
                            transparent: material.transparent, opacity: material.opacity,
                            side: material.side, shininess: 30,
                        });
                        this.fallbacks.set(material, cached);
                    }
                    return cached;
                };
                plain = Array.isArray(source) ? source.map(convert) : convert(source);
            }
            materials.push([object, source]);
            object.material = plain;
        });
        scene.environment = null;
        scene.background = new THREE.Color(0xffffff);
        renderer.toneMapping = THREE.NoToneMapping;
        // The lightweight preview skips shadow-map rendering; High restores it.
        renderer.shadowMap.enabled = false;
        scene.add(this.ambient, this.directional, this.directional.target);
        try {
            renderer.render(scene, camera);
        } finally {
            scene.remove(this.ambient, this.directional, this.directional.target);
            materials.forEach(([object, material]) => { object.material = material; });
            hidden.forEach(([object, visible]) => { object.visible = visible; });
            scene.environment = environment;
            scene.background = background;
            renderer.toneMapping = toneMapping;
            renderer.shadowMap.enabled = shadows;
        }
    }

    dispose() {
        this.fallbacks.forEach(material => material.dispose());
        this.fallbacks.clear();
    }
}
