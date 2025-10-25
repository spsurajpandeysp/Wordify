import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navigation.css';

const Navigation = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
        setIsMenuOpen(false);
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    const isActive = (path) => {
        return location.pathname === path ? 'nav-link active' : 'nav-link';
    };

    return (
        <nav className="navbar">
            <div className="container">
                <div className="nav-content">
                    {/* Logo/Brand */}
                    <Link to="/" className="nav-brand" onClick={closeMenu}>
                        <span className="nav-brand-icon">📚</span>
                        <span className="nav-brand-text">Wordify</span>
                    </Link>

                    {/* Mobile Menu Button */}
                    <button
                        className="nav-toggle"
                        onClick={toggleMenu}
                        aria-label="Toggle navigation menu"
                    >
                        <span className={`hamburger ${isMenuOpen ? 'open' : ''}`}>
                            <span></span>
                            <span></span>
                            <span></span>
                        </span>
                    </button>

                    {/* Navigation Links */}
                    <div className={`nav-menu ${isMenuOpen ? 'open' : ''}`}>
                        {isAuthenticated() ? (
                            <>
                                <Link to="/" className={isActive('/')} onClick={closeMenu}>
                                    🏠 Home
                                </Link>
                                <Link to="/get-meaning" className={isActive('/get-meaning')} onClick={closeMenu}>
                                    🔍 Get Meaning
                                </Link>
                                <Link to="/my-words" className={isActive('/my-words')} onClick={closeMenu}>
                                    📝 My Words
                                </Link>
                                <Link to="/my-phrases" className={isActive('/my-phrases')} onClick={closeMenu}>
                                    💬 My Phrases
                                </Link>
                                <Link to="/practice" className={isActive('/practice')} onClick={closeMenu}>
                                    🎯 Practice
                                </Link>
                                <Link to="/about" className={isActive('/about')} onClick={closeMenu}>
                                    ℹ️ About
                                </Link>

                                {/* User Menu */}
                                <div className="user-menu">
                                    <span className="user-greeting">
                                        👋 Hi, {user?.name || user?.email}
                                    </span>
                                    <button
                                        onClick={handleLogout}
                                        className="btn btn-secondary btn-small logout-btn"
                                    >
                                        🚪 Logout
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link to="/about" className={isActive('/about')} onClick={closeMenu}>
                                    ℹ️ About
                                </Link>
                                <Link to="/login" className={isActive('/login')} onClick={closeMenu}>
                                    🔑 Login
                                </Link>
                                <Link to="/signup" className={isActive('/signup')} onClick={closeMenu}>
                                    ✨ Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navigation;