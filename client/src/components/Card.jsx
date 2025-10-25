import React from 'react';

const Card = ({
    children,
    className = '',
    onClick,
    style = {},
    hover = false
}) => {
    const cardClass = `card ${className} ${hover ? 'card-hover' : ''}`;

    return (
        <div
            className={cardClass}
            onClick={onClick}
            style={style}
        >
            {children}
        </div>
    );
};

const CardHeader = ({ children, className = '' }) => (
    <div className={`card-header ${className}`}>
        {children}
    </div>
);

const CardContent = ({ children, className = '' }) => (
    <div className={`card-content ${className}`}>
        {children}
    </div>
);

const CardActions = ({ children, className = '' }) => (
    <div className={`card-actions ${className}`}>
        {children}
    </div>
);

// Add hover effect styles
const styles = `
.card-hover {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}

.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

@media (pointer: coarse) {
  .card-hover:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
}

export { Card, CardHeader, CardContent, CardActions };
export default Card;