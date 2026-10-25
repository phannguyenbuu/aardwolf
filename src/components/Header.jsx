import React, { useState } from 'react';
import { useConfigurator } from '../context/ConfiguratorContext.jsx';

export default function Header() {
    const { userName, login, logout } = useConfigurator();

    const [desktopUsername, setDesktopUsername] = useState('');
    const [desktopPassword, setDesktopPassword] = useState('');

    const [mobileUsername, setMobileUsername] = useState('');
    const [mobilePassword, setMobilePassword] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleDesktopLogin = (e) => {
        e.preventDefault();
        login(desktopUsername, desktopPassword);
    };

    const handleMobileLogin = (e) => {
        e.preventDefault();
        login(mobileUsername, mobilePassword).then((success) => {
            if (success) setMobileMenuOpen(false);
        });
    };

    return (
        <div className="header">
            <div className="container">
                <div className="d-flex justify-content-between align-items-center">
                    <img src="/assets/images/logo.png" alt="logo" className="logo" />

                    {/* Desktop Action */}
                    <div className="action-desktop d-none d-lg-flex align-items-center">
                        {!userName ? (
                            <form onSubmit={handleDesktopLogin} className="d-flex align-items-center">
                                <input
                                    type="text"
                                    className="username mr-2"
                                    placeholder="Username"
                                    value={desktopUsername}
                                    onChange={(e) => setDesktopUsername(e.target.value)}
                                />
                                <input
                                    type="password"
                                    className="password mr-2"
                                    placeholder="Password"
                                    value={desktopPassword}
                                    onChange={(e) => setDesktopPassword(e.target.value)}
                                />
                                <button type="submit" className="action__password loginButton">
                                    Login
                                </button>
                            </form>
                        ) : (
                            <div className="d-flex align-items-center">
                                <p className="userInfo m-0 mr-3 text-white">
                                    Welcome, <span className="userName font-weight-bold">{userName}</span>!
                                </p>
                                <button type="button" className="logoutButton" onClick={logout}>
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile Action Trigger */}
                    <div className="action-mobile d-lg-none d-flex align-items-center cursor-pointer">
                        {!userName ? (
                            <img
                                className="menu-mobile-img"
                                src="/assets/images/menu.png"
                                alt="menu"
                                onClick={() => setMobileMenuOpen(true)}
                            />
                        ) : (
                            <div className="d-flex align-items-center">
                                <p className="userInfo m-0 mr-2 text-white">
                                    Welcome, <span className="userName font-weight-bold">{userName}</span>!
                                </p>
                                <button type="button" className="logoutButton" onClick={logout}>
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile Drawer Menu */}
                    <div className={`menu-mobile ${mobileMenuOpen ? 'active' : ''}`}>
                        <div className="closes" onClick={() => setMobileMenuOpen(false)}>
                            <img src="/assets/images/close.png" alt="close" />
                        </div>
                        <form onSubmit={handleMobileLogin}>
                            <div className="pb-4 d-flex flex-column">
                                <input
                                    type="text"
                                    className="username mb-2"
                                    placeholder="Username"
                                    value={mobileUsername}
                                    onChange={(e) => setMobileUsername(e.target.value)}
                                />
                                <a href="#signup" onClick={(e) => e.preventDefault()}>Sign up</a>
                            </div>
                            <div className="pb-4 d-flex flex-column">
                                <input
                                    type="password"
                                    className="password mb-2"
                                    placeholder="Password"
                                    value={mobilePassword}
                                    onChange={(e) => setMobilePassword(e.target.value)}
                                />
                                <a href="#forgot" onClick={(e) => e.preventDefault()}>Forgot password</a>
                            </div>
                            <button type="submit" className="py-2 action__password loginButton">
                                Login
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
