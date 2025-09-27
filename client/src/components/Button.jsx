import React from 'react';

const Button = ({
    children,
    variant = 'primary',
    size = 'default',
    fullWidth = false,
    disabled = false,
    loading = false,
    onClick,
    type = 'button',
    className = '',
    ...props
}) => {
    const baseClass = 'btn';
    const variantClass = `btn-${variant}`;
    const sizeClass = size !== 'default' ? `btn-${size}` : '';
    const fullWidthClass = fullWidth ? 'btn-full' : '';
    const loadingClass = loading ? 'btn-loading' : '';

    const buttonClass = [
        baseClass,
        variantClass,
        sizeClass,
        fullWidthClass,
        loadingClass,
        className
    ].filter(Boolean).join(' ');

    return (
        <button
            type={type}
            className={buttonClass}
            disabled={disabled || loading}
            onClick={onClick}
            {...props}
        >
            {loading && <span className="btn-spinner"></span>}
            {children}
        </button>
    );
};

// Add loading spinner styles
const styles = `
.btn-loading {
  position: relative;
  color: transparent !important;
}

.btn-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 16px;
  height: 16px;
  margin: -8px 0 0 -8px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.btn-loading .btn-spinner {
  color: white;
}

.btn-secondary.btn-loading .btn-spinner {
  color: #4a5568;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
}

export default Button;