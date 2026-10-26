import React, { useState } from 'react';
import { useConfigurator } from '../../context/ConfiguratorContext.jsx';

export default function TabStudioHD() {
    const {
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
            {/* 1. VIEWPORT MODE SWITCHER */}
            <div className="tab-section-card mb-3">
                <div className="section-card-header">
                    <span className="card-title">1. Chế độ Viewport (Render Mode):</span>
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
                    <span className="card-title">2. Công cụ Studio & Xuất ảnh 4K:</span>
                </div>
                <div className="d-flex flex-column gap-2">
                    <button
                        type="button"
                        className="btn btn-danger btn-sm font-weight-bold d-flex align-items-center justify-content-center py-2"
                        onClick={triggerExportRender}
                        disabled={isExporting}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mr-2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                        </svg>
                        <span>{isExporting ? 'Đang xuất ảnh 4K...' : 'Tải ảnh Render 4K UHD (3840×2160)'}</span>
                    </button>

                    <div className="d-flex gap-2">
                        <button
                            type="button"
                            className={`btn btn-sm flex-1 ${isTurntableActive ? 'btn-warning font-weight-bold' : 'btn-outline-dark'}`}
                            onClick={() => setCameraPresetTrigger('360')}
                        >
                            {isTurntableActive ? '⏸ Tạm dừng 360°' : '🔄 Xoay 360° Mâm Tròn'}
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-dark flex-1"
                            onClick={() => setCameraPresetTrigger('focus-suction')}
                        >
                            🔍 Cận cảnh Giác Hút
                        </button>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mt-1">
                        <span style={{ fontSize: 12, fontWeight: 600 }}>Bảng thông số kính mờ (Specs HUD):</span>
                        <div className="custom-control custom-switch">
                            <input
                                type="checkbox"
                                className="custom-control-input"
                                id="hudToggle"
                                checked={showSpecsHUD}
                                onChange={(e) => setShowSpecsHUD(e.target.checked)}
                            />
                            <label className="custom-control-label" htmlFor="hudToggle">
                                {showSpecsHUD ? 'Bật' : 'Tắt'}
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. CAMERA PRESETS */}
            <div className="tab-section-card mb-3">
                <div className="section-card-header">
                    <span className="card-title">3. Góc nhìn Camera (Camera Presets):</span>
                </div>
                <div className="camera-presets-grid">
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setCameraPresetTrigger('cornell-reference')}
                    >
                        🔒 Cornell Box View
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setCameraPresetTrigger('front-view')}
                    >
                        👁️ Chính diện (Front)
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setCameraPresetTrigger('top-view')}
                    >
                        ⬆️ Từ trên (Top)
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setCameraPresetTrigger('left-view')}
                    >
                        ➡️ Nhìn cạnh (Side)
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setCameraPresetTrigger('ortho-view')}
                    >
                        📐 Trục đo (Isometric)
                    </button>
                </div>
            </div>

            {/* 4. CAMERA TELEMETRY READOUTS */}
            <div className="tab-section-card mb-3">
                <div className="section-card-header d-flex justify-content-between align-items-center">
                    <span className="card-title">4. Tọa độ Camera thời gian thực (Telemetry):</span>
                    <button
                        type="button"
                        className="btn btn-xs btn-outline-primary"
                        onClick={() => handleCopy('all', `Camera Pos: ${cameraTelemetry.posX}, ${cameraTelemetry.posY}, ${cameraTelemetry.posZ} | Target: ${cameraTelemetry.targetX}, ${cameraTelemetry.targetY}, ${cameraTelemetry.targetZ} | Dist: ${cameraTelemetry.distance} | FOV: ${cameraTelemetry.fov}°`)}
                    >
                        {copiedField === 'all' ? '✓ Đã sao chép' : '📋 Sao chép tọa độ'}
                    </button>
                </div>
                <div className="telemetry-table-box p-2" style={{ background: '#f8fafc', borderRadius: 6, fontSize: 11.5 }}>
                    <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted">Vị trí (XYZ):</span>
                        <strong>{cameraTelemetry.posX}, {cameraTelemetry.posY}, {cameraTelemetry.posZ}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted">Tâm nhìn (Target):</span>
                        <strong>{cameraTelemetry.targetX}, {cameraTelemetry.targetY}, {cameraTelemetry.targetZ}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted">Khoảng cách:</span>
                        <strong>{cameraTelemetry.distance} mm</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                        <span className="text-muted">Góc nhìn (FOV):</span>
                        <strong>{cameraTelemetry.fov}° ({cameraTelemetry.preset})</strong>
                    </div>
                </div>
            </div>
        </div>
    );
}
