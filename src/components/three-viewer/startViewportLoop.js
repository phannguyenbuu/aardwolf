import * as THREE from "three";

export default function startViewportLoop({ refs, camera, controls, trackCamera, setCameraTelemetry, renderer, scene, setRenderStatus, composer, onFrameReady }) {
    const {
        cameraAnimRef,
        isReadyRef,
        hasFramedCameraRef,
        pathTraceOpenRef,
        lowQualityRef,
        legacyPreviewRef,
        renderModeRef,
        hdrSSRRef,
        qualityRef,
        statusTimeRef,
        studioRendererRef,
        exportAbortRef,
    } = refs;
    // Animation loop
    let lastTelemetryTime = 0;
    let animationFrameId;
    let stopped = false, hdrLoading = false, hdrFailed = false;
    let presentationPending = false;
    let preparedRevision, preparedSignature = null, preparedFrames = 0;
    const animate = (timestamp) => {
    animationFrameId = requestAnimationFrame(animate);

    const anim = cameraAnimRef.current;
    if (anim.active) {
        if (!anim.startTime) anim.startTime = timestamp;
        const elapsed = (timestamp - anim.startTime) / 1000;
        const progress = Math.min(elapsed / anim.duration, 1);
        const ease = 0.5 - Math.cos(progress * Math.PI) / 2;

        camera.position.lerpVectors(anim.startPos, anim.endPos, ease);
        controls.target.lerpVectors(anim.startTarget, anim.endTarget, ease);

        if (progress >= 1) {
            anim.active = false;
            anim.startTime = null;
        }
    }

    if (controls) {
        controls.update();
    }

    // Real-time camera telemetry
    if (timestamp - lastTelemetryTime > 120) {
        lastTelemetryTime = timestamp;
        const p = camera.position;
        const t = controls.target;
        const dist = Math.round(p.distanceTo(t));
        const delta = new THREE.Vector3().subVectors(p, t);
        const spherical = new THREE.Spherical().setFromVector3(delta);
        const azimuth = Math.round((spherical.theta * 180) / Math.PI);
        const elevation = Math.round(90 - (spherical.phi * 180) / Math.PI);

        let presetName = 'Custom';
        if (Math.abs(azimuth) < 10 && Math.abs(elevation) < 10 && Math.abs(p.z - 9600) < 1000) presetName = 'Cornell Reference';
        else if (Math.abs(azimuth) < 15 && Math.abs(elevation) < 15) presetName = 'Front';
        else if (elevation > 70) presetName = 'Top';
        else if (Math.abs(Math.abs(azimuth) - 90) < 15) presetName = 'Side';
        else if (Math.abs(azimuth - 45) < 25 && elevation > 12 && elevation < 45) presetName = 'Isometric';

        if (isReadyRef.current && hasFramedCameraRef.current) trackCamera({ position: p.toArray(), target: t.toArray(), fov: camera.fov });
        setCameraTelemetry({
            posX: Math.round(p.x),
            posY: Math.round(p.y),
            posZ: Math.round(p.z),
            targetX: Math.round(t.x),
            targetY: Math.round(t.y),
            targetZ: Math.round(t.z),
            distance: dist,
            fov: Math.round(camera.fov),
            azimuth,
            elevation,
            preset: presetName
        });
    }

    // Keep the first frame concealed until the environment and selected models are ready.
    const revealFrame = () => {
        if (!scene.userData?.lightingReady || !scene.userData.assemblyReady || refs.modelLoadingRef?.current || !renderer.domElement || scene.userData.framePresented) return;
        // A Low frame must never be used to reveal the initial PBR scene.
        if (lowQualityRef.current) return;
        let texturesReady = true;
        const signature = [scene.environment?.uuid, scene.environment?.version, renderer.getPixelRatio?.()];
        scene.traverseVisible?.(object => {
            if (!object.isMesh) return;
            for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
                if (!material) continue;
                signature.push(material.uuid, material.version);
                for (const value of Object.values(material)) {
                    if (!value?.isTexture) continue;
                    signature.push(value.uuid, value.version);
                    const images = Array.isArray(value.image) ? value.image : [value.image];
                    if (images.some(image => !image || image.complete === false)) texturesReady = false;
                }
            }
        });
        const revision = scene.userData.presentationRevision;
        const key = signature.join(':');
        if (!texturesReady || preparedRevision !== revision || preparedSignature !== key) {
            preparedRevision = revision; preparedSignature = key; preparedFrames = 0;
            return;
        }
        // Warm up the complete lit scene offscreen before publishing its frame.
        if (++preparedFrames < 2 || presentationPending) return;
        presentationPending = true;
        requestAnimationFrame(() => {
            presentationPending = false;
            if (stopped || revision !== scene.userData.presentationRevision || refs.modelLoadingRef?.current || !scene.userData.assemblyReady || lowQualityRef.current) return;
            renderer.domElement.style.visibility = 'visible';
            scene.userData.framePresented = true;
            onFrameReady?.();
        });
    };
    // The modal owns the GPU work while tracing a frozen scene.
    if (pathTraceOpenRef.current || renderer.getContext().isContextLost()) return;
    if (lowQualityRef.current) {
        legacyPreviewRef.current.render(renderer, scene, camera);
        revealFrame();
        return;
    }
    let traced = false;
    if (isReadyRef.current && renderModeRef.current === 'hdr-ssr') {
        try {
            if (!hdrSSRRef.current && !hdrLoading && !hdrFailed) {
                hdrLoading = true;
                import('../../rendering/HdrSSRRenderer.js').then(({ HdrSSRRenderer }) => {
                    if (!stopped) { hdrSSRRef.current = new HdrSSRRenderer(renderer); window.__hdrSSR = hdrSSRRef.current; }
                }).catch(error => { hdrFailed = true; setRenderStatus('HDR unavailable: ' + error.message); }).finally(() => { hdrLoading = false; });
            }
            traced = hdrSSRRef.current?.render(scene, camera, qualityRef.current);
            if (performance.now() - statusTimeRef.current > 1000) { setRenderStatus(traced ? 'HDR + Screen-space Reflections' : 'Loading HDR environment...'); statusTimeRef.current = performance.now(); }
        } catch (error) { setRenderStatus('HDR / SSR unavailable: ' + error.message); }
    }
    if (!traced && renderModeRef.current !== 'hdr-ssr' && isReadyRef.current && studioRendererRef.current && !exportAbortRef.current) {
        try {
            studioRendererRef.current.tracer.bounces = qualityRef.current.renderBounces || 8;
            studioRendererRef.current.denoiseEnabled = qualityRef.current.renderDenoise !== false;
            // The viewport stays interactive; tracing starts only in the explicit Render dialog.
            traced = false;
            if (performance.now() - statusTimeRef.current > 1000 && !exportAbortRef.current) {
                setRenderStatus('Interactive preview');
                statusTimeRef.current = performance.now();
            }
        } catch (error) {
            console.error('Progressive render failed', error);
            studioRendererRef.current.dispose(); studioRendererRef.current = null;
            setRenderStatus('Raster fallback: progressive render unavailable');
        }
    }
    if (!traced) {
        const activeComposer = refs.composerRef ? refs.composerRef.current : composer;
        if (activeComposer) activeComposer.render();
        else {
            legacyPreviewRef.current.render(renderer, scene, camera);
            if (scene.userData?.lightingFallback) revealFrame();
            return;
        }
    }
    if (renderModeRef.current !== 'hdr-ssr' || traced) revealFrame();
    };
    animate();
    return () => { stopped = true; cancelAnimationFrame(animationFrameId); };
}
