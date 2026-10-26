import React from 'react';
import { useConfigurator } from '../../context/ConfiguratorContext.jsx';
import { PBR_MATERIALS, PBR_MATERIAL_CATEGORIES, PART_LABELS, PART_ICONS } from '../../constants/pbrMaterials.js';

export default function TabComponentMaterials() {
    const {
        selectedPart,
        setSelectedPart,
        componentMaterials,
        updateComponentMaterial,
        customParams,
        updateCustomParam
    } = useConfigurator();

    const parts = [
        { key: 'crane', label: PART_LABELS.crane, icon: PART_ICONS.crane },
        { key: 'pump', label: PART_LABELS.pump, icon: PART_ICONS.pump },
        { key: 'tube', label: PART_LABELS.tube, icon: PART_ICONS.tube },
        { key: 'head', label: PART_LABELS.head, icon: PART_ICONS.head },
        { key: 'suction', label: PART_LABELS.suction, icon: PART_ICONS.suction },
        { key: 'workpiece', label: PART_LABELS.workpiece, icon: PART_ICONS.workpiece }
    ];

    const currentMatId = componentMaterials[selectedPart] || 'steel_brushed';
    const currentMatDef = PBR_MATERIALS.find(m => m.id === currentMatId) || PBR_MATERIALS[0];
    const currentParams = customParams[selectedPart] || {
        roughness: 0.35,
        metalness: 0.5,
        clearcoat: 0.2,
        color: '#c0c8d2'
    };

    const handleSelectMaterial = (matId) => {
        updateComponentMaterial(selectedPart, matId);
        const matDef = PBR_MATERIALS.find(m => m.id === matId);
        if (matDef) {
            updateCustomParam(selectedPart, 'roughness', matDef.params.roughness ?? 0.3);
            updateCustomParam(selectedPart, 'metalness', matDef.params.metalness ?? 0.5);
            updateCustomParam(selectedPart, 'clearcoat', matDef.params.clearcoat ?? 0.1);
            if (matDef.params.color) {
                const hexStr = typeof matDef.params.color === 'number'
                    ? '#' + matDef.params.color.toString(16).padStart(6, '0')
                    : matDef.params.color;
                updateCustomParam(selectedPart, 'color', hexStr);
            }
        }
    };

    return (
        <div className="tab-pane-content tab-component-materials">
            {/* 1. SELECT PART TO CUSTOMIZE */}
            <div className="tab-section-card mb-3">
                <div className="section-card-header">
                    <span className="card-title">1. Chọn bộ phận cấu kiện cần đổi vật liệu:</span>
                </div>
                <div className="part-selection-grid">
                    {parts.map(p => (
                        <button
                            key={p.key}
                            type="button"
                            className={`part-pill-btn ${selectedPart === p.key ? 'active' : ''}`}
                            onClick={() => setSelectedPart(p.key)}
                        >
                            <span className="part-icon">{p.icon}</span>
                            <span className="part-name">{p.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. CHOOSE PBR MATERIAL FOR SELECTED PART */}
            <div className="tab-section-card mb-3">
                <div className="section-card-header d-flex justify-content-between align-items-center">
                    <span className="card-title">
                        2. Vật liệu cho: <strong>{PART_ICONS[selectedPart]} {PART_LABELS[selectedPart]}</strong>
                    </span>
                    <span className="badge badge-primary">{currentMatDef.badge || 'PBR'}</span>
                </div>

                <div className="mat-dropdown-container mb-3">
                    <label className="field-lbl">Chọn vật liệu PBR tiêu chuẩn:</label>
                    <select
                        className="form-control form-control-sm"
                        value={currentMatId}
                        onChange={(e) => handleSelectMaterial(e.target.value)}
                    >
                        {Object.values(PBR_MATERIAL_CATEGORIES).map(cat => (
                            <optgroup key={cat} label={cat}>
                                {PBR_MATERIALS.filter(m => m.category === cat).map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.name}
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                </div>

                {/* MATERIAL PREVIEW SWATCHES */}
                <div className="material-swatches-grid mb-3">
                    {PBR_MATERIALS.slice(0, 12).map(m => (
                        <button
                            key={m.id}
                            type="button"
                            className={`swatch-btn ${currentMatId === m.id ? 'active' : ''}`}
                            style={{ backgroundColor: m.previewColor || '#999' }}
                            onClick={() => handleSelectMaterial(m.id)}
                            title={m.name}
                        >
                            {currentMatId === m.id && <span className="swatch-check">✓</span>}
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. PHYSICAL PBR PARAMETER SLIDERS */}
            <div className="tab-section-card mb-3">
                <div className="section-card-header">
                    <span className="card-title">3. Tinh chỉnh thông số vật lý (Physical PBR):</span>
                </div>

                <div className="pbr-slider-group mb-2">
                    <div className="slider-label-row">
                        <span>Độ nhám bề mặt (Roughness):</span>
                        <strong>{Number(currentParams.roughness || 0).toFixed(2)}</strong>
                    </div>
                    <input
                        type="range"
                        className="custom-range"
                        min="0.0"
                        max="1.0"
                        step="0.02"
                        value={currentParams.roughness || 0}
                        onChange={(e) => updateCustomParam(selectedPart, 'roughness', parseFloat(e.target.value))}
                    />
                </div>

                <div className="pbr-slider-group mb-2">
                    <div className="slider-label-row">
                        <span>Độ phản xạ kim loại (Metalness):</span>
                        <strong>{Number(currentParams.metalness || 0).toFixed(2)}</strong>
                    </div>
                    <input
                        type="range"
                        className="custom-range"
                        min="0.0"
                        max="1.0"
                        step="0.02"
                        value={currentParams.metalness || 0}
                        onChange={(e) => updateCustomParam(selectedPart, 'metalness', parseFloat(e.target.value))}
                    />
                </div>

                <div className="pbr-slider-group mb-2">
                    <div className="slider-label-row">
                        <span>Lớp sơn bóng trong suốt (Clearcoat):</span>
                        <strong>{Number(currentParams.clearcoat || 0).toFixed(2)}</strong>
                    </div>
                    <input
                        type="range"
                        className="custom-range"
                        min="0.0"
                        max="1.0"
                        step="0.05"
                        value={currentParams.clearcoat || 0}
                        onChange={(e) => updateCustomParam(selectedPart, 'clearcoat', parseFloat(e.target.value))}
                    />
                </div>

                <div className="pbr-slider-group mb-2">
                    <div className="slider-label-row">
                        <span>Màu sắc vật liệu (Base Color):</span>
                        <strong>{currentParams.color || '#cccccc'}</strong>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <input
                            type="color"
                            className="color-input-picker"
                            value={currentParams.color || '#cccccc'}
                            onChange={(e) => updateCustomParam(selectedPart, 'color', e.target.value)}
                        />
                        <span className="color-hex-tag">{currentParams.color || '#cccccc'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
