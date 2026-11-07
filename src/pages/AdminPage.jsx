import React, { useEffect, useState } from 'react';
import { getSettings, putSettings, settingsHeaders } from '../utils/settingsApi.js';
import { PBR_MATERIALS } from '../constants/pbrMaterials.js';
import { migrateSceneSettings } from '../utils/sceneSettings.js';

export default function AdminPage() {
    const [document, setDocument] = useState(null);
    const [models, setModels] = useState([]);
    const [selected, setSelected] = useState('');
    const [globalText, setGlobalText] = useState('null');
    const [status, setStatus] = useState('Loading...');
    const [requests, setRequests] = useState([]);
    const loadRequests = async () => {
        try {
            sessionStorage.setItem('aardwolf-admin-token', token);
            const response = await fetch('/api/rfq', { headers: settingsHeaders() });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Could not load requests');
            setRequests(data); setStatus(`${data.length} requests`);
        } catch (error) { setStatus(error.message); }
    };
    const [token, setToken] = useState(() => sessionStorage.getItem('aardwolf-admin-token') || '');
    useEffect(() => {
        Promise.all([getSettings(), fetch('/api/models').then(r => { if (!r.ok) throw new Error('Could not load models'); return r.json(); })])
            .then(([settings, list]) => {
                const scene = migrateSceneSettings(settings), global = { ...settings.global };
                delete global.partOffsets; delete global.componentMaterials; delete global.customParams;
                setDocument({ ...settings, version: 2, legacySceneSettings: settings.legacySceneSettings || (settings.version >= 2 ? null : { global: settings.global, models: settings.models }), global, models: scene.models, materials: scene.materials, materialMapping: scene.mapping, assemblies: scene.positions });
                setGlobalText(JSON.stringify(global, null, 2)); setModels(list); setSelected(list[0]?.key || ''); setStatus('');
            })
            .catch(error => setStatus(error.message));
    }, []);
    const model = document?.models[selected] || {};
    const materialId = document?.materialMapping?.[selected] || '';
    const materialParams = document?.materials?.[materialId] || {};
    const updateModel = patch => setDocument(prev => ({ ...prev, models: { ...prev.models, [selected]: { ...prev.models[selected], ...patch } } }));
    const save = async () => {
        try {
            setStatus('Saving...');
            sessionStorage.setItem('aardwolf-admin-token', token);
            const result = await putSettings({ ...document, global: JSON.parse(globalText) });
            if (typeof BroadcastChannel !== 'undefined') { const channel = new BroadcastChannel('aardwolf-materials'); channel.postMessage('saved'); channel.close(); }
            setDocument(result); setStatus('Settings saved. Reload the configurator to apply.');
        } catch (error) { setStatus(error.message); }
    };
    return <main className="admin-settings container py-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
            <h1>Configurator Settings</h1><a href="/">Open Configurator</a>
        </div>
        <div className="d-flex gap-2 mb-3 align-items-center">
            <label htmlFor="admin-token">Admin Token</label>
            <input id="admin-token" type="password" className="form-control" autoComplete="off" value={token} onChange={e => setToken(e.target.value)} />
            <button className="btn btn-primary text-nowrap" disabled={!document} onClick={save}>Save All Settings</button>
        </div>
        <div role="status" className="mb-3">{status}</div>
        <section className="card p-3 mb-3"><div className="d-flex justify-content-between"><h2>Quote requests</h2><button type="button" className="btn btn-outline-secondary" title="Load quote requests" aria-label="Load quote requests" onClick={loadRequests}><i className="fas fa-sync-alt" /></button></div>
            {requests.map(request => <details key={request.id} className="border-top py-2"><summary>{request.createdAt} · {request.name} · {request.consultation ? 'Consultation' : 'Quote'} · {request.id}</summary><p>{request.email}</p><p>{request.notes}</p><pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{JSON.stringify(request.configuration, null, 2)}</pre>{request.snapshot && <img src={request.snapshot} alt="Requested configuration" style={{ maxWidth: '100%', maxHeight: 250 }} />}</details>)}
        </section>
        {document && <div className="row g-3">
            <section className="col-lg-6"><div className="card p-3 h-100">
                <h2>Global Settings</h2>
                <label htmlFor="global-settings">Camera, saved views, lighting and configuration. Positions are stored per assembly; materials are shared by ID.</label>
                <textarea id="global-settings" className="form-control font-monospace mt-2" rows="28" value={globalText} onChange={e => setGlobalText(e.target.value)} spellCheck="false" />
            </div></section>
            <section className="col-lg-6"><div className="card p-3">
                <h2>3D File Settings</h2>
                <label htmlFor="model-file">FBX File</label>
                <select id="model-file" className="form-select mb-3" value={selected} onChange={e => setSelected(e.target.value)}>
                    {models.map(item => <option key={item.file} value={item.key}>{item.file}</option>)}
                </select>
                <p>Set position in the configurator for the selected User Settings assembly.</p>
                <h3>Rotation (degrees)</h3>
                <div className="row mb-3">{['X', 'Y', 'Z'].map((axis, i) => <label key={axis} className="col-4">{axis}<input type="number" className="form-control" value={model.rotation?.[i] || 0} onChange={e => { const rotation = [...(model.rotation || [0, 0, 0])]; rotation[i] = Number(e.target.value); updateModel({ rotation }); }} /></label>)}</div>
                <label>Scale<input type="number" min="0.001" step="0.01" className="form-control mb-3" value={model.scale ?? 1} onChange={e => updateModel({ scale: Number(e.target.value) })} /></label>
                <label htmlFor="model-material">Material</label>
                <select id="model-material" className="form-select mb-3" value={materialId} onChange={e => setDocument(prev => {
                    const mapping = { ...prev.materialMapping };
                    if (e.target.value) mapping[selected] = e.target.value; else delete mapping[selected];
                    for (const key of Object.keys(mapping)) if (key.startsWith(selected + '::')) delete mapping[key];
                    return { ...prev, materialMapping: mapping };
                })}>
                    <option value="">Use default material</option>
                    {PBR_MATERIALS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                <small>Editing material ID: {materialId || 'Select a material'}. Changes affect every object with this ID.</small>
                {['roughness', 'metalness', 'clearcoat'].map(key => <label key={key} className="mb-2">{key}<input disabled={!materialId} type="number" min="0" max="1" step="0.01" className="form-control" value={materialParams[key] ?? ''} onChange={e => {
                    const params = { ...materialParams }; if (e.target.value === '') delete params[key]; else params[key] = Number(e.target.value);
                    setDocument(prev => ({ ...prev, materials: { ...prev.materials, [materialId]: params } }));
                }} /></label>)}
                <button className="btn btn-outline-secondary mt-3" onClick={() => setDocument(prev => { const next = { ...prev.models }; delete next[selected]; return { ...prev, models: next }; })}>Reset File Overrides</button>
            </div></section>
        </div>}
    </main>;
}
