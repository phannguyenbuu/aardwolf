import { useEffect, useCallback } from "react";

export default function useViewportCapture({ refs, setRenderDialog }) {
    const { isReadyRef, modelLoadingRef, rendererRef, cameraRef, sceneRef, studioRendererRef, exportAbortRef, hdrSSRRef, qualityRef } = refs;
    useEffect(() => {
        const open = e => {
            if (!isReadyRef.current || modelLoadingRef.current || !rendererRef.current || !cameraRef.current) return;
            setRenderDialog(e.detail);
        };
        window.addEventListener('aardwolf-render-dialog', open);
        return () => window.removeEventListener('aardwolf-render-dialog', open);
    }, []);
    const captureForDialog = useCallback(async () => {
        const renderer = rendererRef.current, scene = sceneRef.current, camera = cameraRef.current;
        if (!renderer || !scene || !camera || !isReadyRef.current) throw new Error('Wait for the model to load');
        const hidden = [];
        scene.traverse(o => { if (o.visible && (o.isSprite || o.isLine || o.isLineSegments || o.isTransformControlsRoot || o.type === 'TransformControlsRoot')) { hidden.push(o); o.visible = false; } });
        try { renderer.render(scene, camera); return renderer.domElement.toDataURL('image/png'); }
        finally { hidden.forEach(o => { o.visible = true; }); studioRendererRef.current?.invalidate(); }
    }, []);
    const renderForDialog = useCallback(async ({ engine, environment, exposure, intensity, signal, onProgress }) => {
        if (!isReadyRef.current) throw new Error('Wait for the model to load');
        exportAbortRef.current = { abort: () => {} };
        try {
            if (engine === 'hdr') {
                const { HdrSSRRenderer } = await import('../../rendering/HdrSSRRenderer.js');
                if (!hdrSSRRef.current) hdrSSRRef.current = new HdrSSRRenderer(rendererRef.current);
                onProgress(null);
                const blob = await hdrSSRRef.current.export(sceneRef.current, cameraRef.current, { ...qualityRef.current, hdrEnvironment: environment, hdrExposure: exposure, hdrIntensity: intensity }, signal, onProgress);
                return blob;
            }
            const { StudioRenderer } = await import('../../rendering/StudioRenderer.js');
            if (!studioRendererRef.current) studioRendererRef.current = new StudioRenderer(rendererRef.current);
            return await studioRendererRef.current.export(sceneRef.current, cameraRef.current, { signal, samples: qualityRef.current.exportSamples || 512, onProgress });
        } finally { exportAbortRef.current = null; studioRendererRef.current?.invalidate(); }
    }, []);
    return { captureForDialog, renderForDialog };
}
