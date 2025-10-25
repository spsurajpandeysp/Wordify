import React, { useState } from 'react';

const WordCard = ({ 
    word, 
    meaning, 
    examples = [], 
    synonyms = [], 
    onSave, 
    onDelete, 
    showActions = true,
    isSelected = false,
    onSelect 
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div className={`compact-word-card ${isSelected ? 'selected' : ''}`}>
            {/* Compact Header - Always Visible */}
            <div className="card-header-compact" onClick={toggleExpanded}>
                <div className="word-title">
                    <h3>{word}</h3>
                    <button className="expand-btn">
                        {isExpanded ? '▼' : '▶'}
                    </button>
                </div>
                
                {/* Action buttons */}
                {showActions && (
                    <div className="card-actions-compact" onClick={(e) => e.stopPropagation()}>
                        {onSelect && (
                            <button
                                className={`action-btn select-btn ${isSelected ? 'selected' : ''}`}
                                onClick={() => onSelect({ word, meaning, examples, synonyms })}
                                title={isSelected ? 'Deselect' : 'Select'}
                            >
                                {isSelected ? '✓' : '+'}
                            </button>
                        )}
                        {onSave && (
                            <button
                                className="action-btn save-btn"
                                onClick={() => onSave({ word, meaning, examples, synonyms })}
                                title="Save to collection"
                            >
                                💾
                            </button>
                        )}
                        {onDelete && (
                            <button
                                className="action-btn delete-btn"
                                onClick={() => {
                                    console.log('Delete button clicked in WordCard');
                                    onDelete();
                                }}
                                title="Delete"
                            >
                                🗑️
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Expandable Content */}
            {isExpanded && (
                <div className="card-content-expanded">
                    <div className="meaning-section">
                        <h4>Meaning:</h4>
                        <p>{meaning}</p>
                    </div>

                    {examples && examples.length > 0 && (
                        <div className="examples-section">
                            <h4>Examples:</h4>
                            <ul>
                                {examples.map((example, index) => (
                                    <li key={index}>{example}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {synonyms && synonyms.length > 0 && (
                        <div className="synonyms-section">
                            <h4>Synonyms:</h4>
                            <div className="synonyms-list">
                                {synonyms.map((synonym, index) => (
                                    <span key={index} className="synonym-tag">
                                        {synonym}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
                .compact-word-card {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    margin-bottom: 12px;
                    overflow: hidden;
                    transition: all 0.2s ease;
                    border: 2px solid transparent;
                }

                .compact-word-card:hover {
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
                    transform: translateY(-1px);
                }

                .compact-word-card.selected {
                    border-color: #3b82f6;
                    background: #f0f9ff;
                }

                .card-header-compact {
                    padding: 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: pointer;
                    transition: background-color 0.2s ease;
                }

                .card-header-compact:hover {
                    background-color: #f8fafc;
                }

                .word-title {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex: 1;
                }

                .word-title h3 {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 600;
                    color: #1f2937;
                }

                .expand-btn {
                    background: none;
                    border: none;
                    font-size: 12px;
                    color: #6b7280;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    transition: all 0.2s ease;
                }

                .expand-btn:hover {
                    background-color: #e5e7eb;
                    color: #374151;
                }

                .card-actions-compact {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }

                .action-btn {
                    background: none;
                    border: 2px solid transparent;
                    border-radius: 8px;
                    padding: 8px;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 36px;
                    min-height: 36px;
                }

                .select-btn {
                    background-color: #f0fdf4;
                    border-color: #16a34a;
                    color: #16a34a;
                }

                .select-btn:hover {
                    background-color: #16a34a;
                    color: white;
                    transform: scale(1.1);
                }

                .select-btn.selected {
                    background-color: #16a34a;
                    color: white;
                }

                .save-btn {
                    background-color: #eff6ff;
                    border-color: #3b82f6;
                }

                .save-btn:hover {
                    background-color: #3b82f6;
                    transform: scale(1.1);
                }

                .delete-btn {
                    background-color: #fef2f2;
                    border-color: #ef4444;
                }

                .delete-btn:hover {
                    background-color: #ef4444;
                    transform: scale(1.1);
                }

                .card-content-expanded {
                    padding: 0 16px 16px 16px;
                    border-top: 1px solid #e5e7eb;
                    background-color: #fafafa;
                    animation: slideDown 0.3s ease-out;
                }

                @keyframes slideDown {
                    from {
                        opacity: 0;
                        max-height: 0;
                    }
                    to {
                        opacity: 1;
                        max-height: 500px;
                    }
                }

                .meaning-section,
                .examples-section,
                .synonyms-section {
                    margin-bottom: 16px;
                }

                .meaning-section h4,
                .examples-section h4,
                .synonyms-section h4 {
                    margin: 12px 0 8px 0;
                    font-size: 14px;
                    font-weight: 600;
                    color: #374151;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .meaning-section p {
                    margin: 0;
                    color: #6b7280;
                    line-height: 1.5;
                    font-size: 14px;
                }

                .examples-section ul {
                    margin: 0;
                    padding-left: 16px;
                    list-style-type: disc;
                }

                .examples-section li {
                    color: #6b7280;
                    margin-bottom: 4px;
                    font-size: 14px;
                    font-style: italic;
                }

                .synonyms-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                }

                .synonym-tag {
                    background-color: #e0e7ff;
                    color: #3730a3;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 500;
                }

                /* Mobile optimizations */
                @media (max-width: 768px) {
                    .word-title h3 {
                        font-size: 16px;
                    }

                    .card-actions-compact {
                        gap: 6px;
                    }

                    .action-btn {
                        min-width: 32px;
                        min-height: 32px;
                        font-size: 14px;
                        padding: 6px;
                    }
                }

                /* Dark mode support */
                @media (prefers-color-scheme: dark) {
                    .compact-word-card {
                        background: #1f2937;
                        border-color: #374151;
                    }

                    .compact-word-card.selected {
                        background: #1e3a8a;
                        border-color: #3b82f6;
                    }

                    .card-header-compact:hover {
                        background-color: #374151;
                    }

                    .word-title h3 {
                        color: #f9fafb;
                    }

                    .card-content-expanded {
                        background-color: #374151;
                        border-color: #4b5563;
                    }

                    .meaning-section h4,
                    .examples-section h4,
                    .synonyms-section h4 {
                        color: #e5e7eb;
                    }

                    .meaning-section p,
                    .examples-section li {
                        color: #d1d5db;
                    }
                }
            `}</style>
        </div>
    );
};

export default WordCard;