import React, { useState, useRef, useLayoutEffect } from 'react';
import { getSettings, putSettings } from '../../utils/settingsApi.js';
import DiffuseImageInput from '../DiffuseImageInput.jsx';
import { useConfigurator } from '../../context/ConfiguratorContext.jsx';
import { PBR_MATERIALS, PBR_MATERIAL_CATEGORIES, PART_LABELS, PART_ICONS } from '../../constants/pbrMaterials.js';
import { materialPreviewColor } from '../../utils/sceneSettings.js';

export default function TabMaterialLib() {
    const {
        selectedPart,
        setSelectedPart,
        componentMaterials,
        materialDefinitions,
        updateComponentMaterial,
        updateMaterialParam,
        applyMaterialPreset
    } = useConfigurator();

    const [activeCategory, setActiveCategory] = useState('ALL');
    const [expandedMaterial, setExpandedMaterial] = useState(PBR_MATERIALS[0].id);
    const [saveStatus, setSaveStatus] = useState('');
    const pendingEdits = useRef({});
    const saveTimer = useRef(null);
    const saveQueue = useRef(Promise.resolve());
    const flushEdits = () => {
        const edits = pendingEdits.current;
        pendingEdits.current = {};
        if (!Object.keys(edits).length) return;
        saveQueue.current = saveQueue.current.then(async () => {
            setSaveStatus('Saving...');
            try {
                const document = await getSettings();
                const materials = { ...document.materials };
                for (const [id, patch] of Object.entries(edits)) materials[id] = { ...materials[id], ...patch };
                await putSettings({ ...document, materials });
                setSaveStatus('Saved');
            } catch (error) {
                for (const [id, patch] of Object.entries(edits)) pendingEdits.current[id] = { ...patch, ...pendingEdits.current[id] };
                setSaveStatus(`Save failed: ${error.message}`);
            }
        });
    };
    const editMaterial = (id, key, value) => {
        updateMaterialParam(id, key, value);
        pendingEdits.current[id] = { ...pendingEdits.current[id], [key]: value };
        setSaveStatus('Pending...');
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(flushEdits, 500);
    };
    useLayoutEffect(() => () => { clearTimeout(saveTimer.current); flushEdits(); }, []);

    const panelRef = useRef(null);
    useLayoutEffect(() => {
        const resize = () => {
            const panel = panelRef.current;
            if (panel) panel.style.height = `${Math.max(280, window.innerHeight - panel.getBoundingClientRect().top - 16)}px`;
        };
        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []);


    const catalog = PBR_MATERIALS.map(item => ({ ...item, params: materialDefinitions[item.id] || item.params, previewColor: materialPreviewColor(materialDefinitions[item.id]?.color ?? item.previewColor) }));
    const filteredMaterials = activeCategory === 'ALL'
        ? catalog
        : catalog.filter(m => m.category === activeCategory);

    return (
        <div ref={panelRef} className="tab-pane-content tab-material-lib">
            {/* 2. MATERIAL LIBRARY CATALOG */}
            <div className="tab-section-card mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <small role="status" className="text-muted">{saveStatus}</small>
                    <button type="button" className="btn btn-sm btn-outline-secondary" title="Reapply all materials" aria-label="Reapply all materials" onClick={() => window.dispatchEvent(new Event('aardwolf-reapply-materials'))}><i className="fas fa-sync-alt" aria-hidden="true" /></button>
                </div>
                <div className="material-library-tags mb-3">
                    {catalog.map(mat => <button key={mat.id} type="button" className={`cat-pill ${expandedMaterial === mat.id ? 'active' : ''}`} aria-pressed={expandedMaterial === mat.id} onClick={() => setExpandedMaterial(mat.id)}>{mat.name}</button>)}
                </div>

                {/* MATERIALS GRID */}
                <div className="materials-catalog-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
                    {catalog.filter(mat => mat.id === expandedMaterial).map(mat => {
                        const isCurrent = componentMaterials[selectedPart] === mat.id;
                        return (
                            <section key={mat.id} className={`mat-catalog-card ${isCurrent ? 'active' : ''}`} style={{ cursor: 'default' }}>
                                <div className="mat-card-info">
                                    {expandedMaterial === mat.id && <div className="material-control-row">
                                    <label className="material-color-control">Base color
                                        <input type="color" aria-label={`${mat.name} color`} value={materialPreviewColor(mat.params.color) || '#ffffff'} onChange={e => editMaterial(mat.id, 'color', e.target.value)} />
                                    </label>
                                    {[
                                        ['Diffuse', 'diffuseContrast', 1, 0, 4, .05, 'diffuseImage'],
                                        ['Reflection', 'envMapIntensity', 1, 0, 5, .05],
                                        ['Gloss', 'gloss', 1 - (mat.params.roughness ?? .5), 0, 1, .01],
                                        ['Metalness', 'metalness', 0, 0, 1, .01],
                                        ['Bump', 'bumpScale', .15, 0, 2, .01, 'bumpImage'],
                                        ['Bump contrast', 'bumpContrast', 1, 1, 100, 1],
                                        ['Clearcoat', 'clearcoat', 0, 0, 1, .01],
                                        ['Edge', 'edgeChamferRadius', 0, 0, 20, .1],
                                    ].map(([label, key, fallback, min, max, step, texture]) => {
                                        const value = key === 'gloss' ? 1 - (mat.params.roughness ?? .5) : mat.params[key] ?? fallback;
                                        return <div key={key} className="material-slider-control">
                                            <label className="d-flex justify-content-between" htmlFor={`${mat.id}-${key}`}><span>{label}</span><span>{Number(value).toFixed(2)}</span></label>
                                            <input id={`${mat.id}-${key}`} className="form-range" type="range" min={min} max={max} step={step} value={value}
                                                onChange={e => editMaterial(mat.id, key === 'gloss' ? 'roughness' : key, key === 'gloss' ? 1 - Number(e.target.value) : Number(e.target.value))} />
                                            {texture && <DiffuseImageInput label={`${label} Texture`} value={mat.params[texture]} onChange={url => editMaterial(mat.id, texture, url)} uvw={mat.params[texture === 'diffuseImage' ? 'diffuseUVW' : 'bumpUVW'] || {}} onUVWChange={uvw => editMaterial(mat.id, texture === 'diffuseImage' ? 'diffuseUVW' : 'bumpUVW', uvw)} />}
                                        </div>;
                                    })}
                                    </div>}
                                </div>
                            </section>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
