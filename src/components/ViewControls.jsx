import React from 'react';
import { useConfigurator } from '../context/ConfiguratorContext.jsx';

export default function ViewControls() {
    const { show3DModal, setShow3DModal } = useConfigurator();

    // All camera controls and toolbars have been moved below the canvas to keep the 3D view clean.
    // Only render the Back button when in Fullscreen modal mode.
    if (!show3DModal) return null;

    return (
        <div className="view-controls-floating">
            <button
                className="view-back-pill"
                onClick={() => setShow3DModal(false)}
            >
                <img style={{ width: 8 }} src="/assets/images/back.png" alt="back" className="mr-1" />
                <span>Exit Fullscreen</span>
            </button>
        </div>
    );
}
