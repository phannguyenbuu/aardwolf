import React, { useState } from 'react';
import { useConfigurator } from '../../context/ConfiguratorContext.jsx';

export default function TabStudioHD() {
    const {
        savedViews, saveCameraView, setCameraRestore,
        waveletParams, updateWaveletParam,
        viewportMode,
        setViewportMode,
        studioTheme,
        setStudioTheme,
        showSpecsHUD,
        setShowSpecsHUD,
        isTurntableActive,
        setIsTurntableActive,
        isExporting,
        triggerExportRender,
        cameraPresetTrigger,
        setCameraPresetTrigger,
        cameraTelemetry
    } = useConfigurator();

    const [copiedField, setCopiedField] = useState(null);
    const [viewName, setViewName] = useState('');

    const handleCopy = (field, text) => {
        try {
            navigator.clipboard.writeText(text);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 1800);
        } catch (e) {
            console.error('Copy failed:', e);
        }
    };

    return (
        <div className="tab-pane-content tab-studio-hd">
            <div className="tab-section-card mb-3">
                <label htmlFor="camera-view-name">Saved Camera Views</label>
                <div className="d-flex gap-2">
                    <input id="camera-view-name" className="form-control" value={viewName} onChange={e => setViewName(e.target.value)} />
                    <button className="btn btn-sm btn-outline-primary" disabled={!viewName.trim()} onClick={() => { saveCameraView(viewName); setViewName(''); }}>Add View</button>
                </div>
                <div className="d-flex gap-2 flex-wrap mt-2">
                    {Object.keys(savedViews).map(name => <button key={name} className="btn btn-sm btn-outline-secondary" onClick={() => setCameraRestore({ ...savedViews[name], request: Date.now() })}>{name}</button>)}
                </div>
            </div>
            {/* 1. VIEWPORT MODE SWITCHER */}
            <div className="tab-section-card mb-3">
                <div className="section-card-header">
                    <span className="card-title">1. Viewport Mode:</span>
                </div>
                <div className="d-flex gap-2">
                    <button
                        type="button"
                        className={`btn btn-sm flex-1 ${viewportMode === 'interactive' ? 'btn-danger font-weight-bold' : 'btn-outline-secondary'}`}
                        onClick={() => setViewportMode('interactive')}
                    >
                        🎮 3D Interactive
                    </button>
                    <button
                        type="button"
                        className={`btn btn-sm flex-1 ${viewportMode === 'studio-render' ? 'btn-danger font-weight-bold' : 'btn-outline-secondary'}`}
                        onClick={() => setViewportMode('studio-render')}
                    >
                        📸 Studio HD Render PRO
                    </button>
                </div>

            </div>

            {/* 2. STUDIO ACTIONS & EXPORT */}
            <div className="tab-section-card mb-3">
                <div className="section-card-header">
                    <span className="card-title">2. Studio Tools & 4K Export:</span>
                </div>
                <div className="d-flex flex-column gap-2">
                    <div className="studio-render-actions">
                        {[['pathtrace','Path Tracing'],['capture','Capture'],['realistic','Render Realistic']].map(([mode,label]) => <button key={mode} type="button" className="btn btn-danger btn-sm" onClick={() => window.dispatchEvent(new CustomEvent('aardwolf-render-dialog', { detail: mode }))}>{label}</button>)}
                    </div>

                    <div className="d-flex gap-2">
                        <button
                            type="button"
                            className={`btn btn-sm flex-1 ${isTurntableActive ? 'btn-warning font-weight-bold' : 'btn-outline-dark'}`}
                            onClick={() => setCameraPresetTrigger('360')}
                        >
                            {isTurntableActive ? '⏸ Pause Turntable' : '🔄 360° Turntable'}
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-dark flex-1"
                            onClick={() => setCameraPresetTrigger('focus-suction')}
                        >
                            🔍 Focus Suction Cups
                        </button>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mt-1">
                        <span style={{ fontSize: 12, fontWeight: 600 }}>Specifications HUD:</span>
                        <div className="custom-control custom-switch">
                            <input
                                type="checkbox"
                                className="custom-control-input"
                                id="hudToggle"
                                checked={showSpecsHUD}
                                onChange={(e) => setShowSpecsHUD(e.target.checked)}
                            />
                            <label className="custom-control-label" htmlFor="hudToggle">
                                {showSpecsHUD ? 'On' : 'Off'}
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. CAMERA TELEMETRY READOUTS */}
            <div className="tab-section-card mb-3">
                <div className="section-card-header d-flex justify-content-between align-items-center">
                    <span className="card-title">3. Camera Telemetry:</span>
                    <button
                        type="button"
                        className="btn btn-xs btn-outline-primary"
                        onClick={() => handleCopy('all', `Camera Pos: ${cameraTelemetry.posX}, ${cameraTelemetry.posY}, ${cameraTelemetry.posZ} | Target: ${cameraTelemetry.targetX}, ${cameraTelemetry.targetY}, ${cameraTelemetry.targetZ} | Dist: ${cameraTelemetry.distance} | FOV: ${cameraTelemetry.fov}°`)}
                    >
                        {copiedField === 'all' ? '✓ Copied' : '📋 Copy Coordinates'}
                    </button>
                </div>
                <div className="telemetry-table-box p-2" style={{ background: '#f8fafc', borderRadius: 6, fontSize: 12 }}>
                    <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted">Position (XYZ):</span>
                        <strong>{cameraTelemetry.posX}, {cameraTelemetry.posY}, {cameraTelemetry.posZ}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted">Target:</span>
                        <strong>{cameraTelemetry.targetX}, {cameraTelemetry.targetY}, {cameraTelemetry.targetZ}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted">Distance:</span>
                        <strong>{cameraTelemetry.distance} mm</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                        <span className="text-muted">Field of View:</span>
                        <strong>{cameraTelemetry.fov}° ({cameraTelemetry.preset})</strong>
                    </div>
                </div>
            </div>
        </div>
    );
}
