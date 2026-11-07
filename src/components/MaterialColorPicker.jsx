import React, { useEffect, useState } from 'react';

function rgb(hex) {
    const normalized = typeof hex === 'number' ? hex.toString(16).padStart(6, '0') : String(hex).replace('#', '');
    const value = /^[\da-f]{6}$/i.test(normalized) ? normalized : 'c0c8d2';
    return [0, 2, 4].map(index => parseInt(value.slice(index, index + 2), 16));
}
function hsv(channels) {
    const [r, g, b] = channels.map(value => value / 255);
    const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
    let hue = delta === 0 ? 0 : max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
    return [(hue * 60 + 360) % 360, max === 0 ? 0 : delta / max, max];
}
function hexFromHSV(h, s, v) {
    const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
    const channels = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return '#' + channels.map(value => Math.round((value + m) * 255).toString(16).padStart(2, '0')).join('');
}

export default function MaterialColorPicker({ value, onChange }) {
    const canonical = '#' + rgb(value).map(channel => channel.toString(16).padStart(2, '0')).join('');
    const [color, setColor] = useState(() => hsv(rgb(value)));
    const [draft, setDraft] = useState(canonical);
    const [h, s, v] = color;
    useEffect(() => {
        setDraft(canonical);
        setColor(previous => hexFromHSV(...previous) === canonical ? previous : hsv(rgb(canonical)));
    }, [canonical]);
    const commit = next => { setColor(next); const hex = hexFromHSV(...next); setDraft(hex); onChange(hex); };
    const point = event => {
        const rect = event.currentTarget.getBoundingClientRect();
        commit([h, Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), 1 - Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height))]);
    };
    return <div className="material-color-picker">
        <div className="material-color-heading"><span>Base color</span><span className="material-color-chip" style={{ background: canonical }} /></div>
        <div className="material-sv" style={{ backgroundColor: `hsl(${h} 100% 50%)` }} role="slider" aria-label="Color saturation and brightness" tabIndex={0} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(s * 100)} aria-valuetext={`Saturation ${Math.round(s * 100)}%, brightness ${Math.round(v * 100)}%`}
            onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); point(event); }}
            onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) point(event); }}
            onKeyDown={event => {
                if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
                event.preventDefault();
                commit([h, Math.max(0, Math.min(1, s + (event.key === 'ArrowRight' ? 0.01 : event.key === 'ArrowLeft' ? -0.01 : 0))), Math.max(0, Math.min(1, v + (event.key === 'ArrowUp' ? 0.01 : event.key === 'ArrowDown' ? -0.01 : 0)))]);
            }}><span className="material-sv-cursor" style={{ left: `${s * 100}%`, top: `${(1 - v) * 100}%` }} /></div>
        <input className="material-hue" type="range" min="0" max="359" value={Math.round(h)} aria-label="Color hue" onChange={event => commit([Number(event.target.value), s, v])} />
        <label className="material-hex">HEX<input aria-label="Color HEX" value={draft} maxLength={7} spellCheck={false} onChange={event => {
            const next = event.target.value; setDraft(next);
            if (/^#?[\da-f]{6}$/i.test(next)) { const hex = '#' + next.replace('#', ''); setColor(hsv(rgb(hex))); onChange(hex); }
        }} onBlur={() => setDraft(canonical)} /></label>
        <div className="material-rgb">{rgb(canonical).map((channel, index) => <label key={index}>{['R', 'G', 'B'][index]}<input aria-label={`Color ${['R', 'G', 'B'][index]}`} type="number" min="0" max="255" value={channel} onChange={event => {
            if (event.target.value === '') return;
            const channels = rgb(canonical); channels[index] = Math.max(0, Math.min(255, Math.round(Number(event.target.value))));
            const hex = '#' + channels.map(number => number.toString(16).padStart(2, '0')).join(''); setColor(hsv(channels)); onChange(hex);
        }} /></label>)}</div>
    </div>;
}
