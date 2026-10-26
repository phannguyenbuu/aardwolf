import React from 'react';
import { useConfigurator } from '../context/ConfiguratorContext.jsx';
import UnitSelector from '../components/UnitSelector.jsx';
import TabUserSettings from '../components/tabs/TabUserSettings.jsx';
import TabComponentMaterials from '../components/tabs/TabComponentMaterials.jsx';
import TabEnvironment from '../components/tabs/TabEnvironment.jsx';
import TabStudioHD from '../components/tabs/TabStudioHD.jsx';
import TabMaterialLib from '../components/tabs/TabMaterialLib.jsx';

export default function ConfiguratorPage() {
    const { activeLeftTab, setActiveLeftTab } = useConfigurator();

    return (
        <div className="container pb-5">
            <UnitSelector />

            <div className="row content py-2">
                <div className="col-lg-6 col-md-12 col-12 content__left">
                    {/* CỘT 1 - THANH TAB ĐẦU CỘT: 5 TAB THEO YÊU CẦU */}
                    <div className="column-tabs-nav mb-3">
                        <button
                            type="button"
                            className={`col-tab-btn ${activeLeftTab === 'user-setting' ? 'active' : ''}`}
                            onClick={() => setActiveLeftTab('user-setting')}
                            title="Tất cả các thông số cấu hình đầu vào"
                        >
                            <span className="col-tab-icon">👤</span>
                            <span className="col-tab-text">User Setting</span>
                        </button>
                        <button
                            type="button"
                            className={`col-tab-btn ${activeLeftTab === 'component-materials' ? 'active' : ''}`}
                            onClick={() => setActiveLeftTab('component-materials')}
                            title="Vật liệu của từng cấu kiện máy móc"
                        >
                            <span className="col-tab-icon">🎨</span>
                            <span className="col-tab-text">Material cấu kiện</span>
                        </button>
                        <button
                            type="button"
                            className={`col-tab-btn ${activeLeftTab === 'environment' ? 'active' : ''}`}
                            onClick={() => setActiveLeftTab('environment')}
                            title="Môi trường, Đèn trần, Cornell Box, Wavelet Filter"
                        >
                            <span className="col-tab-icon">🏛️</span>
                            <span className="col-tab-text">Environment</span>
                        </button>
                        <button
                            type="button"
                            className={`col-tab-btn ${activeLeftTab === 'studio-hd' ? 'active' : ''}`}
                            onClick={() => setActiveLeftTab('studio-hd')}
                            title="Studio HD Render, Xuất ảnh 4K, Telemetry"
                        >
                            <span className="col-tab-icon">📸</span>
                            <span className="col-tab-text">Studio HD</span>
                        </button>
                        <button
                            type="button"
                            className={`col-tab-btn ${activeLeftTab === 'material-lib' ? 'active' : ''}`}
                            onClick={() => setActiveLeftTab('material-lib')}
                            title="Thư viện 25+ vật liệu PBR và Presets 1-Click"
                        >
                            <span className="col-tab-icon">💎</span>
                            <span className="col-tab-text">Material Lib</span>
                        </button>
                    </div>

                    {/* NỘI DUNG TỪNG TAB */}
                    <div className="column-tab-body">
                        {activeLeftTab === 'user-setting' && <TabUserSettings />}
                        {activeLeftTab === 'component-materials' && <TabComponentMaterials />}
                        {activeLeftTab === 'environment' && <TabEnvironment />}
                        {activeLeftTab === 'studio-hd' && <TabStudioHD />}
                        {activeLeftTab === 'material-lib' && <TabMaterialLib />}
                    </div>
                </div>
            </div>
        </div>
    );
}
