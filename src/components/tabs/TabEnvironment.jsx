import React, { useState } from 'react';
import { useConfigurator } from '../../context/ConfiguratorContext.jsx';

export default function TabEnvironment() {
    const {
        studioTheme,
        setStudioTheme,
        setCameraPresetTrigger,
        sceneLights,
        updateSceneLight,
        setExposure,
        resetLighting,
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

    const [activeLightTab, setActiveLightTab] = useState('keyLight');

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

            {/* 2. ĐIỀU CHỈNH CHI TIẾT TỪNG NGUỒN SÁNG TRONG SCENE */}
            <div className="tab-section-card mb-3 custom-lights-card">
                <div className="section-card-header d-flex justify-content-between align-items-center mb-2">
                    <span className="card-title">2. Tùy chỉnh chi tiết từng nguồn sáng:</span>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary py-0 px-2"
                        style={{ fontSize: 11, borderRadius: 6 }}
                        onClick={resetLighting}
                        title="Khôi phục tất cả thông số ánh sáng về mặc định phòng thu chuẩn"
                    >
                        🔄 Đặt lại chuẩn
                    </button>
                </div>

                {/* Sub-tab switcher for light sources */}
                <div className="light-tabs-bar mb-3">
                    <button
                        type="button"
                        className={`light-tab-btn ${activeLightTab === 'keyLight' ? 'active' : ''}`}
                        onClick={() => setActiveLightTab('keyLight')}
                    >
                        💡 Đèn chính
                    </button>
                    <button
                        type="button"
                        className={`light-tab-btn ${activeLightTab === 'downlight' ? 'active' : ''}`}
                        onClick={() => setActiveLightTab('downlight')}
                    >
                        🔦 Đèn trần
                    </button>
                    <button
                        type="button"
                        className={`light-tab-btn ${activeLightTab === 'ambientLight' ? 'active' : ''}`}
                        onClick={() => setActiveLightTab('ambientLight')}
                    >
                        🌅 Môi trường
                    </button>
                    <button
                        type="button"
                        className={`light-tab-btn ${activeLightTab === 'fillRim' ? 'active' : ''}`}
                        onClick={() => setActiveLightTab('fillRim')}
                    >
                        ✨ Đèn viền/phụ
                    </button>
                    <button
                        type="button"
                        className={`light-tab-btn ${activeLightTab === 'exposure' ? 'active' : ''}`}
                        onClick={() => setActiveLightTab('exposure')}
                    >
                        ☀️ Phơi sáng
                    </button>
                </div>

                {/* 2.1 TAB: KEY LIGHT */}
                {activeLightTab === 'keyLight' && sceneLights?.keyLight && (
                    <div className="light-subpanel">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="font-weight-bold" style={{ fontSize: 12.5 }}>Đèn chiếu chính (Directional Key Light):</span>
                            <div className="custom-control custom-switch">
                                <input
                                    type="checkbox"
                                    className="custom-control-input"
                                    id="keyLightEnabledToggle"
                                    checked={sceneLights.keyLight.enabled}
                                    onChange={(e) => updateSceneLight('keyLight', 'enabled', e.target.checked)}
                                />
                                <label className="custom-control-label font-weight-bold" htmlFor="keyLightEnabledToggle" style={{ fontSize: 12 }}>
                                    {sceneLights.keyLight.enabled ? 'Bật' : 'Tắt'}
                                </label>
                            </div>
                        </div>

                        {/* Cast Shadow Switch - Triệt tiêu hoàn toàn hiện tượng chớp tắt bóng */}
                        <div className="d-flex justify-content-between align-items-center mb-2 p-2 rounded" style={{ background: '#f1f5f9', border: '1px solid #cbd5e1' }}>
                            <div>
                                <strong style={{ fontSize: 12, color: '#1e293b' }}>Đổ bóng (Cast Shadow):</strong>
                                <small className="text-muted d-block" style={{ fontSize: 10.5 }}>Bật/tắt bóng đổ trên mặt sàn</small>
                            </div>
                            <div className="custom-control custom-switch">
                                <input
                                    type="checkbox"
                                    className="custom-control-input"
                                    id="keyLightShadowToggle"
                                    checked={sceneLights.keyLight.castShadow}
                                    onChange={(e) => updateSceneLight('keyLight', 'castShadow', e.target.checked)}
                                    disabled={!sceneLights.keyLight.enabled}
                                />
                                <label className="custom-control-label font-weight-bold" htmlFor="keyLightShadowToggle" style={{ fontSize: 12 }}>
                                    {sceneLights.keyLight.castShadow ? 'Bật' : 'Tắt'}
                                </label>
                            </div>
                        </div>

                        {/* Intensity */}
                        <div className="pbr-slider-group mb-2">
                            <div className="slider-label-row">
                                <span>Cường độ sáng (Intensity):</span>
                                <strong>{Number(sceneLights.keyLight.intensity || 0).toFixed(2)}</strong>
                            </div>
                            <input
                                type="range"
                                className="custom-range"
                                min="0.0"
                                max="5.0"
                                step="0.1"
                                value={sceneLights.keyLight.intensity}
                                onChange={(e) => updateSceneLight('keyLight', 'intensity', parseFloat(e.target.value))}
                                disabled={!sceneLights.keyLight.enabled}
                            />
                        </div>

                        {/* Color */}
                        <div className="pbr-slider-group mb-2">
                            <div className="slider-label-row">
                                <span>Màu ánh sáng (Light Color):</span>
                                <strong>{sceneLights.keyLight.color.toUpperCase()}</strong>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <input
                                    type="color"
                                    className="color-input-picker"
                                    value={sceneLights.keyLight.color}
                                    onChange={(e) => updateSceneLight('keyLight', 'color', e.target.value)}
                                    disabled={!sceneLights.keyLight.enabled}
                                />
                                <span className="color-hex-tag">{sceneLights.keyLight.color.toUpperCase()}</span>
                            </div>
                        </div>

                        {/* Position Y, X, Z */}
                        <div className="pbr-slider-group mb-2">
                            <div className="slider-label-row">
                                <span>Độ cao nguồn sáng (Y-Axis):</span>
                                <strong>{sceneLights.keyLight.posY} mm</strong>
                            </div>
                            <input
                                type="range"
                                className="custom-range"
                                min="1000"
                                max="10000"
                                step="200"
                                value={sceneLights.keyLight.posY}
                                onChange={(e) => updateSceneLight('keyLight', 'posY', parseInt(e.target.value))}
                                disabled={!sceneLights.keyLight.enabled}
                            />
                        </div>

                        <div className="pbr-slider-group mb-2">
                            <div className="slider-label-row">
                                <span>Góc chiếu ngang (X-Axis):</span>
                                <strong>{sceneLights.keyLight.posX} mm</strong>
                            </div>
                            <input
                                type="range"
                                className="custom-range"
                                min="-8000"
                                max="8000"
                                step="200"
                                value={sceneLights.keyLight.posX}
                                onChange={(e) => updateSceneLight('keyLight', 'posX', parseInt(e.target.value))}
                                disabled={!sceneLights.keyLight.enabled}
                            />
                        </div>

                        <div className="pbr-slider-group mb-1">
                            <div className="slider-label-row">
                                <span>Chiều sâu góc rọi (Z-Axis):</span>
                                <strong>{sceneLights.keyLight.posZ} mm</strong>
                            </div>
                            <input
                                type="range"
                                className="custom-range"
                                min="-8000"
                                max="8000"
                                step="200"
                                value={sceneLights.keyLight.posZ}
                                onChange={(e) => updateSceneLight('keyLight', 'posZ', parseInt(e.target.value))}
                                disabled={!sceneLights.keyLight.enabled}
                            />
                        </div>
                    </div>
                )}

                {/* 2.2 TAB: DOWNLIGHT (CEILING SPOTLIGHT) */}
                {activeLightTab === 'downlight' && sceneLights?.downlight && (
                    <div className="light-subpanel">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="font-weight-bold" style={{ fontSize: 12.5 }}>Đèn trần Downlight Emitter (SpotLight):</span>
                            <div className="custom-control custom-switch">
                                <input
                                    type="checkbox"
                                    className="custom-control-input"
                                    id="downlightEnabledToggle"
                                    checked={sceneLights.downlight.enabled}
                                    onChange={(e) => updateSceneLight('downlight', 'enabled', e.target.checked)}
                                />
                                <label className="custom-control-label font-weight-bold" htmlFor="downlightEnabledToggle" style={{ fontSize: 12 }}>
                                    {sceneLights.downlight.enabled ? 'Bật' : 'Tắt'}
                                </label>
                            </div>
                        </div>

                        {/* Cast Shadow Switch for Downlight */}
                        <div className="d-flex justify-content-between align-items-center mb-2 p-2 rounded" style={{ background: '#f1f5f9', border: '1px solid #cbd5e1' }}>
                            <div>
                                <strong style={{ fontSize: 12, color: '#1e293b' }}>Đổ bóng từ đèn trần (Downlight Shadow):</strong>
                                <small className="text-muted d-block" style={{ fontSize: 10.5 }}>Tắt để tránh bóng 2 nguồn trùng nhau gây nhấp nháy</small>
                            </div>
                            <div className="custom-control custom-switch">
                                <input
                                    type="checkbox"
                                    className="custom-control-input"
                                    id="downlightShadowToggle"
                                    checked={sceneLights.downlight.castShadow}
                                    onChange={(e) => updateSceneLight('downlight', 'castShadow', e.target.checked)}
                                    disabled={!sceneLights.downlight.enabled}
                                />
                                <label className="custom-control-label font-weight-bold" htmlFor="downlightShadowToggle" style={{ fontSize: 12 }}>
                                    {sceneLights.downlight.castShadow ? 'Bật' : 'Tắt'}
                                </label>
                            </div>
                        </div>

                        {/* Intensity */}
                        <div className="pbr-slider-group mb-2">
                            <div className="slider-label-row">
                                <span>Cường độ đèn trần (Intensity):</span>
                                <strong>{Number(sceneLights.downlight.intensity || 0).toFixed(1)}</strong>
                            </div>
                            <input
                                type="range"
                                className="custom-range"
                                min="0.5"
                                max="10.0"
                                step="0.2"
                                value={sceneLights.downlight.intensity}
                                onChange={(e) => updateSceneLight('downlight', 'intensity', parseFloat(e.target.value))}
                                disabled={!sceneLights.downlight.enabled}
                            />
                        </div>

                        {/* Color Temperature & Custom Color */}
                        <div className="d-flex align-items-center justify-content-between mb-2">
                            <span style={{ fontSize: 12, fontWeight: 600 }}>Nhiệt độ màu:</span>
                            <div className="btn-group btn-group-sm">
                                <button
                                    type="button"
                                    className={`btn ${sceneLights.downlight.colorTemp === 'warm' ? 'btn-warning text-white' : 'btn-outline-secondary'}`}
                                    onClick={() => {
                                        updateSceneLight('downlight', 'colorTemp', 'warm');
                                        updateSceneLight('downlight', 'color', '#fff4d6');
                                    }}
                                >
                                    Ấm (3000K)
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${sceneLights.downlight.colorTemp === 'neutral' ? 'btn-light active' : 'btn-outline-secondary'}`}
                                    onClick={() => {
                                        updateSceneLight('downlight', 'colorTemp', 'neutral');
                                        updateSceneLight('downlight', 'color', '#ffffff');
                                    }}
                                >
                                    Trung tính (4500K)
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${sceneLights.downlight.colorTemp === 'cool' ? 'btn-info text-white' : 'btn-outline-secondary'}`}
                                    onClick={() => {
                                        updateSceneLight('downlight', 'colorTemp', 'cool');
                                        updateSceneLight('downlight', 'color', '#e8f4ff');
                                    }}
                                >
                                    Trắng lạnh (6500K)
                                </button>
                            </div>
                        </div>

                        <div className="pbr-slider-group mb-2">
                            <div className="slider-label-row">
                                <span>Góc tỏa nón sáng (Spot Angle):</span>
                                <strong>{(sceneLights.downlight.angle * (180 / Math.PI)).toFixed(0)}°</strong>
                            </div>
                            <input
                                type="range"
                                className="custom-range"
                                min="0.5"
                                max="1.5"
                                step="0.05"
                                value={sceneLights.downlight.angle}
                                onChange={(e) => updateSceneLight('downlight', 'angle', parseFloat(e.target.value))}
                                disabled={!sceneLights.downlight.enabled}
                            />
                        </div>

                        <div className="pbr-slider-group mb-1">
                            <div className="slider-label-row">
                                <span>Độ chuyển tiếp biên mềm (Penumbra):</span>
                                <strong>{sceneLights.downlight.penumbra.toFixed(2)}</strong>
                            </div>
                            <input
                                type="range"
                                className="custom-range"
                                min="0.0"
                                max="1.0"
                                step="0.05"
                                value={sceneLights.downlight.penumbra}
                                onChange={(e) => updateSceneLight('downlight', 'penumbra', parseFloat(e.target.value))}
                                disabled={!sceneLights.downlight.enabled}
                            />
                        </div>
                    </div>
                )}

                {/* 2.3 TAB: AMBIENT LIGHT */}
                {activeLightTab === 'ambientLight' && sceneLights?.ambientLight && (
                    <div className="light-subpanel">
                        <div className="mb-2">
                            <span className="font-weight-bold" style={{ fontSize: 12.5 }}>Ánh sáng môi trường tổng thể (Ambient Light):</span>
                            <small className="text-muted d-block" style={{ fontSize: 11 }}>Chiếu sáng đều mọi góc khuất, nâng sáng vùng tối tự nhiên</small>
                        </div>

                        <div className="pbr-slider-group mb-2">
                            <div className="slider-label-row">
                                <span>Cường độ sáng môi trường (Intensity):</span>
                                <strong>{Number(sceneLights.ambientLight.intensity || 0).toFixed(2)}</strong>
                            </div>
                            <input
                                type="range"
                                className="custom-range"
                                min="0.0"
                                max="2.0"
                                step="0.05"
                                value={sceneLights.ambientLight.intensity}
                                onChange={(e) => updateSceneLight('ambientLight', 'intensity', parseFloat(e.target.value))}
                            />
                        </div>

                        <div className="pbr-slider-group mb-1">
                            <div className="slider-label-row">
                                <span>Màu sắc ánh sáng môi trường:</span>
                                <strong>{sceneLights.ambientLight.color.toUpperCase()}</strong>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <input
                                    type="color"
                                    className="color-input-picker"
                                    value={sceneLights.ambientLight.color}
                                    onChange={(e) => updateSceneLight('ambientLight', 'color', e.target.value)}
                                />
                                <span className="color-hex-tag">{sceneLights.ambientLight.color.toUpperCase()}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2.4 TAB: FILL & RIM LIGHTS */}
                {activeLightTab === 'fillRim' && (
                    <div className="light-subpanel">
                        {/* Fill Light */}
                        <div className="p-2 mb-3 rounded" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="font-weight-bold" style={{ fontSize: 12 }}>Đèn rọi phụ (Fill Light - Bù sáng góc tối):</span>
                                <div className="custom-control custom-switch">
                                    <input
                                        type="checkbox"
                                        className="custom-control-input"
                                        id="fillLightToggle"
                                        checked={sceneLights.fillLight.enabled}
                                        onChange={(e) => updateSceneLight('fillLight', 'enabled', e.target.checked)}
                                    />
                                    <label className="custom-control-label" htmlFor="fillLightToggle">
                                        {sceneLights.fillLight.enabled ? 'Bật' : 'Tắt'}
                                    </label>
                                </div>
                            </div>
                            <div className="pbr-slider-group mb-1">
                                <div className="slider-label-row">
                                    <span>Cường độ:</span>
                                    <strong>{Number(sceneLights.fillLight.intensity || 0).toFixed(2)}</strong>
                                </div>
                                <input
                                    type="range"
                                    className="custom-range"
                                    min="0.0"
                                    max="3.0"
                                    step="0.1"
                                    value={sceneLights.fillLight.intensity}
                                    onChange={(e) => updateSceneLight('fillLight', 'intensity', parseFloat(e.target.value))}
                                    disabled={!sceneLights.fillLight.enabled}
                                />
                            </div>
                        </div>

                        {/* Rim Light */}
                        <div className="p-2 rounded" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="font-weight-bold" style={{ fontSize: 12 }}>Đèn viền khối (Rim Light - Tách viền vật thể):</span>
                                <div className="custom-control custom-switch">
                                    <input
                                        type="checkbox"
                                        className="custom-control-input"
                                        id="rimLightToggle"
                                        checked={sceneLights.rimLight.enabled}
                                        onChange={(e) => updateSceneLight('rimLight', 'enabled', e.target.checked)}
                                    />
                                    <label className="custom-control-label" htmlFor="rimLightToggle">
                                        {sceneLights.rimLight.enabled ? 'Bật' : 'Tắt'}
                                    </label>
                                </div>
                            </div>
                            <div className="pbr-slider-group mb-1">
                                <div className="slider-label-row">
                                    <span>Cường độ:</span>
                                    <strong>{Number(sceneLights.rimLight.intensity || 0).toFixed(2)}</strong>
                                </div>
                                <input
                                    type="range"
                                    className="custom-range"
                                    min="0.0"
                                    max="3.0"
                                    step="0.1"
                                    value={sceneLights.rimLight.intensity}
                                    onChange={(e) => updateSceneLight('rimLight', 'intensity', parseFloat(e.target.value))}
                                    disabled={!sceneLights.rimLight.enabled}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* 2.5 TAB: EXPOSURE */}
                {activeLightTab === 'exposure' && (
                    <div className="light-subpanel">
                        <div className="mb-2">
                            <span className="font-weight-bold" style={{ fontSize: 12.5 }}>Độ phơi sáng màn hình (Tone Mapping Exposure):</span>
                            <small className="text-muted d-block" style={{ fontSize: 11 }}>Cân chỉnh độ sáng tổng thể của toàn bộ khung hình</small>
                        </div>

                        <div className="pbr-slider-group mb-3">
                            <div className="slider-label-row">
                                <span>Chỉ số Exposure:</span>
                                <strong>{Number(sceneLights.exposure || 1.15).toFixed(2)}</strong>
                            </div>
                            <input
                                type="range"
                                className="custom-range"
                                min="0.4"
                                max="2.5"
                                step="0.05"
                                value={sceneLights.exposure || 1.15}
                                onChange={(e) => setExposure(parseFloat(e.target.value))}
                            />
                        </div>

                        <div className="d-flex justify-content-between gap-2">
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary flex-1"
                                onClick={() => setExposure(0.85)}
                            >
                                Tối dịu (0.85)
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary flex-1"
                                onClick={() => setExposure(1.15)}
                            >
                                Chuẩn Studio (1.15)
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary flex-1"
                                onClick={() => setExposure(1.65)}
                            >
                                Tươi sáng (1.65)
                            </button>
                        </div>
                    </div>
                )}
            </div>

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

            {/* 4. WAVELET FILTER & PATH TRACER SETTINGS */}
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
