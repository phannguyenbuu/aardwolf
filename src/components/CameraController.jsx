import React from 'react';
import { useConfigurator } from '../context/ConfiguratorContext.jsx';

const views = [ ['bottom-view', 'Bottom', 7], ['front-view', 'Front', 1], ['left-view', 'Left', 2], ['right-view', 'Right', 3], ['top-view', 'Top', 4], ['ortho-view', 'Isometric', 5], ['360', '360°', 6] ];
export default function CameraController() {
    const { setCameraPresetTrigger, isTurntableActive } = useConfigurator();
    return <div className="original-camera-controller" role="group" aria-label="3D camera controls">
        {views.map(([id, label, icon]) => <button key={id} type="button" aria-label={`${label} view`} aria-pressed={id === '360' ? isTurntableActive : undefined} onClick={() => setCameraPresetTrigger(id)}>
            <img src={`/assets/images/Icon (${icon}).png`} alt="" />
        </button>)}
    </div>;
}
