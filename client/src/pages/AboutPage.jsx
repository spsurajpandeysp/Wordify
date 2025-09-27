import React from 'react';
import { Link } from 'react-router-dom';

const AboutPage = () => {
    return (
        <div className="container">
            <div className="text-center mb-4">
                <h1>ℹ️ About Wordify</h1>
                <p className="text-muted">
                    Your AI-powered companion for English language learning
                </p>
            </div>

            {/* App Description */}
            <div className="card mb-4">
                <div className="card-header">
                    <h2>🎯 What is Wordify?</h2>
                </div>
                <div className="card-content">
                    <p>
                        Wordify is a modern, mobile-first application designed to help English learners
                        expand their vocabulary and improve their language skills. Powered by Google's Gemini AI,
                        our app provides comprehensive word and phrase definitions, contextual examples, and
                        personalized learning features.
                    </p>
                    <p>
                        Whether you're a beginner learning basic vocabulary or an advanced learner exploring
                        complex phrases and idioms, our app adapts to your learning style and helps you
                        build a strong foundation in English.
                    </p>
                </div>
            </div>

            {/* Key Features */}
            <div className="card mb-4">
                <div className="card-header">
                    <h2>🚀 Key Features</h2>
                </div>
                <div className="card-content">
                    <div className="grid grid-2 gap-4">
                        <div>
                            <h3>🧠 AI-Powered Definitions</h3>
                            <p className="text-small text-muted">
                                Get detailed, easy-to-understand definitions powered by Google's advanced Gemini AI model.
                            </p>
                        </div>
                        <div>
                            <h3>💬 Phrase Learning</h3>
                            <p className="text-small text-muted">
                                Discover common English phrases, idioms, and expressions with contextual usage examples.
                            </p>
                        </div>
                        <div>
                            <h3>📝 Personal Collections</h3>
                            <p className="text-small text-muted">
                                Save words and phrases to your personal library for easy review and practice.
                            </p>
                        </div>
                        <div>
                            <h3>📖 Example Sentences</h3>
                            <p className="text-small text-muted">
                                Generate contextual sentences to understand proper word and phrase usage.
                            </p>
                        </div>
                        <div>
                            <h3>📱 Mobile-First Design</h3>
                            <p className="text-small text-muted">
                                Optimized for mobile devices with touch-friendly interface and responsive design.
                            </p>
                        </div>
                        <div>
                            <h3>🔐 Secure & Private</h3>
                            <p className="text-small text-muted">
                                Your personal vocabulary collection is securely stored and accessible only to you.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* How It Works */}
            <div className="card mb-4">
                <div className="card-header">
                    <h2>🔄 How It Works</h2>
                </div>
                <div className="card-content">
                    <div className="list">
                        <div className="list-item">
                            <strong>Step 1: Search</strong> - Enter any English word or phrase in the search feature
                        </div>
                        <div className="list-item">
                            <strong>Step 2: Learn</strong> - Get AI-generated definitions, synonyms, and usage examples
                        </div>
                        <div className="list-item">
                            <strong>Step 3: Save</strong> - Add interesting words and phrases to your personal collection
                        </div>
                        <div className="list-item">
                            <strong>Step 4: Practice</strong> - Generate example sentences to see words in context
                        </div>
                        <div className="list-item">
                            <strong>Step 5: Review</strong> - Regularly revisit your saved vocabulary to reinforce learning
                        </div>
                    </div>
                </div>
            </div>

            {/* Technology Stack */}
            <div className="card mb-4">
                <div className="card-header">
                    <h2>⚡ Technology</h2>
                </div>
                <div className="card-content">
                    <div className="grid grid-3 gap-4">
                        <div className="text-center">
                            <h3>Frontend</h3>
                            <p className="text-small text-muted">
                                React.js with mobile-first responsive design and modern UI components
                            </p>
                        </div>
                        <div className="text-center">
                            <h3>Backend</h3>
                            <p className="text-small text-muted">
                                FastAPI with Python providing robust API endpoints and authentication
                            </p>
                        </div>
                        <div className="text-center">
                            <h3>AI Integration</h3>
                            <p className="text-small text-muted">
                                Google Gemini AI for intelligent word and phrase definitions
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Getting Started */}
            <div className="card mb-4">
                <div className="card-header">
                    <h2>🚀 Getting Started</h2>
                </div>
                <div className="card-content">
                    <p>
                        Ready to enhance your English vocabulary? Here's how to get started:
                    </p>
                    <div className="flex gap-2 flex-col" style={{ marginTop: '1rem' }}>
                        <Link to="/signup" className="btn btn-primary">
                            ✨ Create Account
                        </Link>
                        <Link to="/login" className="btn btn-secondary">
                            🔑 Sign In
                        </Link>
                    </div>
                </div>
            </div>

            {/* Contact/Support */}
            <div className="card">
                <div className="card-header">
                    <h2>📞 Support</h2>
                </div>
                <div className="card-content">
                    <p>
                        Need help or have questions? We're here to help you succeed in your
                        English learning journey.
                    </p>
                    <div className="text-center mt-4">
                        <p className="text-muted">
                            📧 Email: support@dictionaryapp.com<br />
                            🌐 Website: www.dictionaryapp.com<br />
                            📱 Version: 1.0.0
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;