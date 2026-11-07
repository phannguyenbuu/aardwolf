import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function ModalSelect({ value, onChange, children, title, disabled, id, className = '', 'aria-label': ariaLabel }) {
    const [open, setOpen] = useState(false);
    const trigger = useRef(null), dialog = useRef(null);
    const headingId = useId();
    const options = React.Children.toArray(children).flatMap(child => child?.type === React.Fragment ? React.Children.toArray(child.props.children) : [child]);
    const selected = options.find(option => String(option.props.value) === String(value));
    const label = ariaLabel || title || 'Select option';
    useEffect(() => {
        if (!open) return;
        const overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        dialog.current?.querySelector('button')?.focus();
        const keydown = event => {
            if (event.key === 'Escape') setOpen(false);
            if (event.key !== 'Tab') return;
            const buttons = [...dialog.current.querySelectorAll('button:not(:disabled)')];
            const first = buttons[0], last = buttons[buttons.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        };
        document.addEventListener('keydown', keydown);
        return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', keydown); trigger.current?.focus(); };
    }, [open]);
    return <>
        <button ref={trigger} id={id} type="button" className={`surface-modal-trigger modal-select-trigger ${className}`} disabled={disabled} aria-label={label} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
            <span>{selected?.props.children || 'Select option'}</span><i className="fas fa-chevron-down" aria-hidden="true" />
        </button>
        {open && createPortal(<div className="surface-modal-backdrop" onClick={event => { if (event.target === event.currentTarget) setOpen(false); }}>
            <div ref={dialog} className="surface-selection-dialog" role="dialog" aria-modal="true" aria-labelledby={headingId}>
                <header><strong id={headingId}>{label}</strong><button type="button" aria-label="Close selection" onClick={() => setOpen(false)}><i className="fas fa-times" aria-hidden="true" /></button></header>
                <div className={`surface-modal-options ${id === 'unitSelect' ? 'unit-modal-options' : ''}`}>{options.map(option => <button type="button" key={option.props.value} disabled={option.props.disabled} title={option.props.title} aria-pressed={String(option.props.value) === String(value)} onClick={() => { onChange({ target: { value: option.props.value } }); setOpen(false); }}>{option.props.children}</button>)}</div>
            </div>
        </div>, document.body)}
    </>;
}
