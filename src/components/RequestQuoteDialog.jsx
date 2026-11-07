import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useConfigurator } from '../context/ConfiguratorContext.jsx';

export default function RequestQuoteDialog({ onClose, consultation = false }) {
    const { craneType, jibLength, workLoadLimit, environment, surfaceType, actualLoad, suctionHeadId, handleId, config3D, configurationValidation, takeSnapshotRef } = useConfigurator();
    const { quotationBom } = useConfigurator();
    const [status, setStatus] = useState(''), [busy, setBusy] = useState(false), [result, setResult] = useState(null);
    const submit = async event => {
        event.preventDefault();
        if (busy || result) return;
        const form = new FormData(event.currentTarget);
        setBusy(true); setStatus('Submitting…');
        try {
            let snapshot = null;
            try { snapshot = await takeSnapshotRef.current?.(); } catch { /* The configuration can still be submitted for consultation. */ }
            const response = await fetch('/api/rfq', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.get('name'), email: form.get('email'), notes: form.get('notes'), consultation: consultation || !configurationValidation.valid, snapshot, configuration: { craneType, jibLength, workLoadLimit, environment, surfaceType, actualLoad, suctionHeadId, handleId, bom: quotationBom, models: config3D.data3D.filter(Boolean).map(item => ({ name: item.name, file: item.file || `/models/aardwolf_all_part_${item.name}.fbx` })), validation: configurationValidation } }) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Request service unavailable. Please retry.');
            setResult(data); setStatus(`Request saved: ${data.id}`);
        } catch (error) { setStatus(error.message); }
        finally { setBusy(false); }
    };
    return createPortal(<div className="diffuse-modal-backdrop"><section className="card p-4" role="dialog" aria-modal="true" aria-label="Request a Quote" style={{ width: 480, maxWidth: '95vw', maxHeight: '90vh', overflow: 'auto' }}>
        <header className="d-flex justify-content-between mb-3"><strong>{consultation ? 'Request consultation' : 'Request a Quote'}</strong><button type="button" className="btn btn-sm" disabled={busy} aria-label="Close quote request" title="Close" onClick={onClose}><i className="fas fa-times" /></button></header>
        <form onSubmit={submit}><label className="d-block mb-2">Name<input name="name" className="form-control" required maxLength={160} disabled={busy || !!result} /></label><label className="d-block mb-2">Email<input name="email" type="email" className="form-control" required maxLength={254} disabled={busy || !!result} /></label><label className="d-block mb-2">Notes<textarea name="notes" className="form-control" maxLength={5000} disabled={busy || !!result} /></label>
            {!configurationValidation.valid && <p className="text-muted">Your current configuration will be sent for consultation. It is not a confirmed equipment quotation.</p>}
            <div role="status" className="mb-2">{status}</div><button type="submit" className="btn btn-danger" disabled={busy || !!result} aria-label="Submit quote request" title="Submit"><i className={`fas ${busy ? 'fa-spinner fa-spin' : result ? 'fa-check' : 'fa-paper-plane'}`} /></button>
        </form>
    </section></div>, document.body);
}
