import CameraController from "./CameraController.jsx";
import GripPointEditor from "./GripPointEditor.jsx";
import { lazy, Suspense } from 'react';
const PathTraceDialog = lazy(() => import('./PathTraceDialog.jsx'));
const RenderDialog = lazy(() => import('./RenderDialog.jsx'));
import { PART_ICONS, PART_LABELS } from "../constants/pbrMaterials.js";
import useThreeViewport from './three-viewer/useThreeViewport.js';

export default function ThreeViewer() {
    const {
        studioTheme,
        viewportMode,
        adminMode,
        sceneRef,
        cameraRef,
        rendererRef,
        partRootsRef,
        controlsRef,
        gripGeneration,
        lowQuality,
        setLowQuality,
        is3DLoading,
        lightingReady,
        backgroundModelProgress,
        loadingProgress,
        modelLoadError,
        setModelRetry,
        renderDialog,
        qualityRef,
        setRenderDialog,
        captureForDialog,
        renderForDialog,
        containerRef,
        setShow3DModal,
        reloadScene,
        takeSnapshotRef,
        setCameraInfoOpen,
        cameraInfoOpen,
        cameraTelemetry,
        unit,
        craneType,
        jibLength,
        workLoadLimit,
        environment,
        userSurfaceType,
        actualLoad,
        suctionHeadId,
        handleId,
        suctionModelVariant,
        customNotes,
        setSettingsCopied,
        settingsCopied,
        clickedPin,
        exportProgress,
        exportAbortRef,
        settingsSaving,
        settingsDirty,
        settingsSaved,
        saveAllSettings,
        settingsStatus,
        undoEdit,
        canUndo,
        redoEdit,
        canRedo,
    } = useThreeViewport();
    return (
        <div className={`three-viewport-wrapper theme-${studioTheme} mode-${viewportMode} ${adminMode ? 'is-admin-mode' : 'is-user-mode'}`}>
            {adminMode && <CameraController />}
            <GripPointEditor scene={sceneRef.current} camera={cameraRef.current} renderer={rendererRef.current} roots={partRootsRef} controls={controlsRef.current} generation={gripGeneration} />
            {adminMode && <button type="button" className={`viewport-quality-toggle ${lowQuality ? 'is-low' : ''}`} role="switch" aria-checked={!lowQuality} aria-label="High quality viewport" title={lowQuality ? 'Low Quality — click for High Quality' : 'High Quality — click for Low Quality'} onClick={() => setLowQuality(value => !value)}><span>High</span><span className="viewport-quality-track" aria-hidden="true" /><span>Low</span></button>}
            {is3DLoading && <div className="viewport-loading-spinner" aria-hidden="true"><i className="fas fa-circle-notch fa-spin" /></div>}
            {modelLoadError && <div className="viewport-model-loading" role="alert">{modelLoadError} <button type="button" className="btn btn-sm btn-light" onClick={() => setModelRetry(value => value + 1)} aria-label="Retry loading models" title="Retry"><i className="fas fa-redo" aria-hidden="true" /></button></div>}
            <Suspense fallback={<div className="viewport-model-loading" role="status">Loading renderer…</div>}>
            {renderDialog === 'pathtrace' ? <PathTraceDialog hideCloseButton={!adminMode} source={sceneRef.current} camera={cameraRef.current} previewSize={{ width: rendererRef.current.domElement.width, height: rendererRef.current.domElement.height, cssWidth: rendererRef.current.domElement.clientWidth, cssHeight: rendererRef.current.domElement.clientHeight }} exposure={rendererRef.current?.toneMappingExposure || 1.15} samples={qualityRef.current.renderSamples || 128} bounces={qualityRef.current.renderBounces || 8} onClose={() => setRenderDialog(null)} /> : renderDialog && <RenderDialog hideCloseButton={!adminMode} mode={renderDialog} capture={captureForDialog} render={renderForDialog} onClose={() => setRenderDialog(null)} />}
            </Suspense>
            {/* Live Interactive Three.js WebGL Container */}
            <div
                id="threejs-container"
                ref={containerRef}
            />

            {/* Fullscreen Expand Button */}
            {adminMode && <button
                type="button"
                className="viewport-fullscreen-toggle"
                onClick={() => setShow3DModal(true)}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
            </button>}

            {adminMode && <button type="button" className="btn btn-danger viewport-render-action" title="Photorealistic render: usually takes about 1 to 5 minutes, depending on quality and scene size" aria-label="Render" onClick={() => window.dispatchEvent(new CustomEvent("aardwolf-render-dialog", { detail: "realistic" }))}><i className="fas fa-camera" aria-hidden="true" /> Render</button>}
            {adminMode && <button type="button" className="btn viewport-pathtrace-action" aria-label="Path Tracing" onClick={() => window.dispatchEvent(new CustomEvent("aardwolf-render-dialog", { detail: "pathtrace" }))}>Path Tracing</button>}
            {adminMode && <button type="button" className="viewport-reload-scene" title="Reload 3D scene from files" aria-label="Reload 3D scene" disabled={is3DLoading || !!renderDialog} onClick={reloadScene}><i className="fas fa-sync-alt" aria-hidden="true" /></button>}
            {adminMode && <button type="button" className="viewport-capture" title="Capture viewport as PNG" aria-label="Capture viewport" disabled={is3DLoading} onClick={async () => {
                const dataUrl = await takeSnapshotRef.current?.();
                if (!dataUrl) return;
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = `aardwolf-capture-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png`;
                link.click();
            }}><i className="fas fa-image" aria-hidden="true" /></button>}
            {adminMode && <button type="button" className="viewport-copy-settings" title="Camera & Copy JSON" aria-label="Camera & Copy JSON" onClick={() => setCameraInfoOpen(true)}>{'<>'}</button>}
            {adminMode && cameraInfoOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: '#0005', display: 'grid', placeItems: 'center' }} onClick={() => setCameraInfoOpen(false)}>
                <section role="dialog" aria-modal="true" aria-label="Camera & Copy JSON" style={{ background: '#fff', borderRadius: 12, padding: 20, width: 'min(440px, 95vw)' }} onClick={e => e.stopPropagation()}>
                    <div className="d-flex justify-content-between mb-3"><strong>Camera Telemetry</strong><button type="button" aria-label="Close" onClick={() => setCameraInfoOpen(false)}>×</button></div>
                    <div>Position (XYZ): {cameraTelemetry.posX}, {cameraTelemetry.posY}, {cameraTelemetry.posZ}</div>
                    <div>Target: {cameraTelemetry.targetX}, {cameraTelemetry.targetY}, {cameraTelemetry.targetZ}</div>
                    <div>Distance: {cameraTelemetry.distance} mm</div>
                    <div>Field of View: {cameraTelemetry.fov}° ({cameraTelemetry.preset})</div>
                    <div className="d-flex gap-2 mt-3">
                        <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => navigator.clipboard.writeText(JSON.stringify(cameraTelemetry, null, 2))}>Copy Coordinates</button>
                        <button type="button" className="btn btn-primary btn-sm" onClick={async () => {
                            await navigator.clipboard.writeText(JSON.stringify({ unit, craneType, jibLength, workLoadLimit, environment, surfaceType: userSurfaceType, actualLoad, suctionHeadId, handleId, suctionModelVariant, customNotes, camera: cameraTelemetry }, null, 2));
                            setSettingsCopied(true); setTimeout(() => setSettingsCopied(false), 2000);
                        }}>{settingsCopied ? 'Copied' : 'Copy JSON'}</button>
                    </div>
                </section>
            </div>}

            {/* 3D Click Pin Feedback */}
            {adminMode && clickedPin && (
                <div
                    className="lumion-click-pin"
                    style={{ left: `${clickedPin.x}px`, top: `${clickedPin.y}px` }}
                >
                    <div className="pin-pulse-ring" />
                    <div className="pin-marker-pill">
                        <span className="pin-icon">{PART_ICONS[clickedPin.partKey]}</span>
                        <span className="pin-label">{PART_LABELS[clickedPin.partKey]}</span>
                    </div>
                </div>
            )}

            <div className="viewport-history-controls" role="group" aria-label="Edit history" style={!adminMode ? { display: 'none' } : undefined}>
                {exportProgress !== null && <button type="button" className="gizmo-btn" onClick={() => exportAbortRef.current?.abort()}>Cancel 4K · {exportProgress}%</button>}
                <button type="button" className="gizmo-btn settings-save-button" aria-label="Save Settings" title={settingsSaving ? 'Saving…' : settingsDirty ? 'Unsaved changes' : settingsSaved ? 'Saved' : 'Save Settings'} disabled={settingsSaving} onClick={saveAllSettings}>
                    {settingsDirty && <span className="settings-dirty-dot" aria-label="Unsaved changes" />}
                    {settingsSaved && !settingsDirty && !settingsSaving && <span className="settings-saved-check" aria-label="Settings saved"><i className="fas fa-check" aria-hidden="true" /></span>}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12l4 4v12a2 2 0 0 1-2 2Z" />
                        <path d="M7 3v6h10V3M7 21v-8h10v8" />
                    </svg>
                </button>
                {settingsStatus && <span className="settings-save-status" role="status">{settingsStatus}</span>}
                <button type="button" className="gizmo-btn" aria-label="Undo" onClick={undoEdit} disabled={!canUndo}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M9 4 4 9l5 5" />
                        <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
                    </svg>
                </button>
                <button type="button" className="gizmo-btn" aria-label="Redo" onClick={redoEdit} disabled={!canRedo}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="m15 4 5 5-5 5" />
                        <path d="M20 9H10a6 6 0 0 0 0 12h3" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
