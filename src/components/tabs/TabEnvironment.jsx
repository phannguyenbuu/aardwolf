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

    const antiAliasingStrength = Math.max(0, Math.min(1000, sceneLights.rendering?.antiAliasingStrength ?? (sceneLights.rendering?.antiAliasing === 'off' ? 0 : 100)));

    const [activeLightTab, setActiveLightTab] = useState('keyLight');

    return (
        <div className="tab-pane-content tab-environment">
            {/* 1. ROOM ENVIRONMENT / STAGE MODE */}
            <div className="tab-section-card mb-3">
                <div className="section-card-header d-flex justify-content-between align-items-center">
                    <span className="card-title">1. Stage & Lighting Environment:</span>
                </div>
                <div className="pbr-slider-group mb-3">
                    <label htmlFor="environment-intensity" className="d-flex justify-content-between">
                        <span>Environment Intensity</span>
                        <strong>{(sceneLights.environment?.intensity ?? 1).toFixed(2)}</strong>
                    </label>
                    <input id="environment-intensity" className="form-range" type="range" min="0" max="5" step="0.05"
                        value={sceneLights.environment?.intensity ?? 1}
                        onChange={event => updateSceneLight('environment', 'intensity', Number(event.target.value))} />
                </div>
                <div className="pbr-slider-group mb-3">
                    <label htmlFor="environment-rotation" className="d-flex justify-content-between">
                        <span>HDR Rotation</span><strong>{sceneLights.environment?.rotation ?? 0}°</strong>
                    </label>
                    <input id="environment-rotation" className="form-range" type="range" min="0" max="360" step="1"
                        value={sceneLights.environment?.rotation ?? 0}
                        onChange={event => updateSceneLight('environment', 'rotation', Number(event.target.value))} />
                </div>
                {[['darkness', 'Shadow Darkness', 1, 0, 2, .01], ['blur', 'Shadow Blur', 12, 0, 30, .5]].map(([key, label, fallback, min, max, step]) => <div key={key} className="pbr-slider-group mb-3">
                    <label htmlFor={`shadow-${key}`} className="d-flex justify-content-between"><span>{label}</span><strong>{Number(sceneLights.shadow?.[key] ?? fallback).toFixed(2)}</strong></label>
                    <input id={`shadow-${key}`} className="form-range" type="range" min={min} max={max} step={step} value={sceneLights.shadow?.[key] ?? fallback} onChange={event => updateSceneLight('shadow', key, Number(event.target.value))} />
                </div>)}
                <div className="pbr-slider-group mb-3">
                    <label htmlFor="environment-antialiasing" className="d-flex justify-content-between">
                        <span>Anti-aliasing (SMAA)</span><strong>{antiAliasingStrength}%</strong>
                    </label>
                    <input id="environment-antialiasing" className="form-range" type="range" min="0" max="1000" step="1"
                        value={antiAliasingStrength}
                        onChange={event => updateSceneLight('rendering', 'antiAliasingStrength', Number(event.target.value))} />
                </div>
                <div className="env-theme-grid env-theme-row">
                    <button
                        type="button"
                        className={`env-card-btn ${studioTheme === 'studio' ? 'active' : ''}`}
                        onClick={() => setStudioTheme('studio')}
                    >
                        <span className="theme-name">Studio Showroom</span>
                    </button>
                    <button
                        type="button"
                        className={`env-card-btn ${studioTheme === 'workshop' ? 'active' : ''}`}
                        onClick={() => setStudioTheme('workshop')}
                    >
                        <span className="theme-name">Workshop</span>
                    </button>
                    <button
                        type="button"
                        className={`env-card-btn ${studioTheme === 'blueprint' ? 'active' : ''}`}
                        onClick={() => setStudioTheme('blueprint')}
                    >
                        <span className="theme-name">Blueprint CAD</span>
                    </button>
                </div>
            </div>

            {/* 2. ĐIỀU CHỈNH CHI TIẾT TỪNG NGUỒN SÁNG TRONG SCENE */}
            <div className="tab-section-card mb-3 custom-lights-card">
                <div className="section-card-header d-flex justify-content-between align-items-center mb-2">
                    <span className="card-title">2. Light Settings:</span>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary py-0 px-2"
                        style={{ fontSize: 12, borderRadius: 6 }}
                        onClick={resetLighting}
                    >
                        🔄 Reset Lighting
                    </button>
                </div>

                {/* Sub-tab switcher for light sources */}
                <div className="light-tabs-bar mb-3">
                    <button
                        type="button"
                        className={`light-tab-btn ${activeLightTab === 'keyLight' ? 'active' : ''}`}
                        onClick={() => setActiveLightTab('keyLight')}
                    >
                        💡 Key Light
                    </button>
                    <button
                        type="button"
                        className={`light-tab-btn ${activeLightTab === 'downlight' ? 'active' : ''}`}
                        onClick={() => setActiveLightTab('downlight')}
                    >
                        🔦 Downlight
                    </button>
                    <button
                        type="button"
                        className={`light-tab-btn ${activeLightTab === 'ambientLight' ? 'active' : ''}`}
                        onClick={() => setActiveLightTab('ambientLight')}
                    >
                        🌅 Ambient
                    </button>
                    <button
                        type="button"
                        className={`light-tab-btn ${activeLightTab === 'fillRim' ? 'active' : ''}`}
                        onClick={() => setActiveLightTab('fillRim')}
                    >
                        ✨ Fill & Rim
                    </button>
                    <button
                        type="button"
                        className={`light-tab-btn ${activeLightTab === 'exposure' ? 'active' : ''}`}
                        onClick={() => setActiveLightTab('exposure')}
                    >
                        ☀️ Exposure
                    </button>
                </div>

                {/* 2.1 TAB: KEY LIGHT */}
                {activeLightTab === 'keyLight' && sceneLights?.keyLight && (
                    <div className="light-subpanel key-light-grid">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="font-weight-bold" style={{ fontSize: 12.5 }}>Directional Key Light:</span>
                            <div className="custom-control custom-switch">
                                <input
                                    type="checkbox"
                                    className="custom-control-input"
                                    id="keyLightEnabledToggle"
                                    checked={sceneLights.keyLight.enabled}
                                    onChange={(e) => updateSceneLight('keyLight', 'enabled', e.target.checked)}
                                />
                                <label className="custom-control-label font-weight-bold" htmlFor="keyLightEnabledToggle" style={{ fontSize: 12 }}>
                                    {sceneLights.keyLight.enabled ? 'On' : 'Off'}
                                </label>
                            </div>
                        </div>

                        {/* Cast Shadow Switch - Triệt tiêu hoàn toàn hiện tượng chớp tắt bóng */}
                        <div className="d-flex justify-content-between align-items-center mb-2 p-2 rounded" style={{ background: '#f1f5f9', border: '1px solid #cbd5e1' }}>
                            <div>
                                <strong style={{ fontSize: 12, color: '#1e293b' }}>Cast Shadow:</strong>
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
                                    {sceneLights.keyLight.castShadow ? 'On' : 'Off'}
                                </label>
                            </div>
                        </div>

                        {/* Intensity */}
                        <div className="pbr-slider-group mb-2">
                            <div className="slider-label-row">
                                <span>Intensity:</span>
                                <strong>{Number(sceneLights.keyLight.intensity || 0).toFixed(2)}</strong>
                            </div>
                            <input
                                type="range"
                                className="form-range"
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
                                <span>Light Color:</span>
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
                                <span>Height (Y):</span>
                                <strong>{sceneLights.keyLight.posY} mm</strong>
                            </div>
                            <input
                                type="range"
                                className="form-range"
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
                                <span>Position (X):</span>
                                <strong>{sceneLights.keyLight.posX} mm</strong>
                            </div>
                            <input
                                type="range"
                                className="form-range"
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
                                <span>Depth (Z):</span>
                                <strong>{sceneLights.keyLight.posZ} mm</strong>
                            </div>
                            <input
                                type="range"
                                className="form-range"
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
                            <span className="font-weight-bold" style={{ fontSize: 12.5 }}>Downlight (Spotlight):</span>
                            <div className="custom-control custom-switch">
                                <input
                                    type="checkbox"
                                    className="custom-control-input"
                                    id="downlightEnabledToggle"
                                    checked={sceneLights.downlight.enabled}
                                    onChange={(e) => updateSceneLight('downlight', 'enabled', e.target.checked)}
                                />
                                <label className="custom-control-label font-weight-bold" htmlFor="downlightEnabledToggle" style={{ fontSize: 12 }}>
                                    {sceneLights.downlight.enabled ? 'On' : 'Off'}
                                </label>
                            </div>
                        </div>

                        {/* Cast Shadow Switch for Downlight */}
                        <div className="d-flex justify-content-between align-items-center mb-2 p-2 rounded" style={{ background: '#f1f5f9', border: '1px solid #cbd5e1' }}>
                            <div>
                                <strong style={{ fontSize: 12, color: '#1e293b' }}>Cast Shadow:</strong>
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
                                    {sceneLights.downlight.castShadow ? 'On' : 'Off'}
                                </label>
                            </div>
                        </div>

                        {/* Intensity */}
                        <div className="pbr-slider-group mb-2">
                            <div className="slider-label-row">
                                <span>Intensity:</span>
                                <strong>{Number(sceneLights.downlight.intensity || 0).toFixed(1)}</strong>
                            </div>
                            <input
                                type="range"
                                className="form-range"
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
                            <span style={{ fontSize: 12, fontWeight: 600 }}>Color Temperature:</span>
                            <div className="btn-group btn-group-sm">
                                <button
                                    type="button"
                                    className={`btn ${sceneLights.downlight.colorTemp === 'warm' ? 'btn-warning text-white' : 'btn-outline-secondary'}`}
                                    onClick={() => {
                                        updateSceneLight('downlight', 'colorTemp', 'warm');
                                        updateSceneLight('downlight', 'color', '#fff4d6');
                                    }}
                                >
                                    Warm (3000K)
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${sceneLights.downlight.colorTemp === 'neutral' ? 'btn-light active' : 'btn-outline-secondary'}`}
                                    onClick={() => {
                                        updateSceneLight('downlight', 'colorTemp', 'neutral');
                                        updateSceneLight('downlight', 'color', '#ffffff');
                                    }}
                                >
                                    Neutral (4500K)
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${sceneLights.downlight.colorTemp === 'cool' ? 'btn-info text-white' : 'btn-outline-secondary'}`}
                                    onClick={() => {
                                        updateSceneLight('downlight', 'colorTemp', 'cool');
                                        updateSceneLight('downlight', 'color', '#e8f4ff');
                                    }}
                                >
                                    Cool (6500K)
                                </button>
                            </div>
                        </div>

                        <div className="pbr-slider-group mb-2">
                            <div className="slider-label-row">
                                <span>Spot Angle:</span>
                                <strong>{(sceneLights.downlight.angle * (180 / Math.PI)).toFixed(0)}°</strong>
                            </div>
                            <input
                                type="range"
                                className="form-range"
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
                                <span>Penumbra:</span>
                                <strong>{sceneLights.downlight.penumbra.toFixed(2)}</strong>
                            </div>
                            <input
                                type="range"
                                className="form-range"
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
                            <span className="font-weight-bold" style={{ fontSize: 12.5 }}>Ambient Light:</span>
                        </div>

                        <div className="pbr-slider-group mb-2">
                            <div className="slider-label-row">
                                <span>Intensity:</span>
                                <strong>{Number(sceneLights.ambientLight.intensity || 0).toFixed(2)}</strong>
                            </div>
                            <input
                                type="range"
                                className="form-range"
                                min="0.0"
                                max="2.0"
                                step="0.05"
                                value={sceneLights.ambientLight.intensity}
                                onChange={(e) => updateSceneLight('ambientLight', 'intensity', parseFloat(e.target.value))}
                            />
                        </div>

                        <div className="pbr-slider-group mb-1">
                            <div className="slider-label-row">
                                <span>Ambient Color:</span>
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
                                <span className="font-weight-bold" style={{ fontSize: 12 }}>Fill Light:</span>
                                <div className="custom-control custom-switch">
                                    <input
                                        type="checkbox"
                                        className="custom-control-input"
                                        id="fillLightToggle"
                                        checked={sceneLights.fillLight.enabled}
                                        onChange={(e) => updateSceneLight('fillLight', 'enabled', e.target.checked)}
                                    />
                                    <label className="custom-control-label" htmlFor="fillLightToggle">
                                        {sceneLights.fillLight.enabled ? 'On' : 'Off'}
                                    </label>
                                </div>
                            </div>
                            <div className="pbr-slider-group mb-1">
                                <div className="slider-label-row">
                                    <span>Intensity:</span>
                                    <strong>{Number(sceneLights.fillLight.intensity || 0).toFixed(2)}</strong>
                                </div>
                                <input
                                    type="range"
                                    className="form-range"
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
                                <span className="font-weight-bold" style={{ fontSize: 12 }}>Rim Light:</span>
                                <div className="custom-control custom-switch">
                                    <input
                                        type="checkbox"
                                        className="custom-control-input"
                                        id="rimLightToggle"
                                        checked={sceneLights.rimLight.enabled}
                                        onChange={(e) => updateSceneLight('rimLight', 'enabled', e.target.checked)}
                                    />
                                    <label className="custom-control-label" htmlFor="rimLightToggle">
                                        {sceneLights.rimLight.enabled ? 'On' : 'Off'}
                                    </label>
                                </div>
                            </div>
                            <div className="pbr-slider-group mb-1">
                                <div className="slider-label-row">
                                    <span>Intensity:</span>
                                    <strong>{Number(sceneLights.rimLight.intensity || 0).toFixed(2)}</strong>
                                </div>
                                <input
                                    type="range"
                                    className="form-range"
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
                            <span className="font-weight-bold" style={{ fontSize: 12.5 }}>Tone Mapping Exposure:</span>
                        </div>

                        <div className="pbr-slider-group mb-3">
                            <div className="slider-label-row">
                                <span>Exposure:</span>
                                <strong>{Number(sceneLights.exposure || 1.15).toFixed(2)}</strong>
                            </div>
                            <input
                                type="range"
                                className="form-range"
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
                                Soft (0.85)
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary flex-1"
                                onClick={() => setExposure(1.15)}
                            >
                                Studio (1.15)
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary flex-1"
                                onClick={() => setExposure(1.65)}
                            >
                                Bright (1.65)
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 3. WALL COLORS & RADIOSITY BOUNCE */}
            {studioTheme === 'cornell' && (
                <div className="tab-section-card mb-3">
                    <div className="section-card-header">
                        <span className="card-title">3. Wall Colors & Color Bleed:</span>
                    </div>

                    <div className="row mb-2">
                        <div className="col-6">
                            <label style={{ fontSize: 12, fontWeight: 600 }}>Left Wall:</label>
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
                            <label style={{ fontSize: 12, fontWeight: 600 }}>Right Wall:</label>
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
                            <span>Color Bleed:</span>
                            <strong>{cornellBleedIntensity.toFixed(1)}x</strong>
                        </div>
                        <input
                            type="range"
                            className="form-range"
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
            <div className="tab-section-card mb-3">
                <div className="section-card-header">4. Progressive Path Tracing Quality</div>
                <label className="d-flex align-items-center gap-2 mb-2"><input type="checkbox" checked={waveletParams.renderDenoise !== false} onChange={e => updateWaveletParam('renderDenoise', e.target.checked)} />Edge-preserving Denoise</label>
                <div className="wavelet-params-box">
                    {[['renderSamples', 'Preview Samples', 128, [16,32,64,128,256]], ['renderBounces', 'Light Bounces', 8, [3,5,8,12]], ['exportSamples', '4K Export Samples', 512, [64,128,256,512,1024]]].map(([key,label,fallback,values]) => <label key={key}>{label}
                        <select className="form-select form-select-sm" value={waveletParams[key] || fallback} onChange={e => updateWaveletParam(key, Number(e.target.value))}>
                            {values.map(value => <option key={value} value={value}>{value}</option>)}
                        </select>
                    </label>)}
                </div>
            </div>
        </div>
    );
}
