import React, { useEffect, useRef } from 'react';
import { useConfigurator } from '../context/ConfiguratorContext.jsx';
import TabUserSettings from '../components/tabs/TabUserSettings.jsx';
import TabComponentMaterials from '../components/tabs/TabComponentMaterials.jsx';
import TabEnvironment from '../components/tabs/TabEnvironment.jsx';
import TabMaterialLib from '../components/tabs/TabMaterialLib.jsx';

export default function ConfiguratorPage() {
    const { activeLeftTab, setActiveLeftTab, adminMode } = useConfigurator();
    const panelRef = useRef(null);
    useEffect(() => {
        const panel = panelRef.current;
        let lastRight;
        const align = () => {
            const right = panel.getBoundingClientRect().right;
            if (right === lastRight) return;
            lastRight = right;
            document.documentElement.style.setProperty('--configurator-viewport-left', `${right}px`);
        };
        const header = document.querySelector('.header');
        const syncHeaderHeight = () => document.documentElement.style.setProperty('--configurator-header-height', `${header?.getBoundingClientRect().height || 0}px`);
        const headerObserver = new ResizeObserver(syncHeaderHeight);
        if (header) headerObserver.observe(header);
        syncHeaderHeight();
        const observer = new ResizeObserver(align);
        observer.observe(panel);
        const quoteButton = panel.querySelector('#quoteButton');
        const syncQuoteWidth = () => {
            const width = quoteButton?.getBoundingClientRect().width;
            if (width > 0) document.documentElement.style.setProperty('--quote-button-width', `${width}px`);
        };
        const quoteObserver = new ResizeObserver(syncQuoteWidth);
        if (quoteButton) quoteObserver.observe(quoteButton);
        syncQuoteWidth();
        window.addEventListener('resize', align);
        align();
        return () => {
            observer.disconnect();
            headerObserver.disconnect();
            document.documentElement.style.removeProperty('--configurator-header-height');
            quoteObserver.disconnect();
            window.removeEventListener('resize', align);
            document.documentElement.style.removeProperty('--configurator-viewport-left');
            document.documentElement.style.removeProperty('--quote-button-width');
        };
    }, []);

    return (
        <div className="container pb-5 configurator-layout">
            <div className="row content py-2">
                <div ref={panelRef} className="col-lg-6 col-md-12 col-12 content__left">
                    {/* CỘT 1 - THANH TAB ĐẦU CỘT: 5 TAB THEO YÊU CẦU */}
                    {adminMode && <div className="column-tabs-nav mb-3">
                        <button
                            type="button"
                            className={`col-tab-btn ${activeLeftTab === 'user-setting' ? 'active' : ''}`}
                            onClick={() => setActiveLeftTab('user-setting')}
                        >
                            <span className="col-tab-text">User Setting</span>
                        </button>
                        <button
                            type="button"
                            className={`col-tab-btn ${activeLeftTab === 'component-materials' ? 'active' : ''}`}
                            onClick={() => setActiveLeftTab('component-materials')}
                        >
                            <span className="col-tab-text">Components</span>
                        </button>
                        <button
                            type="button"
                            className={`col-tab-btn ${activeLeftTab === 'environment' ? 'active' : ''}`}
                            onClick={() => setActiveLeftTab('environment')}
                        >
                            <span className="col-tab-text">Environment</span>
                        </button>
                        <button
                            type="button"
                            className={`col-tab-btn ${activeLeftTab === 'material-lib' ? 'active' : ''}`}
                            onClick={() => setActiveLeftTab('material-lib')}
                        >
                            <span className="col-tab-text">Material Lib</span>
                        </button>
                    </div>}

                    {/* NỘI DUNG TỪNG TAB */}
                    <div className="column-tab-body">
                        {(!adminMode || activeLeftTab === 'user-setting') && <TabUserSettings />}
                        {adminMode && activeLeftTab === 'component-materials' && <TabComponentMaterials />}
                        {adminMode && activeLeftTab === 'environment' && <TabEnvironment />}
                        {adminMode && activeLeftTab === 'material-lib' && <TabMaterialLib />}
                    </div>
                </div>
            </div>
        </div>
    );
}
