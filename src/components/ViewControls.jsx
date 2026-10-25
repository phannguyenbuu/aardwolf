import React from 'react';
import { useConfigurator } from '../context/ConfiguratorContext.jsx';

export default function ViewControls() {
    const { setCameraPresetTrigger, setShow3DModal } = useConfigurator();

    return (
        <div className="image-3d">
            <a
                className="back"
                href="#back"
                onClick={(e) => {
                    e.preventDefault();
                    setShow3DModal(false);
                }}
            >
                <img style={{ width: 8 }} src="/assets/images/back.png" alt="back" />
                <span>Back</span>
            </a>

            <div className="d-flex flex-column icon-3d">
                <img
                    id="bottom-view"
                    style={{ width: 40 }}
                    src="/assets/images/Icon (7).png"
                    alt="bottom view"
                    title="Bottom view"
                    onClick={() => setCameraPresetTrigger('bottom-view')}
                />
                <img
                    id="front-view"
                    style={{ width: 40 }}
                    src="/assets/images/Icon (1).png"
                    alt="front view"
                    title="Front view"
                    onClick={() => setCameraPresetTrigger('front-view')}
                />
                <img
                    id="left-view"
                    style={{ width: 40 }}
                    src="/assets/images/Icon (2).png"
                    alt="left view"
                    title="Left view"
                    onClick={() => setCameraPresetTrigger('left-view')}
                />
                <img
                    id="right-view"
                    style={{ width: 40 }}
                    src="/assets/images/Icon (3).png"
                    alt="right view"
                    title="Right view"
                    onClick={() => setCameraPresetTrigger('right-view')}
                />
                <img
                    id="top-view"
                    style={{ width: 40 }}
                    src="/assets/images/Icon (4).png"
                    alt="top view"
                    title="Top view"
                    onClick={() => setCameraPresetTrigger('top-view')}
                />
                <img
                    id="ortho-view"
                    style={{ width: 40 }}
                    src="/assets/images/Icon (5).png"
                    alt="ortho view"
                    title="Ortho view"
                    onClick={() => setCameraPresetTrigger('ortho-view')}
                />
                <img
                    id="360"
                    style={{ width: 40 }}
                    src="/assets/images/Icon (6).png"
                    alt="360 view"
                    title="360 view"
                    onClick={() => setCameraPresetTrigger('360')}
                />
            </div>
        </div>
    );
}
