import React, { useState } from 'react';
import { useConfigurator } from '../../context/ConfiguratorContext.jsx';
import { PBR_MATERIALS, PBR_MATERIAL_CATEGORIES, PBR_PRESETS, PART_LABELS, PART_ICONS } from '../../constants/pbrMaterials.js';

export default function TabMaterialLib() {
    const {
        selectedPart,
        setSelectedPart,
        componentMaterials,
        updateComponentMaterial,
        applyMaterialPreset
    } = useConfigurator();

    const [activeCategory, setActiveCategory] = useState('ALL');

    const filteredMaterials = activeCategory === 'ALL'
        ? PBR_MATERIALS
        : PBR_MATERIALS.filter(m => m.category === activeCategory);

    return (
        <div className="tab-pane-content tab-material-lib">
            {/* 1. PRESETS 1-CLICK */}
            <div className="tab-section-card mb-3">
                <div className="section-card-header">
                    <span className="card-title">1. Phối màu PBR 1-Click (Showroom Presets):</span>
                </div>
                <div className="presets-list-vertical">
                    {PBR_PRESETS.map((preset, idx) => (
                        <button
                            key={idx}
                            type="button"
                            className="preset-banner-btn mb-2"
                            onClick={() => applyMaterialPreset(preset.mats)}
                        >
                            <span className="preset-name font-weight-bold">{preset.name}</span>
                            <div className="preset-materials-mini-row">
                                <span className="mini-tag">🏗️ {preset.mats.crane}</span>
                                <span className="mini-tag">⚡ {preset.mats.pump}</span>
                                <span className="mini-tag">🌀 {preset.mats.tube}</span>
                                <span className="mini-tag">📦 {preset.mats.workpiece}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. MATERIAL LIBRARY CATALOG */}
            <div className="tab-section-card mb-3">
                <div className="section-card-header d-flex justify-content-between align-items-center mb-2">
                    <span className="card-title">
                        2. Thư viện 25+ Vật liệu PBR Chuẩn:
                    </span>
                    <small className="text-muted">Áp dụng cho: <strong>{PART_ICONS[selectedPart]} {PART_LABELS[selectedPart]}</strong></small>
                </div>

                {/* CATEGORY FILTER PILLS */}
                <div className="category-filter-bar mb-3">
                    <button
                        type="button"
                        className={`cat-pill ${activeCategory === 'ALL' ? 'active' : ''}`}
                        onClick={() => setActiveCategory('ALL')}
                    >
                        Tất cả ({PBR_MATERIALS.length})
                    </button>
                    {Object.values(PBR_MATERIAL_CATEGORIES).map(cat => (
                        <button
                            key={cat}
                            type="button"
                            className={`cat-pill ${activeCategory === cat ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat.split(' ')[0]}
                        </button>
                    ))}
                </div>

                {/* MATERIALS GRID */}
                <div className="materials-catalog-grid">
                    {filteredMaterials.map(mat => {
                        const isCurrent = componentMaterials[selectedPart] === mat.id;
                        return (
                            <div
                                key={mat.id}
                                className={`mat-catalog-card ${isCurrent ? 'active' : ''}`}
                                onClick={() => updateComponentMaterial(selectedPart, mat.id)}
                            >
                                <div
                                    className="mat-card-swatch"
                                    style={{ backgroundColor: mat.previewColor || '#999' }}
                                >
                                    {isCurrent && <span className="mat-check-badge">✓</span>}
                                </div>
                                <div className="mat-card-info">
                                    <span className="mat-card-name">{mat.name.split('(')[0]}</span>
                                    <div className="d-flex justify-content-between align-items-center mt-1">
                                        <span className="badge badge-light" style={{ fontSize: 9 }}>{mat.badge || 'PBR'}</span>
                                        <small className="text-muted" style={{ fontSize: 9.5 }}>
                                            R: {mat.params.roughness ?? 0} | M: {mat.params.metalness ?? 0}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
