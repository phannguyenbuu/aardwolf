import React from 'react';
import { ConfiguratorProvider, useConfigurator } from './context/ConfiguratorContext.jsx';
import Header from './components/Header.jsx';
import ConfiguratorPage from './pages/ConfiguratorPage.jsx';
import SpecificationPage from './pages/SpecificationPage.jsx';
import ThreeViewer from './components/ThreeViewer.jsx';
import ViewControls from './components/ViewControls.jsx';
import Footer from './components/Footer.jsx';
import AdminPage from './pages/AdminPage.jsx';

import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/page.css';
import './styles/responsive.css';

function MainApp() {
    const { currentPage, show3DModal } = useConfigurator();

    return (
        <div className={`app-wrapper ${show3DModal ? 'show-3d-active' : ''}`}>
            <Header />

            <main>
                {currentPage === 'configurator' ? (
                    <ConfiguratorPage />
                ) : (
                    <SpecificationPage />
                )}
            </main>

            <ThreeViewer />
            <ViewControls />
            <Footer />
        </div>
    );
}

export default function App() {
    if (window.location.pathname === '/admin') return <AdminPage />;
    return (
        <ConfiguratorProvider>
            <MainApp />
        </ConfiguratorProvider>
    );
}
