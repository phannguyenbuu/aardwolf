import * as THREE from 'three';
import { createStudioEnvironment } from "../../rendering/studioEnvironment.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { VIEWPORT_HDR_URL } from "../../rendering/environment.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { SSAOPass } from "three/examples/jsm/postprocessing/SSAOPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { SMAAPass } from "three/examples/jsm/postprocessing/SMAAPass.js";

export function createHighQualityViewport({ renderer, scene, camera, refs, antiAliasingStrength }) {
    const { legacyPreviewRef, antiAliasingPassRef, composerRef } = refs;
    const w = renderer.domElement.clientWidth || 1, h = renderer.domElement.clientHeight || 1;
        // Studio HDRI Environment Map via PMREMGenerator & RoomEnvironment
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();
        const studioEnvironment = createStudioEnvironment();
        const studioPMREM = pmremGenerator.fromEquirectangular(studioEnvironment);
        scene.environment = studioPMREM.texture;
        scene.environmentIntensity = legacyPreviewRef.current.intensity;
        let environmentDisposed = false;
        let hdrPMREM = null;
        const ready = new Promise(resolve => {
        new RGBELoader().load(VIEWPORT_HDR_URL, hdr => {
            if (environmentDisposed) { hdr.dispose(); resolve(); return; }
            hdrPMREM = pmremGenerator.fromEquirectangular(hdr);
            hdr.dispose();
            scene.environment = hdrPMREM.texture;
            // HDR lights and reflections only; the visible backdrop stays white.
            scene.background = new THREE.Color(0xffffff);
            resolve();
        }, undefined, error => { console.warn('Viewport HDR unavailable; using studio environment.', error); resolve(); });
        });
        // Do not initialize a path tracer on page load or when switching tabs.


        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));
        const ambientOcclusion = new SSAOPass(scene, camera, w, h, 16);
        ambientOcclusion.kernelRadius = 5;
        ambientOcclusion.minDistance = .001;
        ambientOcclusion.maxDistance = .015;
        composer.addPass(ambientOcclusion);
        const output = new OutputPass();
        // Render targets defer tone mapping to OutputPass, including unlit white
        // backdrop pixels. Preserve those pixels instead of mapping white to grey.
        output.material.fragmentShader = output.material.fragmentShader
            .replace('// tone mapping', 'bool backdropWhite = all(greaterThanEqual(gl_FragColor.rgb, vec3(0.999))) && all(lessThanEqual(gl_FragColor.rgb, vec3(1.001)));\n// tone mapping')
            .replace('// color space', 'if (backdropWhite) gl_FragColor.rgb = vec3(1.0);\n// color space');
        composer.addPass(output);
        const antiAliasing = new SMAAPass(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
        antiAliasing.uniformsBlend.strength = { value: antiAliasingStrength / 100 };
        antiAliasing.materialBlend.fragmentShader = antiAliasing.materialBlend.fragmentShader
            .replace('uniform sampler2D tColor;', 'uniform sampler2D tColor;\nuniform float strength;')
            .replace('mix(C, Cop, s)', 'mix(C, Cop, min(s * strength, 0.5))');
        antiAliasing.enabled = antiAliasingStrength > 0;
        composer.addPass(antiAliasing);
        antiAliasingPassRef.current = antiAliasing;
        composerRef.current = composer;

    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(w, h);
    const adminMode = refs.sceneEditRef.current?.adminMode;
    ambientOcclusion.enabled = !!adminMode;
    return { ready, dispose() {
        environmentDisposed = true;
        if (scene.environment === hdrPMREM?.texture || scene.environment === studioPMREM.texture) scene.environment = null;
        hdrPMREM?.dispose(); studioPMREM.dispose(); studioEnvironment.dispose(); pmremGenerator.dispose();
        output.dispose(); antiAliasing.dispose(); ambientOcclusion.dispose(); composer.dispose();
    } };
}
