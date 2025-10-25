import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const SignupPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        // Validate password length
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            setLoading(false);
            return;
        }

        try {
            const signupData = {
                name: formData.name.trim() || formData.email.split('@')[0],
                email: formData.email,
                password: formData.password
            };

            const response = await authAPI.signup(signupData);
            const { user_id, email, name, token } = response.data;

            const userData = {
                id: user_id,
                email,
                name: name || email.split('@')[0]
            };

            login(userData, token);
            navigate('/');
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                'Signup failed. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner message="Creating your account..." />;
    }

    return (
        <div className="container">
            <div className="flex justify-center items-center" style={{ minHeight: 'calc(100vh - 160px)' }}>
                <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                    <div className="card-header text-center">
                        <h1>✨ Join Us</h1>
                        <p className="text-muted">Create your account to get started</p>
                    </div>

                    {error && (
                        <div className="alert alert-error">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="name" className="form-label">
                                Full Name (Optional)
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                className="form-input"
                                placeholder="Enter your full name"
                                value={formData.name}
                                onChange={handleInputChange}
                                autoComplete="name"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email" className="form-label">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className="form-input"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password" className="form-label">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                className="form-input"
                                placeholder="Enter your password (min 6 characters)"
                                value={formData.password}
                                onChange={handleInputChange}
                                required
                                autoComplete="new-password"
                                minLength={6}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword" className="form-label">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                className="form-input"
                                placeholder="Confirm your password"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                required
                                autoComplete="new-password"
                                minLength={6}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-full"
                            disabled={loading}
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    <div className="text-center mt-4">
                        <p className="text-muted">
                            Already have an account?{' '}
                            <Link to="/login" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: '500' }}>
                                Sign in here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;