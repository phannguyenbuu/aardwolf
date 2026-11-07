import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useConfigurator } from '../context/ConfiguratorContext.jsx';
import { renderScenes, renderSystemPrompt, renderContextPrompt } from '../rendering/renderModalConfig.js';

const remoteEntry = import.meta.env.VITE_RENDER_MODAL_REMOTE || 'https://genai.toolxprint.com/render-modal/assets/remoteEntry.js';
let remote;
function loadRemote() {
    if (!remote) remote = import(/* @vite-ignore */ remoteEntry).then(async container => {
        await container.init({});
        return (await container.get('./RenderModal'))();
    }).catch(error => { remote = null; throw error; });
    return remote;
}

export default function RenderDialog(props) {
    const { environment } = useConfigurator();
    const instance = useRef(null), latest = useRef(null);
    const [error, setError] = useState('');
    const [attempt, setAttempt] = useState(0);
    const camera = window.__threeCamera?.current;
    const target = window.__threeControls?.current?.target;
    latest.current = { ...props, apiBase: '/api/genai',
        scenes: renderScenes, initialSceneId: 'studio', systemPrompt: renderSystemPrompt,
        contextPrompt: renderContextPrompt(environment), downloadFileName: 'Aardwolf-render.png',
        renderButtonLabel: props.mode === 'realistic' ? 'Render Realistic' : 'Render 4K',
        title: props.mode === 'realistic' ? 'Render Realistic' : props.mode === 'capture' ? 'Capture' : 'Render',
        cameraMetadata: { position: camera?.position.toArray(), target: target?.toArray(),
            fov: camera?.fov, aspect: camera?.aspect, up: camera?.up.toArray() } };
    useEffect(() => {
        let active = true;
        const element = document.createElement('genai-render-modal');
        document.body.append(element);
        setError('');
        loadRemote().then(module => {
            if (active) instance.current = module.mount(element, latest.current);
        }).catch(() => { if (active) setError('Could not load Render Modal. Please try again.'); });
        return () => { active = false; instance.current?.unmount(); instance.current = null; element.remove(); };
    }, [attempt]);
    useEffect(() => { instance.current?.update(latest.current); });
    if (!error) return null;
    return createPortal(<div className="diffuse-modal-backdrop"><section role="alert" style={{ background: 'white', padding: 24, borderRadius: 10 }}>
        <p>{error}</p><button onClick={() => setAttempt(value => value + 1)}>Retry</button>{' '}<button onClick={props.onClose}>Close</button>
    </section></div>, document.body);
}
