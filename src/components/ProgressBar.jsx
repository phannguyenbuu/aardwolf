import React from 'react';
import { useConfigurator } from '../context/ConfiguratorContext.jsx';

export default function ProgressBar() {
    const { is3DLoading, loadingProgress } = useConfigurator();

    if (!is3DLoading) return null;

    return (
        <div id="progressBarContainer" style={{ display: 'block' }}>
            <div className="mb-2 text-center" style={{ fontSize: 13, fontWeight: 'bold' }}>
                Loading 3D Models... {loadingProgress}%
            </div>
            <progress id="progressBar" value={loadingProgress} max="100" />
        </div>
    );
}
