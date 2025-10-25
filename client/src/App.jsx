import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import MyWordsPage from './pages/MyWordsPage';
import MyPhrasesPage from './pages/MyPhrasesPage';
import GetMeaningPage from './pages/GetMeaningPage';
import PracticePage from './pages/PracticePage';
import LoadingSpinner from './components/LoadingSpinner';
import './styles/globals.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <LoadingSpinner />;
    }

    return isAuthenticated() ? children : <Navigate to="/login" />;
};

// Public Route Component (redirect if already authenticated)
const PublicRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <LoadingSpinner />;
    }

    return !isAuthenticated() ? children : <Navigate to="/" />;
};

function AppContent() {
    return (
        <div className="App">
            <Navigation />
            <main className="main-content">
                <Routes>
                    {/* Public Routes */}
                    <Route
                        path="/login"
                        element={
                            <PublicRoute>
                                <LoginPage />
                            </PublicRoute>
                        }
                    />
                    <Route
                        path="/signup"
                        element={
                            <PublicRoute>
                                <SignupPage />
                            </PublicRoute>
                        }
                    />
                    <Route path="/about" element={<AboutPage />} />

                    {/* Protected Routes */}
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <HomePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/my-words"
                        element={
                            <ProtectedRoute>
                                <MyWordsPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/my-phrases"
                        element={
                            <ProtectedRoute>
                                <MyPhrasesPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/get-meaning"
                        element={
                            <ProtectedRoute>
                                <GetMeaningPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/practice"
                        element={
                            <ProtectedRoute>
                                <PracticePage />
                            </ProtectedRoute>
                        }
                    />

                    {/* Fallback Route */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </main>
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <ToastProvider>
                <Router>
                    <AppContent />
                </Router>
            </ToastProvider>
        </AuthProvider>
    );
}

export default App;
