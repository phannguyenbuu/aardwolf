import React from 'react';
import selectionThumbnails from '../../constants/selectionThumbnails.json';

export default function SelectionCard({ name, value, label, image, checked, disabled, reason, onChange }) {
    return <label className={`selection-card ${disabled ? 'is-disabled' : ''}`} title={reason} tabIndex={disabled ? 0 : undefined} aria-disabled={disabled || undefined}>
        <input type="radio" name={name} value={value} checked={checked} disabled={disabled} onChange={onChange} />
        <span className="selection-card-body">
            <img src={selectionThumbnails[image] || image} alt="" loading="lazy" decoding="async" />
            <span className="selection-card-label">{label}</span>
            <span className="selection-card-check" aria-hidden="true">✓</span>
        </span>
        {disabled && reason && <span className="selection-card-reason">{reason}</span>}
    </label>;
}
