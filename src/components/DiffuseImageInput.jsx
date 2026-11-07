import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { settingsHeaders } from '../utils/settingsApi.js';

export default function DiffuseImageInput({ value, onChange, uvw = {}, onUVWChange, label = 'Diffuse Image' }) {
    const [draftValue, setDraftValue] = useState(value || '');
    const [draftUVW, setDraftUVW] = useState(uvw);
    const beginEdit = () => { setDraftValue(value || ''); setDraftUVW({ ...uvw }); setStatus(''); setOpen(true); };
    const [open, setOpen] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [status, setStatus] = useState('');
    const [busy, setBusy] = useState(false);
    const drag = useRef(null);
    const fileInput = useRef(null);
    useEffect(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, [value, open]);
    useEffect(() => {
        if (!open) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const key = e => { if (e.key === 'Escape') setOpen(false); };
        window.addEventListener('keydown', key);
        return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', key); };
    }, [open]);
    const upload = async e => {
        const file = e.target.files?.[0]; e.target.value = '';
        if (!file) return;
        if (!['image/png', 'image/jpeg', 'image/webp', 'image/avif'].includes(file.type) || file.size > 8388608) { setStatus('Choose PNG, JPEG, WebP or AVIF up to 8 MB'); return; }
        setBusy(true); setStatus('Uploading...');
        try {
            const headers = settingsHeaders(); headers['Content-Type'] = file.type;
            const res = await fetch('/api/textures', { method: 'POST', headers, body: file });
            const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Upload failed');
            if (!open) setDraftUVW({ ...uvw });
            setDraftValue(data.url); setStatus(''); setOpen(true);
        } catch (error) { setStatus(error.message); } finally { setBusy(false); }
    };
    return <>
        <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp,image/avif,.avif,.webp" onChange={upload} hidden />
        <button type="button" className="diffuse-preview" aria-label={`${label} preview`} disabled={busy} onClick={() => value ? beginEdit() : fileInput.current.click()}>
            {value ? <img src={value} alt="Diffuse texture" /> : 'Choose Image'}
        </button>
        {status && <span role="status">{status}</span>}
        {open && createPortal(<div className="diffuse-modal-backdrop" onClick={() => setOpen(false)}>
            <section className="diffuse-modal" role="dialog" aria-modal="true" aria-label="Diffuse Image" onClick={e => e.stopPropagation()}>
                <header><strong>{label}</strong><div className="d-flex gap-2">
                    <button type="button" onClick={() => setZoom(z => Math.max(0.1, z / 1.2))} aria-label="Zoom out">−</button>
                    <span>{Math.round(zoom * 100)}%</span>
                    <button type="button" onClick={() => setZoom(z => Math.min(10, z * 1.2))} aria-label="Zoom in">+</button>
                    <button type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>Fit</button>
                    <button type="button" disabled={!draftValue || busy} onClick={async () => {
                        setBusy(true); setStatus('Downloading...');
                        try {
                            const response = await fetch(draftValue);
                            if (!response.ok) throw new Error('Could not download texture');
                            const blob = await response.blob();
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = new URL(draftValue, window.location.href).pathname.split('/').pop() || 'texture';
                            document.body.appendChild(link); link.click(); link.remove();
                            setTimeout(() => URL.revokeObjectURL(url), 10000);
                            setStatus('');
                        } catch (error) { setStatus(error.message); }
                        finally { setBusy(false); }
                    }}>Download Texture</button>
                    <button type="button" disabled={busy} onClick={() => fileInput.current.click()}>Replace Image</button>
                    <button type="button" onClick={() => setDraftValue('')}>Remove</button>
                    <button type="button" aria-label="Confirm texture changes" title="OK" disabled={busy} onClick={() => {
                        if (draftValue !== (value || '')) onChange(draftValue);
                        if (JSON.stringify(draftUVW) !== JSON.stringify(uvw)) onUVWChange?.(draftUVW);
                        setOpen(false);
                    }}>✓</button>
                    <button type="button" title="Cancel changes" aria-label="Close image preview" onClick={() => setOpen(false)}>✕</button>
                </div></header>
                <div className="uvw-map-controls">
                    <label>World Size <input type="checkbox" checked={!!draftUVW.worldSize} onChange={e => setDraftUVW({ ...draftUVW, worldSize: e.target.checked })} /></label>
                    {draftUVW.worldSize && ['X', 'Y'].map(axis => <label key={axis}>Size {axis} (mm)<input type="number" min="0.01" step="1" value={draftUVW['size' + axis] ?? 100} onChange={e => { const n = Number(e.target.value); if(n > 0) setDraftUVW({ ...draftUVW, ['size' + axis]: n }); }} /></label>)}

                    <label>UVW Map Type <select aria-label="UVW Map Type" value={draftUVW.type || 'tile'} onChange={e => setDraftUVW({ ...draftUVW, type: e.target.value })}>
                        <option value="tile">Tile / Repeat</option><option value="mirror">Mirrored Tile</option><option value="clamp">Clamp / Single Image</option>
                    </select></label>
                    {[['tileU', 'Tiling X', 1], ['tileV', 'Tiling Y', 1], ['offsetU', 'Offset U', 0], ['offsetV', 'Offset V', 0], ['rotation', 'Rotation °', 0]].map(([key, label, fallback]) =>
                        <label key={key}>{label}<input aria-label={label} type="number" step={key === 'rotation' ? 1 : 0.1} min={key.startsWith('tile') ? 0.01 : undefined} value={draftUVW[key] ?? fallback} onChange={e => { const n = Number(e.target.value); if (Number.isFinite(n) && (!key.startsWith('tile') || n > 0)) setDraftUVW({ ...draftUVW, [key]: n }); }} /></label>)}
                    <button type="button" onClick={() => setDraftUVW({ type: 'tile', tileU: 1, tileV: 1, offsetU: 0, offsetV: 0, rotation: 0 })}>Reset UVW</button>
                </div>
                <div className="diffuse-image-stage" onWheel={e => setZoom(z => Math.max(0.1, Math.min(10, z * (e.deltaY < 0 ? 1.1 : 0.9))))}
                    onPointerDown={e => { drag.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }; e.currentTarget.setPointerCapture(e.pointerId); }}
                    onPointerMove={e => { if (drag.current) setPan({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y }); }}
                    onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
                    {draftValue && <img src={draftValue} alt="Diffuse texture preview" draggable="false" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }} />}
                </div>
                {status && <div role="status">{status}</div>}
            </section>
        </div>, document.body)}
    </>;
}
