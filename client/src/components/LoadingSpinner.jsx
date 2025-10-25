import React from 'react';

const LoadingSpinner = ({ message = 'Loading...' }) => {
    return (
        <div className="loading">
            <div className="spinner"></div>
            <p className="text-muted text-small" style={{ marginTop: '1rem' }}>
                {message}
            </p>
        </div>
    );
};

export default LoadingSpinner;