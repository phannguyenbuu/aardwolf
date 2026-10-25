import React from 'react';
import { useConfigurator } from '../context/ConfiguratorContext.jsx';

export default function Footer() {
    const { setShow3DModal } = useConfigurator();

    const handleClick = (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setShow3DModal(true);
    };

    return (
        <div className="footer">
            <a href="#view360" onClick={handleClick}>
                <img src="/assets/images/3d.png" alt="3d" />
                <p className="m-0">View in 360°</p>
            </a>
        </div>
    );
}
