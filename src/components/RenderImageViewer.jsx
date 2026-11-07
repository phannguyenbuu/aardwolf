import React, { useEffect, useRef, useState } from 'react';

export default function RenderImageViewer({ before, after }) {
    const host = useRef(null), drag = useRef(null);
    const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
    const [split, setSplit] = useState(50);
    useEffect(() => { setView({ scale: 1, x: 0, y: 0 }); setSplit(50); }, [before]);
    useEffect(() => {
        const element = host.current;
        const wheel = event => {
            event.preventDefault();
            const rect = element.getBoundingClientRect();
            const x = event.clientX - rect.left - rect.width / 2;
            const y = event.clientY - rect.top - rect.height / 2;
            setView(old => {
                const scale = Math.max(1, Math.min(6, old.scale * Math.exp(-event.deltaY * .0015)));
                const ratio = scale / old.scale;
                return scale === 1 ? { scale, x: 0, y: 0 } : { scale, x: x - (x - old.x) * ratio, y: y - (y - old.y) * ratio };
            });
        };
        element.addEventListener('wheel', wheel, { passive: false });
        return () => element.removeEventListener('wheel', wheel);
    }, []);
    const transform = { transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` };
    return <div ref={host} className="render-image-viewer" onDoubleClick={() => setView({ scale: 1, x: 0, y: 0 })}
        onPointerDown={event => { if (event.button !== 0) return; drag.current = { x: event.clientX, y: event.clientY, view }; event.currentTarget.setPointerCapture(event.pointerId); }}
        onPointerMove={event => { if (!drag.current) return; const start = drag.current; setView({ ...start.view, x: start.view.x + event.clientX - start.x, y: start.view.y + event.clientY - start.y }); }}
        onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
        <div className="render-image-layer"><div className="render-image-transform" style={transform}><img src={before} alt="Before render" draggable="false" /></div></div>
        {after && <>
            <div className="render-image-layer" style={{ clipPath: `inset(0 0 0 ${split}%)` }}><div className="render-image-transform" style={transform}><img src={after} alt="After render" draggable="false" /></div></div>
            <span className="comparison-label before">Before</span><span className="comparison-label after">After</span>
            <div className="comparison-divider" style={{ left: `${split}%` }}><span>↔</span></div>
            <input type="range" className="comparison-slider" aria-label="Before and after comparison" min="0" max="100" value={split} onChange={event => setSplit(Number(event.target.value))} onPointerDown={event => event.stopPropagation()} />
        </>}
        <div className="render-zoom-controls" onPointerDown={event => event.stopPropagation()}>
            <button type="button" aria-label="Zoom out" onClick={() => setView(old => ({ ...old, scale: Math.max(1, old.scale - .25) }))}><i className="fas fa-minus" /></button>
            <button type="button" aria-label="Reset zoom" onClick={() => setView({ scale: 1, x: 0, y: 0 })}>{Math.round(view.scale * 100)}%</button>
            <button type="button" aria-label="Zoom in" onClick={() => setView(old => ({ ...old, scale: Math.min(6, old.scale + .25) }))}><i className="fas fa-plus" /></button>
        </div>
    </div>;
}
