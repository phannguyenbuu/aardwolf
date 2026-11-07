import { useCallback, useEffect } from "react";
import download from "downloadjs";

export default function useViewportExport({ refs, setIsExporting, setExportProgress, setRenderStatus, exportRenderTrigger }) {
    const { studioRendererRef, isReadyRef, exportAbortRef, renderModeRef, hdrSSRRef, sceneRef, cameraRef, qualityRef } = refs;
    const handleExportRender = useCallback(async () => {
        if (!studioRendererRef.current || !isReadyRef.current || exportAbortRef.current) return;
        const abort = new AbortController();
        exportAbortRef.current = abort;
        setIsExporting(true); setExportProgress(0);
        try {
            const hdr = renderModeRef.current === 'hdr-ssr';
            const blob = hdr && hdrSSRRef.current ? await hdrSSRRef.current.export(sceneRef.current, cameraRef.current, qualityRef.current, abort.signal) : await studioRendererRef.current.export(sceneRef.current, cameraRef.current, {
                signal: abort.signal, samples: qualityRef.current.exportSamples || 512, onProgress: setExportProgress
            });
            download(blob, hdr ? 'Aardwolf_HDR_SSR_4K.png' : 'Aardwolf_Studio_PathTraced_4K.png', 'image/png');
            setRenderStatus(hdr ? '4K HDR + SSR image saved' : '4K path-traced image saved');
        } catch (error) {
            setRenderStatus(error.name === 'AbortError' ? 'Export cancelled' : 'Export failed: ' + error.message);
        } finally {
            exportAbortRef.current = null;
            setIsExporting(false); setExportProgress(null);
            studioRendererRef.current?.invalidate();
        }
    }, [setIsExporting]);

    // Handle export trigger from Column 1
    useEffect(() => {
        if (exportRenderTrigger > 0) {
            handleExportRender();
        }
    }, [exportRenderTrigger, handleExportRender]);
}
