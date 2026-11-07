import React from 'react';

export default function StepSection({ title, children, open = false }) {
    return <details name="user-setting-accordion" className="user-setting-group" open={open}
        onToggle={event => { if (event.currentTarget.open) event.currentTarget.scrollIntoView({ block: 'start', behavior: 'instant' }); }}>
        <summary className="user-setting-group-heading">
            <span className="user-setting-chevron" aria-hidden="true" />
            <span className="step-title">{title}</span>
        </summary>
        <div className="user-setting-group-body">{children}</div>
    </details>;
}
