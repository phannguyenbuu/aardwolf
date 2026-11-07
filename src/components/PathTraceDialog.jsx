import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as THREE from 'three';
import { StudioRenderer } from '../rendering/StudioRenderer.js';
import download from 'downloadjs';
import { useConfigurator } from '../context/ConfiguratorContext.jsx';
import { VIEWPORT_HDR_URL } from '../rendering/environment.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

export default function PathTraceDialog({ source, camera, exposure, samples, bounces, previewSize, onClose, hideCloseButton = false }) {
    const host = useRef(null), jobRef = useRef(null), strengthRef = useRef(0.3);
    const outputRef = useRef(null), adjustmentRef = useRef(null);
    const [channel, setChannel] = useState('Full');
    const [editTab, setEditTab] = useState('light');
    const [picked, setPicked] = useState('#ffffff');
    const [adjustments, setAdjustments] = useState({ exposure: 0, shadows: 0, highlights: 0, detail: 0, brightness: 0, contrast: 0, saturation: 0, hue: 0, curve: 0, cyan: 0, magenta: 0, yellow: 0, black: 0, red: 0, green: 0, blue: 0 });
    adjustmentRef.current = { channel, adjustments };
    const autoAdjust = mode => {
        const canvas = outputRef.current;
        if (!canvas || !available) return;
        const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        const sums = [0,0,0], histogram = new Uint32Array(256); let count = 0;
        for (let i=0;i<data.length;i+=16) { if (data[i+3] < 128) continue; const r=data[i],g=data[i+1],b=data[i+2]; if (r>250 && g>250 && b>250) continue; sums[0]+=r;sums[1]+=g;sums[2]+=b;histogram[Math.round(.2126*r+.7152*g+.0722*b)]++;count++; }
        if (!count) return;
        if (mode === 'color') { const mean=(sums[0]+sums[1]+sums[2])/3; setAdjustments(a=>({...a, red: Math.max(-50,Math.min(50,(mean-sums[0])/count/255*100)), green: Math.max(-50,Math.min(50,(mean-sums[1])/count/255*100)), blue: Math.max(-50,Math.min(50,(mean-sums[2])/count/255*100))})); }
        else { let lo=0,hi=255,n=0; while(lo<255 && (n+=histogram[lo])<count*.01)lo++; n=0;while(hi>0 && (n+=histogram[hi])<count*.01)hi--; const range=Math.max(1,hi-lo); setAdjustments(a=>({...a, contrast:Math.max(-80,Math.min(100,(255/range-1)*100)), brightness:Math.max(-80,Math.min(80,(127.5-(lo+hi)/2)/255*100))})); }
    };
    const [zoom, setZoom] = useState(1), [pan, setPan] = useState({ x: 0, y: 0 });
    const drag = useRef(null);
    const [strength, setStrength] = useState(0.3);
    const [progress, setProgress] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const { sceneLights, updateSceneLight } = useConfigurator();
    const hdrRotation = sceneLights.environment?.rotation ?? 0;
    const hdrIntensity = sceneLights.environment?.intensity ?? 1;
    const hdrRotationRef = useRef(hdrRotation), restartRef = useRef(null);
    const hdrIntensityRef = useRef(hdrIntensity);
    const rotateHdr = value => updateSceneLight('environment', 'rotation', Number(value));
    useEffect(() => {
        hdrRotationRef.current = hdrRotation;
        hdrIntensityRef.current = hdrIntensity;
        const job = jobRef.current;
        if (!job?.scene) return;
        const angle = THREE.MathUtils.degToRad(hdrRotation);
        job.scene.environmentRotation.set(0, angle, 0);
        job.scene.backgroundRotation.set(0, angle, 0);
        job.scene.environmentIntensity = hdrIntensity;
        job.tracer.updateEnvironment();
        restartRef.current?.();
    }, [hdrRotation, hdrIntensity]);
    const [sampleLimit, setSampleLimit] = useState(3000);
    const sampleLimitRef = useRef(sampleLimit);
    const updateSampleLimit = value => {
        const next = Math.min(3000, Math.max(1, Math.round(Number(value) || 1)));
        setSampleLimit(next);
        sampleLimitRef.current = next;
        if (jobRef.current && jobRef.current.tracer.samples < next) {
            runningRef.current = true; setRunning(true); setState('Rendering');
        }
    };
    const [state, setState] = useState('Preparing shaders...');
    const [running, setRunning] = useState(true);
    const [available, setAvailable] = useState(false);
    const runningRef = useRef(true), repaintRef = useRef(true);
    const [confirmClose, setConfirmClose] = useState(false);
    const requestClose = () => { if (runningRef.current) setConfirmClose(true); else onClose(); };
    useEffect(() => {
        const closeOnEscape = event => { if (event.key === 'Escape') { event.preventDefault(); requestClose(); } };
        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [onClose]);

    useEffect(() => {
        const oldOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        let renderer, job, hdr, whiteBackground, frame, startupFrame, startupTimer, disposed = false, lost = false, lastDenoisedSample = -1;
        let elapsedMs = 0, lastTick = performance.now();
        restartRef.current = () => {
            elapsedMs = 0; lastTick = performance.now(); lastDenoisedSample = -1;
            repaintRef.current = true; runningRef.current = true;
            setElapsed(0); setProgress(0); setRunning(true); setAvailable(false); setState('Rendering');
        };
        runningRef.current = true;
        const contextLost = event => {
            event.preventDefault();
            lost = true;
            runningRef.current = false;
            cancelAnimationFrame(frame);
            setRunning(false);
            setAvailable(false);
            setState('GPU context lost. Close this dialog and try again.');
        };
        const start = async () => {
        if (disposed || !runningRef.current) return;
        try {
            setState('Loading HDR environment...');
            hdr = await new RGBELoader().loadAsync(VIEWPORT_HDR_URL);
            hdr.mapping = THREE.EquirectangularReflectionMapping;
            if (disposed || !runningRef.current) { hdr.dispose(); return; }
            renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
            renderer.domElement.addEventListener('webglcontextlost', contextLost);
            renderer.setClearColor(0xffffff, 1);
            renderer.setPixelRatio(1);
            renderer.setSize(previewSize.width, previewSize.height, false);
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = exposure;
            // Display through a 2D canvas so adjustments affect previews and downloads.
            job = new StudioRenderer(renderer); jobRef.current = job;
            job.tracer.bounces = bounces; job.tracer.renderScale = 1;
            const frozenCamera = camera.clone();
            // Keep the viewport projection and pixel dimensions, not the modal aspect.
            frozenCamera.updateMatrixWorld(true);
            whiteBackground = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1, THREE.RGBAFormat);
            whiteBackground.mapping = THREE.EquirectangularReflectionMapping;
            whiteBackground.colorSpace = THREE.SRGBColorSpace;
            whiteBackground.needsUpdate = true;
            job.prepare(source, frozenCamera, { environment: hdr, background: whiteBackground });
            job.scene.environmentRotation.y = THREE.MathUtils.degToRad(hdrRotationRef.current);
            job.scene.backgroundRotation.y = THREE.MathUtils.degToRad(hdrRotationRef.current);
            job.scene.environmentIntensity = hdrIntensityRef.current;
            job.tracer.updateEnvironment();
            lastTick = performance.now();
            const tick = () => {
                if (disposed || lost || renderer.getContext().isContextLost()) return;
                try {
                    const now = performance.now();
                    if (runningRef.current) elapsedMs += now - lastTick;
                    lastTick = now;
                    setElapsed(Math.floor(elapsedMs / 1000));
                    if (runningRef.current && job.tracer.samples < sampleLimitRef.current) {
                        job.tracer.pausePathTracing = false;
                        job.tracer.renderSample();
                        // Denoise once per completed sample, not once per tile.
                        if (Math.floor(job.tracer.samples) > lastDenoisedSample) repaintRef.current = true;
                        setState(job.tracer.isCompiling ? 'Preparing shaders...' : 'Rendering');
                    }
                    const count = job.tracer.samples;
                    if (count >= 1) {
                        setAvailable(true);
                        if (repaintRef.current) {
                            const amount = strengthRef.current;
                            if (amount > 0) {
                                job.denoiseQuad.material.sigma = 0.5 + amount * 1.5;
                                job.denoiseQuad.material.kSigma = 1 + amount;
                                job.denoiseQuad.material.threshold = 0.02 + amount * 0.16;
                                job.denoise();
                            } else {
                                job.tracer.pausePathTracing = true;
                                job.tracer.renderSample();
                            }
                            repaintRef.current = false;
                            lastDenoisedSample = Math.floor(count);
                        }
                    }
                    const output = outputRef.current;
                    if (output && count >= 1) {
                        if (output.width !== renderer.domElement.width || output.height !== renderer.domElement.height) { output.width = renderer.domElement.width; output.height = renderer.domElement.height; }
                        const ctx = output.getContext('2d', { willReadFrequently: true });
                        const { adjustments: a, channel: ch } = adjustmentRef.current;
                        ctx.filter = `brightness(${100 + a.brightness}%) contrast(${100 + a.contrast}%) saturate(${100 + a.saturation}%) hue-rotate(${a.hue}deg)`;
                        ctx.drawImage(renderer.domElement, 0, 0); ctx.filter = 'none';
                        if (ch !== 'Full' || a.exposure || a.shadows || a.highlights || a.detail || a.curve || a.cyan || a.magenta || a.yellow || a.black || a.red || a.green || a.blue) {
                            const img = ctx.getImageData(0, 0, output.width, output.height), data = img.data;
                            const original = a.detail ? new Uint8ClampedArray(data) : null;
                            for (let i = 0; i < data.length; i += 4) {
                                const lum = (.2126 * data[i] + .7152 * data[i+1] + .0722 * data[i+2]) / 255;
                                const darkWeight = Math.pow(1 - lum, 2), lightWeight = lum * lum;
                                for (let c = 0; c < 3; c++) {
                                    let x = data[i+c] / 255;
                                    x *= Math.pow(2, a.exposure / 50);
                                    x += (a.shadows / 100) * darkWeight * .5 + (a.highlights / 100) * lightWeight * .5;
                                    x = Math.pow(Math.max(0, x), Math.pow(2, -a.curve / 100));
                                    if (original) {
                                        const pixel = i / 4, px = pixel % output.width, py = Math.floor(pixel / output.width);
                                        if (px > 0 && py > 0 && px < output.width - 1 && py < output.height - 1) {
                                            const avg = (original[i-4+c] + original[i+4+c] + original[i-output.width*4+c] + original[i+output.width*4+c]) / 1020;
                                            x += (original[i+c] / 255 - avg) * a.detail / 100;
                                        }
                                    }
                                    x = (x * (1 - a.black / 100) * (1 - [a.cyan, a.magenta, a.yellow][c] / 100)) + [a.red, a.green, a.blue][c] / 100;
                                    data[i+c] = Math.max(0, Math.min(255, x * 255));
                                }
                                if (ch !== 'Full') { const v = data[i + ({R:0,G:1,B:2}[ch])]; data[i] = data[i+1] = data[i+2] = v; }
                            }
                            ctx.putImageData(img, 0, 0);
                        }
                    }
                    setProgress(Math.min(100, Math.floor(count / sampleLimitRef.current * 100)));
                    if (count >= sampleLimitRef.current && runningRef.current) { runningRef.current = false; setRunning(false); setState('Complete'); }
                } catch (error) { runningRef.current = false; setRunning(false); setAvailable(false); setState(error.message); return; }
                frame = requestAnimationFrame(tick);
            };
            frame = requestAnimationFrame(tick);
        } catch (error) { setRunning(false); setState(error.message); }
        };
        // Let the browser paint the modal before creating GPU resources and building the scene.
        startupFrame = requestAnimationFrame(() => {
            startupFrame = requestAnimationFrame(() => { startupTimer = setTimeout(start, 0); });
        });
        return () => {
            disposed = true;
            runningRef.current = false;
            cancelAnimationFrame(frame);
            cancelAnimationFrame(startupFrame);
            clearTimeout(startupTimer);
            renderer?.domElement.removeEventListener('webglcontextlost', contextLost);
            try { job?.dispose(); }
            finally {
                renderer?.dispose();
                // Removing a canvas alone leaves its WebGL context alive until GC.
                if (renderer && !renderer.getContext().isContextLost()) renderer.forceContextLoss();
                renderer?.domElement.remove();
                jobRef.current = null;
                restartRef.current = null;
                hdr?.dispose();
                whiteBackground?.dispose();
                document.body.style.overflow = oldOverflow;
            }
        };
    }, []);
    const cancel = () => { runningRef.current = false; setRunning(false); setState('Cancelled — current image retained'); };
    const save = () => {
        const canvas = outputRef.current;
        if (!canvas) return;
        canvas.toBlob(blob => { if (blob) download(blob, `Aardwolf_PathTracing_${Date.now()}.png`, 'image/png'); }, 'image/png');
    };
    return createPortal(<div className="diffuse-modal-backdrop" onClick={event => { if (event.target === event.currentTarget) requestClose(); }}><section className="render-job-dialog path-trace-editor" role="dialog" aria-modal="true" aria-label="Path Tracing Render">
        <header className="d-flex justify-content-between align-items-center p-3"><strong>Path Tracing Render · {progress}%</strong><div className="path-trace-progress"><span role="status">{state}</span><progress value={progress} max="100" /><button type="button" className="btn btn-outline-danger" disabled={!running} title="Stop rendering" aria-label="Stop rendering" onClick={cancel}><i className="fas fa-stop" aria-hidden="true" /></button></div><div className="path-trace-toolbar">            <div className="d-flex gap-1">{['Full','R','G','B'].map(c => <button type="button" key={c} aria-pressed={channel===c} className={`btn btn-sm ${channel===c?'btn-primary':'btn-outline-secondary'}`} onClick={()=>setChannel(c)}>{c}</button>)}</div>
            <div className="d-flex gap-2"><button type="button" className="btn btn-sm btn-outline-secondary" title="Auto Color" aria-label="Auto Color" onClick={()=>autoAdjust('color')}><i className="fas fa-magic" aria-hidden="true" /></button><button type="button" className="btn btn-sm btn-outline-secondary" title="Auto Contrast" aria-label="Auto Contrast" onClick={()=>autoAdjust('contrast')}><i className="fas fa-adjust" aria-hidden="true" /></button><input type="color" aria-label="Color picker" value={picked} onChange={e=>setPicked(e.target.value)} /></div>
</div><button type="button" title="Download image" aria-label="Download image" disabled={!available} onClick={save} style={{ border: 0, background: "transparent" }}><i className="fas fa-download" aria-hidden="true" /></button><button type="button" style={{ border: 0, background: "transparent" }} title="Close" aria-label="Close path tracing" onClick={requestClose}>✕</button></header>
        <div className="render-job-body"><div className="path-trace-image-area" style={{ background: '#fff', overflow: 'hidden', touchAction: 'none' }} onWheel={e => { e.preventDefault(); setZoom(z => Math.max(.2, Math.min(8, z * (e.deltaY < 0 ? 1.1 : 1 / 1.1)))); }} onPointerDown={e => { drag.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }; e.currentTarget.setPointerCapture(e.pointerId); }} onPointerMove={e => { if (drag.current) setPan({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y }); }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}><div className="path-trace-zoom" onPointerDown={e => e.stopPropagation()}><button type="button" aria-label="Zoom out" title="Zoom out" onClick={() => setZoom(z => Math.max(.2, z / 1.2))}>−</button><span>{Math.round(zoom * 100)}%</span><button type="button" aria-label="Zoom in" title="Zoom in" onClick={() => setZoom(z => Math.min(8, z * 1.2))}>+</button><button type="button" title="Reset zoom and pan" aria-label="Reset zoom and pan" onClick={() => { setZoom(1); setPan({x:0,y:0}); }}>⟲</button></div><div ref={host} className="path-trace-canvas" style={{ width: previewSize.cssWidth, height: previewSize.cssHeight, transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "center", aspectRatio: `${previewSize.width} / ${previewSize.height}` }}><canvas ref={outputRef} style={{ width: '100%', height: '100%', display: 'block' }} onDoubleClick={e => { const rect = e.currentTarget.getBoundingClientRect(), x = Math.min(e.currentTarget.width-1, Math.max(0, Math.floor((e.clientX-rect.left)/rect.width*e.currentTarget.width))), y = Math.min(e.currentTarget.height-1, Math.max(0, Math.floor((e.clientY-rect.top)/rect.height*e.currentTarget.height))); const v = e.currentTarget.getContext('2d').getImageData(x,y,1,1).data; setPicked('#'+[v[0],v[1],v[2]].map(n=>n.toString(16).padStart(2,'0')).join('')); }} /></div></div><aside>
            <nav className="path-trace-tabs" aria-label="Image adjustments">
                {[['light','Light'],['color','Color'],['detail','Detail']].map(([id,label]) => <button type="button" key={id} aria-pressed={editTab===id} className={editTab===id?'active':''} onClick={()=>setEditTab(id)}>{label}</button>)}
            </nav>
            {editTab === 'detail' && <label className="path-trace-control path-trace-denoise"><span>Denoise</span><input aria-label="Denoise" type="range" className="form-range" min="0" max="1" step="0.05" value={strength} onChange={e => { const value = Number(e.target.value); setStrength(value); strengthRef.current = value; repaintRef.current = true; }} /><input className="path-trace-value" type="number" aria-label="Denoise percentage" min="0" max="100" step="1" value={Math.round(strength * 100)} onChange={e => { if (e.target.value === '') return; const value = Math.max(0, Math.min(100, Number(e.target.value))) / 100; if (!Number.isFinite(value)) return; setStrength(value); strengthRef.current = value; repaintRef.current = true; }} /></label>}
            {Object.entries(editTab === 'light' ? {exposure:'Exposure',brightness:'Brightness',contrast:'Contrast',shadows:'Shadows',highlights:'Highlights',curve:'Gamma'} : editTab === 'color' ? {hue:'Hue',saturation:'Saturation',cyan:'Cyan',magenta:'Magenta',yellow:'Yellow',black:'Black',red:'Balance R',green:'Balance G',blue:'Balance B'} : {detail:'Detail'}).map(([key,label])=><label key={key} className="path-trace-control"><span>{label}</span><input type="range" className="form-range" min={key==='hue'?-180:-100} max={key==='hue'?180:100} value={adjustments[key]} onChange={e=>setAdjustments(a=>({...a,[key]:Number(e.target.value)}))} /><input className="path-trace-value" type="number" aria-label={`${label} value`} min={key==='hue'?-180:-100} max={key==='hue'?180:100} step="1" value={adjustments[key]} onChange={e => { const n = Number(e.target.value); if (e.target.value !== '' && Number.isFinite(n)) setAdjustments(a => ({...a,[key]:Math.max(key==='hue'?-180:-100,Math.min(key==='hue'?180:100,n))})); }} /></label>)}
            <div className="mt-3" aria-label="Render time">Render time: {Math.floor(elapsed / 60)}m {elapsed % 60}s</div>
            <div className="path-trace-sample-row"><label className="path-trace-sample-control"><span>Samples (1–3000)</span><input aria-label="Samples" type="number" className="form-control mt-2" min="1" max="3000" step="1" value={sampleLimit} onChange={event => updateSampleLimit(event.target.value)} /></label>
</div>
        </aside></div>
    {confirmClose && <div className="path-trace-confirm-backdrop" onClick={e => e.stopPropagation()}><section role="alertdialog" aria-modal="true" aria-labelledby="confirm-cancel-title" className="path-trace-confirm"><strong id="confirm-cancel-title">Are you sure you want to cancel the render?</strong><div className="d-flex gap-2 mt-3"><button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setConfirmClose(false)}>Continue rendering</button><button type="button" className="btn btn-sm btn-danger" onClick={() => { runningRef.current = false; onClose(); }}>Cancel render</button></div></section></div>}
    </section></div>, document.body);
}
