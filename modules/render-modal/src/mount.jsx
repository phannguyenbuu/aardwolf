import React from 'react';
import { createRoot } from 'react-dom/client';
import RenderDialog from './RenderDialog.jsx';
import bootstrap from 'bootstrap/dist/css/bootstrap.min.css?inline';
import styles from './modal.css?inline';

// Own React root and Shadow DOM let any framework consume this remote.
export function mount(element, props) {
    const shadow = element.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = bootstrap + '\n' + styles;
    const container = document.createElement('div');
    shadow.append(style, container);
    const root = createRoot(container);
    const viewport = window.visualViewport;
    const resize = () => element.style.setProperty('--modal-viewport-height', `${viewport?.height || window.innerHeight}px`);
    resize();
    viewport?.addEventListener('resize', resize);
    window.addEventListener('resize', resize);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const update = next => root.render(<RenderDialog {...next} portalTarget={shadow} />);
    update(props);
    return { update, unmount() {
        viewport?.removeEventListener('resize', resize);
        window.removeEventListener('resize', resize);
        document.body.style.overflow = previousOverflow;
        root.unmount(); element.remove();
    } };
}
