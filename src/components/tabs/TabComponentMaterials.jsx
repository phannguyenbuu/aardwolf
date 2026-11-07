import React, { useState } from 'react';
import { defaultSurfacePreset } from '../../constants/standardMaterials.js';
import DiffuseImageInput from '../DiffuseImageInput.jsx';
import MaterialColorPicker from '../MaterialColorPicker.jsx';
import { materialPreviewColor } from '../../utils/sceneSettings.js';
import { useConfigurator } from '../../context/ConfiguratorContext.jsx';
import { PBR_MATERIALS, PBR_MATERIAL_CATEGORIES, PART_LABELS, PART_ICONS } from '../../constants/pbrMaterials.js';

export default function TabComponentMaterials() {
    const [copiedPath, setCopiedPath] = useState('');
    const {
        selectedPart,
        setSelectedPart,
        selectedElement, setSelectedElement, materialElements,
        materialClipboard, setMaterialClipboard,
        assignMaterial, clearMaterial, updateMaterialParam, materialDefinitions, customizeMaterial,
        componentMaterials,
        customParams,
        basePositions,
        partOffsets,
        updatePartOffset,
        resetPartOffset,
        resetAllPartOffsets,
        gizmoMode, setGizmoMode, updatePartRotation,
        gizmoEnabled,
        setGizmoEnabled,
        actualLoad
    } = useConfigurator();

    const parts = [
        { key: 'ground', label: PART_LABELS.ground, icon: PART_ICONS.ground },
        { key: 'crane', label: PART_LABELS.crane, icon: PART_ICONS.crane },
        { key: 'pump', label: PART_LABELS.pump, icon: PART_ICONS.pump },
        { key: 'tube', label: PART_LABELS.tube, icon: PART_ICONS.tube },
        { key: 'head', label: PART_LABELS.head, icon: PART_ICONS.head },
        { key: 'suction', label: PART_LABELS.suction, icon: PART_ICONS.suction },
        { key: 'workpiece', label: PART_LABELS.workpiece, icon: PART_ICONS.workpiece }
    ];

    const currentBasePos = basePositions[selectedPart] || { x: 0, y: 0, z: 0 };
    const currentOffset = partOffsets[selectedPart] || { x: 0, y: 0, z: 0 };
    const currentWorldPos = {
        x: Math.round(currentBasePos.x + currentOffset.x),
        y: Math.round(currentBasePos.y + currentOffset.y),
        z: Math.round(currentBasePos.z + currentOffset.z)
    };

    const elements = materialElements.filter(element => element.partKey === selectedPart);
    const element = elements.find(item => item.key === selectedElement);
    const sourcePath = elements[0]?.sourcePath || (selectedPart === 'ground' ? 'Generated: THREE.PlaneGeometry (no source file)' : selectedPart === 'workpiece' ? 'Generated: THREE.BoxGeometry (no source file)' : 'Loading model…');
    const sourceFilename = elements[0]?.sourcePath ? sourcePath.split(/[\\/]/).pop() : sourcePath;
    const materialTarget = element?.key || selectedPart;
    const targets = element ? [element.key] : [selectedPart, ...elements.map(item => item.key)];
    const updateComponentMaterial = (_target, id) => assignMaterial(targets, id);
    const updateCustomParam = (_target, param, value) => {
        const ids = new Set(element ? [currentMatId] : elements.map(item => item.material));
        if (!ids.size) ids.add(currentMatId);
        ids.forEach(id => {
            const subset = element ? [element.key] : elements.filter(item => item.material === id).map(item => item.key);
            if (!subset.length) subset.push(selectedPart);
            if (id.startsWith('custom:')) updateMaterialParam(id, param, value);
            else customizeMaterial(subset, id, param, value);
        });
    };
    const materialOptions = [
        ...PBR_MATERIALS.map(item => ({ ...item, params: materialDefinitions[item.id] || item.params })),
        ...Object.keys(materialDefinitions).filter(id => id === (element?.material || elements[0]?.material || componentMaterials[selectedPart]) && !PBR_MATERIALS.some(item => item.id === id)).map(id => ({ id, name: 'Custom / Mixed Material', params: materialDefinitions[id], category: 'Saved Materials', badge: 'Custom' }))
    ];
    const displayedElement = element || elements[0];
    const currentMatId = displayedElement?.material || componentMaterials[selectedPart] || 'steel_brushed';
    const currentMatDef = materialOptions.find(m => m.id === currentMatId) || PBR_MATERIALS[0];
    const currentParams = materialDefinitions[currentMatId] || {
        roughness: 0.35,
        metalness: 0.5,
        clearcoat: 0.2,
        color: '#c0c8d2'
    };

    const directPreset = currentMatId === 'white_electrical_cabinet' ? 'white_plastic' : currentMatId;
    const surfaceVotes = new Map();
    const surfaces = currentParams.originalSurfaces || [currentParams];
    const surfaceGroups = displayedElement?.surfaceGroups?.length ? displayedElement.surfaceGroups : surfaces.map((_, slot) => ({ slot, count: 1 }));
    for (const { slot, count } of surfaceGroups) {
        const surface = surfaces[slot] || surfaces[0];
        const preset = surface.presetId || defaultSurfacePreset(sourceFilename, surface);
        surfaceVotes.set(preset, (surfaceVotes.get(preset) || 0) + count);
    }
    const activePresetId = PBR_MATERIALS.some(m => m.id === directPreset) ? directPreset : [...surfaceVotes].sort((a, b) => b[1] - a[1])[0]?.[0];

    const handleSelectMaterial = matId => assignMaterial(targets, matId);

    return (
        <div className="tab-pane-content tab-component-materials">
            {/* 1. SELECT PART TO CUSTOMIZE */}
            <div className="tab-section-card mb-3 part-selector-row">
                <label className="part-selector-label" htmlFor="component-part-select">1. Select Part:</label>
                <select
                    id="component-part-select"
                    className="form-select form-select-sm part-selector-dropdown"
                    value={selectedPart}
                    onChange={(e) => { setSelectedPart(e.target.value); setSelectedElement(''); }}
                >
                    {parts.map(p => (
                        <option key={p.key} value={p.key}>{p.icon} {p.label}</option>
                    ))}
                </select>
                <div className="selected-source-path">
                    <code title={sourceFilename}>{sourceFilename}</code>
                    <button type="button" className="btn btn-outline-secondary btn-sm material-icon-button" title={copiedPath === sourceFilename ? 'Copied' : 'Copy filename'} aria-label="Copy filename" onClick={async () => {
                        try { await navigator.clipboard.writeText(sourceFilename); setCopiedPath(sourceFilename); }
                        catch { setCopiedPath(''); }
                    }}><i className={`fas ${copiedPath === sourceFilename ? 'fa-check' : 'fa-copy'}`} aria-hidden="true" /></button>
                </div>
            </div>

            {/* 2. 3D POSITION & PRECISION TRANSFORM GIZMO PANEL (3ds Max Style) */}
            <div className="tab-section-card mb-3 transform-gizmo-section">
                <div className="section-card-header d-flex justify-content-between align-items-center">
                    <span className="card-title">
                        2. Position & 3D Coordinates: <strong>{PART_ICONS[selectedPart]} {PART_LABELS[selectedPart]}</strong>
                    </span>
                    <button
                        type="button"
                        className={`btn-gizmo-toggle ${gizmoEnabled ? 'active' : ''}`}
                        title="Toggle transform gizmo"
                        aria-label="Toggle transform gizmo"
                        aria-pressed={gizmoEnabled}
                        onClick={() => setGizmoEnabled(!gizmoEnabled)}
                    >
                        <span className="gizmo-dot" />
                        <i className="fas fa-arrows-alt" aria-hidden="true" />
                    </button>
                </div>

                <div role="tablist" aria-label="Transform mode" className="d-flex gap-2 mb-3">
                    <button type="button" role="tab" aria-selected={gizmoMode !== 'rotate'} className={`btn btn-sm ${gizmoMode !== 'rotate' ? 'btn-danger' : 'btn-outline-secondary'}`} onClick={() => setGizmoMode('translate')}><i className="fas fa-arrows-alt" aria-hidden="true" /> Move</button>
                    <button type="button" role="tab" aria-selected={gizmoMode === 'rotate'} className={`btn btn-sm ${gizmoMode === 'rotate' ? 'btn-danger' : 'btn-outline-secondary'}`} onClick={() => setGizmoMode('rotate')}><i className="fas fa-sync-alt" aria-hidden="true" /> Rotate</button>
                </div>
                {gizmoMode === 'rotate' ? <div role="tabpanel" aria-label="Rotate object">
                    <div className="coordinate-inputs-container mb-3">{['x', 'y', 'z'].map(axis => <label key={axis} className={`coord-row coord-row-${axis}`}><span className={`axis-badge badge-${axis}`}>{axis.toUpperCase()}</span><input type="number" step="90" className="form-control form-control-sm" aria-label={`${axis.toUpperCase()} rotation`} value={partOffsets[selectedPart]?.rotation?.[axis] || 0} onChange={event => updatePartRotation(selectedPart, { ...partOffsets[selectedPart]?.rotation, [axis]: Number(event.target.value) || 0 })} /><span>°</span></label>)}</div>
                    <button type="button" className="btn btn-outline-secondary btn-sm" title="Reset Rotation" aria-label="Reset Rotation" onClick={() => updatePartRotation(selectedPart, { x: 0, y: 0, z: 0 })}><i className="fas fa-undo" aria-hidden="true" /></button>
                </div> : <>
                {/* XYZ Precision Coordinate Rows */}
                <div className="coordinate-inputs-container mb-3">
                    {/* X Axis */}
                    <div className="coord-row coord-row-x">
                        <div className="coord-label-cell">
                            <span className="axis-badge badge-x">X</span>
                        </div>
                        <div className="coord-input-cell">
                            <input
                                type="number"
                                aria-label="X position"
                                step="1"
                                className="form-control form-control-sm coord-num-input"
                                value={currentWorldPos.x}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    updatePartOffset(selectedPart, 'x', val - (currentBasePos.x || 0));
                                }}
                            />
                            <span className="unit-label">mm</span>
                        </div>
                    </div>

                    {/* Y Axis (Height UP) */}
                    <div className="coord-row coord-row-y">
                        <div className="coord-label-cell">
                            <span className="axis-badge badge-y">Y</span>
                        </div>
                        <div className="coord-input-cell">
                            <input
                                type="number"
                                aria-label="Y position"
                                step="1"
                                className="form-control form-control-sm coord-num-input"
                                value={currentWorldPos.y}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    updatePartOffset(selectedPart, 'y', val - (currentBasePos.y || 0));
                                }}
                            />
                            <span className="unit-label">mm</span>
                        </div>
                    </div>

                    {/* Z Axis (Depth) */}
                    <div className="coord-row coord-row-z">
                        <div className="coord-label-cell">
                            <span className="axis-badge badge-z">Z</span>
                        </div>
                        <div className="coord-input-cell">
                            <input
                                type="number"
                                aria-label="Z position"
                                step="1"
                                className="form-control form-control-sm coord-num-input"
                                value={currentWorldPos.z}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    updatePartOffset(selectedPart, 'z', val - (currentBasePos.z || 0));
                                }}
                            />
                            <span className="unit-label">mm</span>
                        </div>
                    </div>
                </div>

                {/* 1-Click Smart Alignment Actions */}
                <div className="coord-actions-grid">
                    <button
                        type="button"
                        className="btn-smart-action"
                        onClick={() => resetPartOffset(selectedPart)}
                        title="Reset Position" aria-label="Reset Position"
                    >
                        <i className="fas fa-crosshairs" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        className="btn-smart-action"
                        onClick={() => {
                            if (selectedPart === 'workpiece') {
                                const h = actualLoad?.height || 250;
                                updatePartOffset('workpiece', 'y', Math.round(h / 2) - currentBasePos.y);
                            } else {
                                updatePartOffset(selectedPart, 'y', -currentBasePos.y);
                            }
                        }}
                    >
                        <i className="fas fa-arrow-down" aria-hidden="true" title="Ground" /><span className="visually-hidden">Ground</span>
                    </button>
                    <button
                        type="button"
                        className="btn-smart-action"
                        onClick={() => {
                            updatePartOffset(selectedPart, 'z', -currentBasePos.z);
                        }}
                    >
                        <i className="fas fa-align-center" aria-hidden="true" title="Center on Crane (Z = 0)" /><span className="visually-hidden">Center on Crane (Z = 0)</span>
                    </button>
                    <button
                        type="button"
                        className="btn-smart-action btn-smart-danger"
                        onClick={resetAllPartOffsets}
                        title="Reset All Parts" aria-label="Reset All Parts"
                    >
                        <i className="fas fa-sync-alt" aria-hidden="true" />
                    </button>
                </div>
                </>}
            </div>

            {/* 3. CHOOSE PBR MATERIAL FOR SELECTED PART */}
            <div className="tab-section-card mb-3">
                {/* MATERIAL PREVIEW SWATCHES */}
                <div className="mb-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6 }}>
                    {PBR_MATERIALS.map(m => (
                        <button
                            key={m.id}
                            type="button"
                            className={`btn btn-sm ${activePresetId === m.id ? 'btn-primary' : 'btn-outline-secondary'}`}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, textAlign: 'left', whiteSpace: 'nowrap', fontSize: 11, padding: '6px 8px', minWidth: 0, overflow: 'hidden' }}
                            title={m.name}
                            aria-label={m.name}
                            aria-pressed={activePresetId === m.id}
                            onClick={() => handleSelectMaterial(m.id)}
                        >
                            <span aria-hidden="true" style={{ flexShrink: 0, width: 16, height: 20, border: '1px solid #ccc', borderRadius: 3, background: materialPreviewColor(materialDefinitions[m.id]?.color ?? m.previewColor) || '#999' }} />
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</span>
                        </button>
                    ))}
                </div>
                <div className="material-editor-columns"><div className="material-editor-settings">
                <label className="field-lbl" htmlFor="material-element-select">Material element:</label>
                <select id="material-element-select" className="form-select form-select-sm mb-2" value={element?.key || ''} onChange={e => setSelectedElement(e.target.value)}>
                    <option value="">Whole object — all elements</option>
                    {elements.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
                </select>
                {!element && elements.length > 1 && <small className="d-block text-muted mb-2">Values shown from the first element. Edits and Paste apply to all elements.</small>}
                <div className="d-flex gap-2 mb-2">
                    <button type="button" className="btn btn-outline-secondary btn-sm material-icon-button" title="Copy Material" aria-label="Copy Material" onClick={() => setMaterialClipboard(currentMatId)}><i className="fas fa-copy" aria-hidden="true" /></button>
                    <button type="button" className="btn btn-danger btn-sm material-icon-button" title="Paste Material" aria-label="Paste Material" disabled={!materialClipboard} onClick={() => {
                        assignMaterial(targets, materialClipboard);
                    }}><i className="fas fa-paste" aria-hidden="true" /></button>
                    {element && <button type="button" className="btn btn-outline-secondary btn-sm material-icon-button" title="Use object material" aria-label="Use object material" onClick={() => {
                        clearMaterial(materialTarget);
                    }}><i className="fas fa-undo" aria-hidden="true" /></button>}
                </div>
                {materialClipboard && <small className="d-block text-muted mb-2">Copied: {materialClipboard}</small>}
                <small className="d-block text-muted mb-2" style={{ overflowWrap: 'anywhere' }}>Material ID: {currentMatId}</small>
                <div className="section-card-header d-flex justify-content-between align-items-center">
                    <span className="card-title">
                        3. Material for: <strong>{PART_ICONS[selectedPart]} {PART_LABELS[selectedPart]}</strong>
                    </span>
                    <span className="badge badge-primary">{currentMatDef.badge || 'PBR'}</span>
                </div>

                <div className="mat-dropdown-container mb-3">
                    <label className="field-lbl">Select Material Preset ({PBR_MATERIALS.length}):</label>
                    <select
                        className="form-control form-control-sm"
                        value={currentMatId}
                        onChange={(e) => handleSelectMaterial(e.target.value)}
                    >
                        {[...Object.values(PBR_MATERIAL_CATEGORIES).filter(cat => PBR_MATERIALS.some(m => m.category === cat)), 'Saved Materials'].map(cat => (
                            <optgroup key={cat} label={cat}>
                                {materialOptions.filter(m => m.category === cat).map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.name}
                                    </option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                </div>

                </div><MaterialColorPicker value={currentParams.color ?? currentMatDef.params.color} onChange={value => updateCustomParam(materialTarget, 'color', value)} /></div>
            </div>

            {/* 4. PHYSICAL PBR PARAMETER SLIDERS */}
            <div className="tab-section-card mb-3">
                <div className="section-card-header">
                    <span className="card-title">4. Physical PBR Parameters:</span>
                </div>

                <div className="pbr-slider-group mb-2">
                    <div className="slider-label-row">
                        <span>Roughness:</span>
                        <strong>{Number(currentParams.roughness || 0).toFixed(2)}</strong>
                    </div>
                    <input
                        type="range"
                        className="custom-range"
                        min="0.0"
                        max="1.0"
                        step="0.02"
                        value={currentParams.roughness || 0}
                        onChange={(e) => updateCustomParam(materialTarget, 'roughness', parseFloat(e.target.value))}
                    />
                </div>

                <div className="pbr-slider-group mb-2">
                    <div className="slider-label-row">
                        <span>Metalness:</span>
                        <strong>{Number(currentParams.metalness || 0).toFixed(2)}</strong>
                    </div>
                    <input
                        type="range"
                        className="custom-range"
                        min="0.0"
                        max="1.0"
                        step="0.02"
                        value={currentParams.metalness || 0}
                        onChange={(e) => updateCustomParam(materialTarget, 'metalness', parseFloat(e.target.value))}
                    />
                </div>

                <div className="pbr-slider-group mb-2">
                    <div className="slider-label-row">
                        <span>Clearcoat:</span>
                        <strong>{Number(currentParams.clearcoat || 0).toFixed(2)}</strong>
                    </div>
                    <input
                        type="range"
                        className="custom-range"
                        min="0.0"
                        max="1.0"
                        step="0.05"
                        value={currentParams.clearcoat || 0}
                        onChange={(e) => updateCustomParam(materialTarget, 'clearcoat', parseFloat(e.target.value))}
                    />
                </div>

                <div className="pbr-slider-group mb-2">
                    <div className="slider-label-row">
                        <span>Diffuse Image:</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <DiffuseImageInput value={currentParams.diffuseImage || ''} onChange={value => updateCustomParam(materialTarget, 'diffuseImage', value)} uvw={currentParams.uvw} onUVWChange={value => updateCustomParam(materialTarget, 'uvw', value)} />
                    </div>
                </div>
            </div>
        </div>
    );
}
