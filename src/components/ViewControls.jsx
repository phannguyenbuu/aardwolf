import React from 'react';
import { useConfigurator } from '../context/ConfiguratorContext.jsx';

export default function ViewControls() {
    const { setCameraPresetTrigger, show3DModal, setShow3DModal } = useConfigurator();

    return (
        <div className="view-controls-floating">
            {/* Modal Exit button when fullscreen */}
            {show3DModal && (
                <button
                    className="view-back-pill"
                    onClick={() => setShow3DModal(false)}
                >
                    <img style={{ width: 8 }} src="/assets/images/back.png" alt="back" className="mr-1" />
                    <span>Back to Configurator</span>
                </button>
            )}

            {/* Floating Glassmorphism Toolbar */}
            <div className="view-toolbar-pill">
                <button
                    type="button"
                    className="view-pill-btn active-orbit"
                    onClick={() => setCameraPresetTrigger('360')}
                    title="Reset 360° Orbit View"
                >
                    <img src="/assets/images/Icon (6).png" alt="360" />
                    <span className="btn-label">360°</span>
                </button>

                <div className="view-toolbar-divider" />

                <button
                    type="button"
                    className="view-pill-btn"
                    onClick={() => setCameraPresetTrigger('front-view')}
                    title="Front View"
                >
                    <img src="/assets/images/Icon (1).png" alt="Front" />
                    <span className="btn-label">Front</span>
                </button>

                <button
                    type="button"
                    className="view-pill-btn"
                    onClick={() => setCameraPresetTrigger('top-view')}
                    title="Top View"
                >
                    <img src="/assets/images/Icon (4).png" alt="Top" />
                    <span className="btn-label">Top</span>
                </button>

                <button
                    type="button"
                    className="view-pill-btn"
                    onClick={() => setCameraPresetTrigger('left-view')}
                    title="Side View"
                >
                    <img src="/assets/images/Icon (2).png" alt="Side" />
                    <span className="btn-label">Side</span>
                </button>

                <button
                    type="button"
                    className="view-pill-btn"
                    onClick={() => setCameraPresetTrigger('ortho-view')}
                    title="Isometric / Ortho View"
                >
                    <img src="/assets/images/Icon (5).png" alt="Ortho" />
                    <span className="btn-label">Isometric</span>
                </button>

                <div className="view-toolbar-divider" />

                <button
                    type="button"
                    className="view-pill-btn fullscreen-btn"
                    onClick={() => setShow3DModal(!show3DModal)}
                    title={show3DModal ? 'Exit Fullscreen' : 'Expand Fullscreen View'}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {show3DModal ? (
                            <>
                                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                            </>
                        ) : (
                            <>
                                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                            </>
                        )}
                    </svg>
                    <span className="btn-label">{show3DModal ? 'Close' : 'Full'}</span>
                </button>
            </div>
        </div>
    );
}
