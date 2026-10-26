import React from 'react';
import { useConfigurator } from '../../context/ConfiguratorContext.jsx';

export default function TabEnvironment() {
    const {
        studioTheme,
        setStudioTheme,
        setCameraPresetTrigger,
        downlightEnabled,
        setDownlightEnabled,
        downlightIntensity,
        setDownlightIntensity,
        downlightColorTemp,
        setDownlightColorTemp,
        cornellLeftColor,
        setCornellLeftColor,
        cornellRightColor,
        setCornellRightColor,
        cornellBleedIntensity,
        setCornellBleedIntensity,
        waveletParams,
        updateWaveletParam,
        applyQualityPreset
    } = useConfigurator();

    return (
        <div className="tab-pane-content tab-environment">
            {/* 1. ROOM ENVIRONMENT / STAGE MODE */}
            <div className="tab-section-card mb-3">
                <div className="section-card-header d-flex justify-content-between align-items-center">
                    <span className="card-title">1. Không gian & Môi trường ánh sáng:</span>
                </div>
                <div className="env-theme-grid mb-2">
                    <button
                        type="button"
                        className={`env-card-btn ${studioTheme === 'cornell' ? 'active' : ''}`}
                        onClick={() => setStudioTheme('cornell')}
                    >
                        <span className="theme-indicator dot-cornell" />
                        <span className="theme-name">🔴🟢 Cornell Box</span>
                        <span className="theme-sub">Realtime Path Tracing</span>
                    </button>
                    <button
                        type="button"
                        className={`env-card-btn ${studioTheme === 'studio' ? 'active' : ''}`}
                        onClick={() => setStudioTheme('studio')}
                    >
                        <span className="theme-indicator dot-studio" />
                        <span className="theme-name">⚪ Studio Showroom</span>
                        <span className="theme-sub">Cyclorama Vô Cực</span>
                    </button>
                    <button
                        type="button"
                        className={`env-card-btn ${studioTheme === 'workshop' ? 'active' : ''}`}
                        onClick={() => setStudioTheme('workshop')}
                    >
                        <span className="theme-indicator dot-workshop" />
                        <span className="theme-name">🏭 Workshop</span>
                        <span className="theme-sub">Xưởng Công Nghiệp</span>
                    </button>
                    <button
                        type="button"
                        className={`env-card-btn ${studioTheme === 'blueprint' ? 'active' : ''}`}
                        onClick={() => setStudioTheme('blueprint')}
                    >
                        <span className="theme-indicator dot-blueprint" />
                        <span className="theme-name">📐 Blueprint CAD</span>
                        <span className="theme-sub">Bản Vẽ Công Nghệ</span>
                    </button>
                </div>

                {/* 🔒 LOCK REFERENCE CORNELL VIEW BUTTON */}
                <div className="mt-2">
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-danger w-100 font-weight-bold d-flex align-items-center justify-content-center py-2"
                        style={{ borderRadius: 8, fontSize: 13, gap: 6 }}
                        onClick={() => {
                            setStudioTheme('cornell');
                            setCameraPresetTrigger('cornell-reference');
                        }}
                        title="Khóa góc camera chính diện vào hộp Cornell Box chuẩn theo mẫu tham khảo Realtime Path Tracing"
                    >
                        <span>🔒 Khóa View nhìn chuẩn tham khảo (Cornell Reference View)</span>
                    </button>
                </div>
            </div>

            {/* 2. DOWNLIGHT & CEILING ILLUMINATION */}
            {studioTheme === 'cornell' && (
                <div className="tab-section-card mb-3">
                    <div className="section-card-header d-flex justify-content-between align-items-center">
                        <span className="card-title">2. Đèn trần Downlight Emitter:</span>
                        <div className="custom-control custom-switch">
                            <input
                                type="checkbox"
                                className="custom-control-input"
                                id="downlightToggle"
                                checked={downlightEnabled}
                                onChange={(e) => setDownlightEnabled(e.target.checked)}
                            />
                            <label className="custom-control-label" htmlFor="downlightToggle">
                                {downlightEnabled ? 'Bật' : 'Tắt'}
                            </label>
                        </div>
                    </div>

                    <div className="pbr-slider-group mb-2">
                        <div className="slider-label-row">
                            <span>Cường độ đèn trần (Intensity):</span>
                            <strong>{downlightIntensity.toFixed(1)}</strong>
                        </div>
                        <input
                            type="range"
                            className="custom-range"
                            min="0.5"
                            max="10.0"
                            step="0.2"
                            value={downlightIntensity}
                            onChange={(e) => setDownlightIntensity(parseFloat(e.target.value))}
                            disabled={!downlightEnabled}
                        />
                    </div>

                    <div className="d-flex align-items-center justify-content-between mt-2">
                        <span style={{ fontSize: 12, fontWeight: 600 }}>Nhiệt độ màu:</span>
                        <div className="btn-group btn-group-sm">
                            <button
                                type="button"
                                className={`btn ${downlightColorTemp === 'warm' ? 'btn-warning text-white' : 'btn-outline-secondary'}`}
                                onClick={() => setDownlightColorTemp('warm')}
                            >
                                Ấm (3000K)
                            </button>
                            <button
                                type="button"
                                className={`btn ${downlightColorTemp === 'neutral' ? 'btn-light active' : 'btn-outline-secondary'}`}
                                onClick={() => setDownlightColorTemp('neutral')}
                            >
                                Trung tính (4500K)
                            </button>
                            <button
                                type="button"
                                className={`btn ${downlightColorTemp === 'cool' ? 'btn-info text-white' : 'btn-outline-secondary'}`}
                                onClick={() => setDownlightColorTemp('cool')}
                            >
                                Trắng lạnh (6500K)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. WALL COLORS & RADIOSITY BOUNCE */}
            {studioTheme === 'cornell' && (
                <div className="tab-section-card mb-3">
                    <div className="section-card-header">
                        <span className="card-title">3. Màu vách tường & Phản xạ màu (Color Bleed):</span>
                    </div>

                    <div className="row mb-2">
                        <div className="col-6">
                            <label style={{ fontSize: 12, fontWeight: 600 }}>Vách trái (Left Wall):</label>
                            <div className="d-flex align-items-center gap-2">
                                <input
                                    type="color"
                                    className="color-input-picker"
                                    value={cornellLeftColor}
                                    onChange={(e) => setCornellLeftColor(e.target.value)}
                                />
                                <span className="color-hex-tag">{cornellLeftColor.toUpperCase()}</span>
                            </div>
                        </div>
                        <div className="col-6">
                            <label style={{ fontSize: 12, fontWeight: 600 }}>Vách phải (Right Wall):</label>
                            <div className="d-flex align-items-center gap-2">
                                <input
                                    type="color"
                                    className="color-input-picker"
                                    value={cornellRightColor}
                                    onChange={(e) => setCornellRightColor(e.target.value)}
                                />
                                <span className="color-hex-tag">{cornellRightColor.toUpperCase()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="pbr-slider-group mb-1">
                        <div className="slider-label-row">
                            <span>Độ hắt màu tường lên máy (Color Bleed):</span>
                            <strong>{cornellBleedIntensity.toFixed(1)}x</strong>
                        </div>
                        <input
                            type="range"
                            className="custom-range"
                            min="0.0"
                            max="3.0"
                            step="0.1"
                            value={cornellBleedIntensity}
                            onChange={(e) => setCornellBleedIntensity(parseFloat(e.target.value))}
                        />
                    </div>
                </div>
            )}

            {/* 4. WAVELET FILTER & PATH TRACER SETTINGS (KHẮP PHỤC VỆT SỌC & KHỬ NHIỄU THEO BẢN THAM KHẢO) */}
            <div className="tab-section-card mb-3 wavelet-filter-card">
                <div className="section-card-header d-flex justify-content-between align-items-center">
                    <span className="card-title">
                        4. Wavelet Filter & Path Tracer Settings:
                    </span>
                    <span className="badge badge-success">A-Trous Denoise</span>
                </div>

                <p className="text-muted mb-2" style={{ fontSize: 11.5 }}>
                    Bộ lọc khử nhiễu đa nấc (À-Trous Wavelet Denoising Filter) giúp bề mặt mịn màng không bị sọc ngang lượng tử hóa:
                </p>

                {/* WAVELET PARAMS */}
                <div className="wavelet-params-box p-2 mb-2" style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 6 }}>
                    <div className="pbr-slider-group mb-1">
                        <div className="slider-label-row" style={{ fontSize: 11.5 }}>
                            <span>c_phi (Color threshold):</span>
                            <strong>{waveletParams.c_phi}</strong>
                        </div>
                        <input
                            type="range"
                            className="custom-range"
                            min="10"
                            max="200"
                            step="1"
                            value={waveletParams.c_phi}
                            onChange={(e) => updateWaveletParam('c_phi', parseInt(e.target.value))}
                        />
                    </div>

                    <div className="pbr-slider-group mb-1">
                        <div className="slider-label-row" style={{ fontSize: 11.5 }}>
                            <span>n_phi (Normal threshold):</span>
                            <strong>{waveletParams.n_phi.toFixed(3)}</strong>
                        </div>
                        <input
                            type="range"
                            className="custom-range"
                            min="0.001"
                            max="0.05"
                            step="0.001"
                            value={waveletParams.n_phi}
                            onChange={(e) => updateWaveletParam('n_phi', parseFloat(e.target.value))}
                        />
                    </div>

                    <div className="pbr-slider-group mb-1">
                        <div className="slider-label-row" style={{ fontSize: 11.5 }}>
                            <span>p_phi (Position threshold):</span>
                            <strong>{waveletParams.p_phi.toFixed(2)}</strong>
                        </div>
                        <input
                            type="range"
                            className="custom-range"
                            min="0.1"
                            max="5.0"
                            step="0.1"
                            value={waveletParams.p_phi}
                            onChange={(e) => updateWaveletParam('p_phi', parseFloat(e.target.value))}
                        />
                    </div>

                    <div className="pbr-slider-group mb-1">
                        <div className="slider-label-row" style={{ fontSize: 11.5 }}>
                            <span>c_phiMultiplier:</span>
                            <strong>{waveletParams.c_phiMultiplier.toFixed(2)}</strong>
                        </div>
                        <input
                            type="range"
                            className="custom-range"
                            min="0.1"
                            max="1.0"
                            step="0.02"
                            value={waveletParams.c_phiMultiplier}
                            onChange={(e) => updateWaveletParam('c_phiMultiplier', parseFloat(e.target.value))}
                        />
                    </div>

                    <div className="pbr-slider-group mb-1">
                        <div className="slider-label-row" style={{ fontSize: 11.5 }}>
                            <span>stepMultiplier:</span>
                            <strong>{waveletParams.stepMultiplier.toFixed(1)}</strong>
                        </div>
                        <input
                            type="range"
                            className="custom-range"
                            min="1.0"
                            max="4.0"
                            step="0.1"
                            value={waveletParams.stepMultiplier}
                            onChange={(e) => updateWaveletParam('stepMultiplier', parseFloat(e.target.value))}
                        />
                    </div>

                    <div className="pbr-slider-group mb-1">
                        <div className="slider-label-row" style={{ fontSize: 11.5 }}>
                            <span>iterations (Số chu kỳ lọc À-Trous):</span>
                            <strong>{waveletParams.iterations}</strong>
                        </div>
                        <input
                            type="range"
                            className="custom-range"
                            min="1"
                            max="20"
                            step="1"
                            value={waveletParams.iterations}
                            onChange={(e) => updateWaveletParam('iterations', parseInt(e.target.value))}
                        />
                    </div>

                    <div className="custom-control custom-checkbox mt-2">
                        <input
                            type="checkbox"
                            className="custom-control-input"
                            id="atrous5x5Check"
                            checked={waveletParams.atrous5x5}
                            onChange={(e) => updateWaveletParam('atrous5x5', e.target.checked)}
                        />
                        <label className="custom-control-label font-weight-bold" htmlFor="atrous5x5Check" style={{ fontSize: 12 }}>
                            atrous5x5 (Bộ lọc nhân 5x5 B3-spline)
                        </label>
                    </div>
                </div>

                {/* PATH TRACER & REPROJECTION */}
                <div className="row mb-2">
                    <div className="col-6">
                        <label style={{ fontSize: 11.5, fontWeight: 600 }}>spp (Samples per pixel):</label>
                        <select
                            className="form-control form-control-sm"
                            value={waveletParams.spp}
                            onChange={(e) => updateWaveletParam('spp', parseInt(e.target.value))}
                        >
                            <option value="1">1 spp (Fast)</option>
                            <option value="2">2 spp</option>
                            <option value="3">3 spp (Balanced)</option>
                            <option value="6">6 spp</option>
                            <option value="12">12 spp (Ultra)</option>
                        </select>
                    </div>
                    <div className="col-6">
                        <label style={{ fontSize: 11.5, fontWeight: 600 }}>maxFramesHistory:</label>
                        <input
                            type="number"
                            className="form-control form-control-sm"
                            min="1"
                            max="60"
                            value={waveletParams.maxFramesHistory}
                            onChange={(e) => updateWaveletParam('maxFramesHistory', parseInt(e.target.value))}
                        />
                    </div>
                </div>

                {/* QUALITY PRESETS BUTTONS */}
                <div className="quality-presets-bar mt-2">
                    <span style={{ fontSize: 11.5, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                        Quality Presets:
                    </span>
                    <div className="btn-group btn-group-sm w-100">
                        {['lowQuality', 'mediumQuality', 'highQuality', 'veryHighQuality'].map(q => (
                            <button
                                key={q}
                                type="button"
                                className={`btn ${waveletParams.qualityPreset === q ? 'btn-primary' : 'btn-outline-secondary'}`}
                                onClick={() => applyQualityPreset(q)}
                                style={{ fontSize: 11 }}
                            >
                                {q.replace('Quality', '')}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
