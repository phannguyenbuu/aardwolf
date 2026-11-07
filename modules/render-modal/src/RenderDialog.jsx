import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { readRenderJob } from './renderJobs.js';
import RenderImageViewer from './RenderImageViewer.jsx';
import { buildRenderPrompt } from './prompt.js';


function SpacePicker({ scenes, value, disabled, onChange }) {
    const stripRef = useRef(null);
    const [hovered, setHovered] = useState(null);
    const [edges, setEdges] = useState({ start: true, end: false });
    const updateEdges = () => {
        const strip = stripRef.current;
        if (strip) setEdges({ start: strip.scrollLeft <= 1, end: strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 1 });
    };
    useEffect(() => {
        const observer = new ResizeObserver(updateEdges);
        observer.observe(stripRef.current);
        return () => observer.disconnect();
    }, []);
    const scroll = direction => stripRef.current?.scrollBy({ left: direction * stripRef.current.clientWidth * 0.8, behavior: 'smooth' });
    const tip = scenes.find(space => space.id === hovered);
    return <div className="space-picker">
        {tip && <div className="space-toast" role="tooltip"><strong>{tip.label}</strong><span>{tip.prompt}</span></div>}
        <div className="space-picker-label">Choose environment</div>
        <div className="space-strip-row">
            <button type="button" className="space-arrow" aria-label="Previous environments" disabled={edges.start} onClick={() => scroll(-1)}><i className="fas fa-chevron-left" aria-hidden="true" /></button>
            <div ref={stripRef} className="space-strip" role="radiogroup" aria-label="Choose environment" onScroll={updateEdges}>
                {scenes.map(space => <button type="button" key={space.id} role="radio" aria-checked={value === space.id} aria-label={space.label} disabled={disabled} onClick={() => onChange(space.id)} onMouseEnter={() => setHovered(space.id)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(space.id)} onBlur={() => setHovered(null)}><img src={space.image} alt="" onLoad={updateEdges} />{value === space.id && <i className="fas fa-check" aria-hidden="true" />}</button>)}
            </div>
            <button type="button" className="space-arrow" aria-label="More environments" disabled={edges.end} onClick={() => scroll(1)}><i className="fas fa-chevron-right" aria-hidden="true" /></button>
        </div>
    </div>;
}

export default function RenderDialog({
    mode, capture, render, onClose, hideCloseButton = false,
    prompt = '', systemPrompt = '', scenePrompt = '', contextPrompt = '',
    scenes = [], initialSceneId, aspectRatios = ['1:1', '3:2', '4:3', '16:9'], initialAspectRatio = '16:9',
    cameraMetadata = {}, apiBase = 'https://genai.toolxprint.com/api',
    jobOptions = {}, downloadFileName = 'render.png', title, renderButtonLabel,
    promptPlaceholder = 'Describe your image…', timeHint = 'Rendering may take a few minutes. Keep this window open until it is ready.',
    onResult, onProgress, onError, pollIntervalMs = 2000, timeoutMs = 1200000,
    portalTarget = document.body
}) {
    const settingsHeaders = () => ({ 'Content-Type': 'application/json' });
    const [customPrompt, setCustomPrompt] = useState(prompt);
    const [aspectRatio, setAspectRatio] = useState(aspectRatios.includes(initialAspectRatio) ? initialAspectRatio : aspectRatios[0] || '16:9');
    const [image, setImage] = useState('');
    const [beforeImage, setBeforeImage] = useState('');
    const [hasResult, setHasResult] = useState(false);
    const [scene, setScene] = useState(initialSceneId || scenes[0]?.id || '');
    const [engine, setEngine] = useState('studio');
    const [environment, setEnvironment] = useState(1);
    const [exposure, setExposure] = useState(1.15);
    const [intensity, setIntensity] = useState(2.8);
    const [busy, setBusy] = useState(false);
    const [progress, setProgress] = useState(null);
    const callbacks = useRef({ onResult, onProgress, onError });
    callbacks.current = { onResult, onProgress, onError };
    const notify = (name, value) => { try { callbacks.current[name]?.(value); } catch (error) { console.error('Render Modal callback failed', error); } };
    useEffect(() => { setCustomPrompt(prompt); }, [prompt]);
    useEffect(() => { if (!scenes.some(item => item.id === scene)) setScene(scenes[0]?.id || ''); }, [scenes, scene]);
    useEffect(() => { notify('onProgress', { progress, busy }); }, [progress, busy]);
    const dialogTitle = title || (mode === 'realistic' ? 'Render Realistic' : mode === 'capture' ? 'Capture' : 'Render');
    const [status, setStatus] = useState('');
    const abortRef = useRef(null), jobRef = useRef(null), objectUrl = useRef(null);
    useEffect(() => { let active = true; capture().then(src => { if (active) { setImage(src); setBeforeImage(src); } }).catch(e => { if (active) { setStatus(e.message); notify('onError', { message: e.message, name: e.name }); } }); return () => { active = false; abortRef.current?.abort(); if (objectUrl.current) URL.revokeObjectURL(objectUrl.current); }; }, [capture]);
    const cancel = () => {
        abortRef.current?.abort();
        if (jobRef.current) fetch(`${apiBase}/jobs/${encodeURIComponent(jobRef.current)}/cancel`, { method: 'POST', headers: settingsHeaders() }).catch(() => {});
    };
    const close = () => { cancel(); onClose(); };
    useEffect(() => {
        const escape = event => { if (event.key === 'Escape') { abortRef.current?.abort(); onClose(); } };
        window.addEventListener('keydown', escape);
        return () => window.removeEventListener('keydown', escape);
    }, [onClose]);
    const start = async () => {
        const controller = new AbortController(); abortRef.current = controller;
        jobRef.current = null; setBusy(true); setProgress(0); setStatus('');
        try {
            if (mode === 'realistic') {
                const reference = await capture();
                controller.signal.throwIfAborted();
                setImage(reference); setBeforeImage(reference); setHasResult(false); setStatus('Submitting image...');
                const response = await fetch(`${apiBase.replace(/\/$/, '')}/jobs/edit-full`, { method: 'POST', signal: controller.signal, headers: settingsHeaders(), body: JSON.stringify({
                    engine: 'chatgpt', job_type: 'edit_full', new_chat: false, ...jobOptions,
                    prompt: buildRenderPrompt({ systemPrompt, scenePrompt, contextPrompt, prompt: customPrompt, scene: scenes.find(item => item.id === scene), aspectRatio, cameraMetadata }),
                    reference_images: [reference], aspect_ratio: aspectRatio
                }) });
                let data = await response.json(); if (!response.ok) throw new Error(data.error || 'Could not create render job');
                const id = data.job_id || data.id || data.job?.id; jobRef.current = id;
                const deadline = Date.now() + Math.max(1000, timeoutMs);
                while (true) {
                    const job = readRenderJob(data);
                    setProgress(previous => Math.max(previous || 0, job.progress));
                    if (job.result) { setImage(job.result); setHasResult(true); setProgress(100); setStatus(''); notify('onResult', { mode, url: job.result, jobId: id, aspectRatio, sceneId: scene }); break; }
                    if (job.failed) throw new Error(job.error);
                    if (!id) throw new Error('API did not return a job ID or result image');
                    if (Date.now() > deadline) throw new Error('Timeout');
                    await new Promise((resolve, reject) => { const timer = setTimeout(resolve, Math.max(100, pollIntervalMs)); controller.signal.addEventListener('abort', () => { clearTimeout(timer); reject(new DOMException('Cancelled', 'AbortError')); }, { once: true }); });
                    // One slow or failed status check must not abandon a job that is still running upstream.
                    let poll;
                    try { poll = await fetch(`${apiBase}/jobs/${encodeURIComponent(id)}`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]), headers: settingsHeaders(), cache: 'no-store' }); }
                    catch (error) { if (controller.signal.aborted) throw error; setStatus('Waiting for the image service...'); continue; }
                    if (poll.status >= 500) { setStatus('Waiting for the image service...'); continue; }
                    data = await poll.json(); if (!poll.ok) throw new Error(data.error || 'Could not read job status');
                    setStatus('');
                }
            } else {
                setStatus(engine === 'hdr' ? 'Loading HDR and rendering...' : 'Rendering...');
                const blob = await render({ engine, environment, exposure, intensity, signal: controller.signal, onProgress: setProgress });
                controller.signal.throwIfAborted();
                if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
                objectUrl.current = URL.createObjectURL(blob); setImage(objectUrl.current); setProgress(100); setStatus('Complete'); notify('onResult', { mode, url: objectUrl.current, blob, engine });
            }
        } catch (error) { if (error.name !== 'AbortError') notify('onError', { message: error.message, name: error.name }); setStatus(error.name === 'AbortError' ? 'Cancelled' : /timeout|timed out/i.test(error.name + ' ' + error.message) ? 'Timeout' : error.message); }
        finally { setBusy(false); abortRef.current = null; }
    };
    return createPortal(<div className={`diffuse-modal-backdrop ${mode === 'realistic' ? 'realistic-modal-backdrop' : ''}`} onClick={event => { if (event.target === event.currentTarget) close(); }}><section className={`render-job-dialog ${mode === 'realistic' ? 'realistic-modal' : ''}`} role="dialog" aria-modal="true" aria-label={dialogTitle}>
        {mode !== 'realistic' && (<header className="d-flex justify-content-between align-items-center p-3"><strong>{dialogTitle}</strong>{!hideCloseButton && <button type="button" onClick={close} aria-label="Close render">✕</button>}</header>)}

        <div className="render-job-body"><div className="render-preview-column"><div className="render-job-preview">{image && (mode === 'realistic' ? <RenderImageViewer before={beforeImage || image} after={hasResult ? image : null} /> : <img src={image} alt="Render preview" />)}
            {mode === 'realistic' && scenes.length > 0 && <SpacePicker scenes={scenes} value={scene} disabled={busy} onChange={setScene} />}
            {busy && <div className="render-progress-overlay"><div className="render-progress-panel"><progress aria-label="Render progress" max="100" value={progress || 0} /><button type="button" className="btn btn-outline-danger" onClick={cancel}>Cancel</button></div></div>}
        </div>
        </div><aside>
            {mode === 'realistic' && <div className="realistic-sidebar-title"><strong>{dialogTitle}</strong><button type="button" aria-label="Close render" title="Close" onClick={close}>✕</button></div>}
            {mode === 'realistic' ? null : mode === 'render' && <><label>Render Type<select className="form-select mt-2" disabled={busy} value={engine} onChange={e => setEngine(e.target.value)}><option value="studio">Studio Path Tracing</option><option value="hdr">HDR + SSR</option></select></label>{engine === 'hdr' && <label className="mt-3">HDR Environment<select className="form-select mt-2" disabled={busy} value={environment} onChange={e => setEnvironment(Number(e.target.value))}><option value={1}>Environment 1</option><option value={3}>Environment 2</option></select></label>}</>}
            {mode === 'realistic' && <div className="mt-3"><div className="image-ratio-label">Image ratio</div><div className="image-ratio-tags" role="group" aria-label="Image ratio">{aspectRatios.map(ratio => <button type="button" key={ratio} disabled={busy} aria-pressed={aspectRatio === ratio} onClick={() => setAspectRatio(ratio)}>{ratio}</button>)}</div></div>}
            {mode === 'realistic' && <div className="render-prompt-area"><div className="render-prompt-input"><i className="fas fa-pen" aria-hidden="true" /><textarea aria-label="Additional render prompt" placeholder={promptPlaceholder} rows={2} value={customPrompt} disabled={busy} onChange={event => setCustomPrompt(event.target.value)} /></div></div>}
            {mode === 'render' && engine === 'hdr' && <>
                <label className="mt-3">Exposure: {exposure.toFixed(2)}<input className="form-range" type="range" min="0.1" max="5" step="0.05" disabled={busy} value={exposure} onChange={e => setExposure(Number(e.target.value))} /></label>
                <label className="mt-3">Environment Intensity: {intensity.toFixed(1)}<input className="form-range" type="range" min="0.2" max="5" step="0.1" disabled={busy} value={intensity} onChange={e => setIntensity(Number(e.target.value))} /></label>
            </>}
            {mode === 'realistic' && timeHint && <p className="render-time-hint"><i className="far fa-clock" aria-hidden="true" /><span>{timeHint}</span></p>}
            <div className="render-dialog-actions mt-3">
                {mode !== 'capture' && <button type="button" className="btn btn-primary" disabled={busy} onClick={start}>{renderButtonLabel || (mode === 'realistic' ? 'Render Realistic' : 'Render')}</button>}
                {image && !busy && <a href={image} download={downloadFileName} className="btn btn-outline-secondary render-download-icon" aria-label="Download image" title="Download image" target="_blank" rel="noreferrer"><i className="fas fa-download" aria-hidden="true" /></a>}
            </div>
            {!busy && status && <div role="status" className="mt-3">{status}</div>}
        </aside></div>
    </section></div>, portalTarget);
}
