import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
    const { user } = useAuth();

    return (
        <div className="container">
            <div className="text-center mb-4">
                <h1>📚 Welcome to Wordify</h1>
                <p className="text-muted">
                    Hi {user?.name || user?.email}! Enhance your English vocabulary with Wordify.
                </p>
            </div>

            {/* Quick Actions Cards */}
            <div className="grid grid-2 mb-4">
                <Link to="/get-meaning" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="card-content text-center">
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                        <h3>Get Meaning</h3>
                        <p className="text-muted">
                            Search for word or phrase definitions with AI-powered explanations
                        </p>
                    </div>
                </Link>

                <Link to="/my-words" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="card-content text-center">
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                        <h3>My Words</h3>
                        <p className="text-muted">
                            View and manage your saved words collection
                        </p>
                    </div>
                </Link>
            </div>

            <div className="grid grid-2 mb-4">
                <Link to="/my-phrases" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="card-content text-center">
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
                        <h3>My Phrases</h3>
                        <p className="text-muted">
                            Explore and save useful English phrases
                        </p>
                    </div>
                </Link>

                <div className="card">
                    <div className="card-content text-center">
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
                        <h3>Frame Sentences</h3>
                        <p className="text-muted">
                            Generate example sentences using your saved words and phrases
                        </p>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="card mb-4">
                <div className="card-header">
                    <h2>✨ What You Can Do</h2>
                </div>
                <div className="card-content">
                    <div className="grid grid-3 gap-4">
                        <div className="text-center">
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🧠</div>
                            <h3>AI-Powered Definitions</h3>
                            <p className="text-small text-muted">
                                Get comprehensive word and phrase meanings powered by Google's Gemini AI
                            </p>
                        </div>
                        <div className="text-center">
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💾</div>
                            <h3>Personal Collection</h3>
                            <p className="text-small text-muted">
                                Save words and phrases to build your personal vocabulary library
                            </p>
                        </div>
                        <div className="text-center">
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📖</div>
                            <h3>Example Sentences</h3>
                            <p className="text-small text-muted">
                                Generate contextual sentences to understand word usage better
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tips Section */}
            <div className="card">
                <div className="card-header">
                    <h2>💡 Learning Tips</h2>
                </div>
                <div className="card-content">
                    <ul className="list">
                        <li className="list-item">
                            <strong>🔍 Start with Search:</strong> Use "Get Meaning" to discover new words and phrases
                        </li>
                        <li className="list-item">
                            <strong>💾 Save Everything:</strong> Add interesting words and phrases to your personal collection
                        </li>
                        <li className="list-item">
                            <strong>📝 Practice with Sentences:</strong> Use the sentence generation feature to see words in context
                        </li>
                        <li className="list-item">
                            <strong>🔄 Review Regularly:</strong> Visit your saved words and phrases to reinforce learning
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default HomePage;