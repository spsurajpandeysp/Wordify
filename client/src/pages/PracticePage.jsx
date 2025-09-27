import React, { useState, useEffect } from 'react';
import { wordsAPI, phrasesAPI, sentencesAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';

const PracticePage = () => {
    const [practiceMode, setPracticeMode] = useState('words'); // 'words' or 'phrases'
    const [myWords, setMyWords] = useState([]);
    const [myPhrases, setMyPhrases] = useState([]);
    const [practiceItems, setPracticeItems] = useState([]);
    const [numSentences, setNumSentences] = useState(1);
    const [generatedSentences, setGeneratedSentences] = useState(null);
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [error, setError] = useState('');
    const toast = useToast();

    useEffect(() => {
        const loadData = async () => {
            try {
                setDataLoading(true);
                const [wordsResponse, phrasesResponse] = await Promise.all([
                    wordsAPI.getMyWords(),
                    phrasesAPI.getMyPhrases()
                ]);
                
                setMyWords(wordsResponse.data.words || []);
                setMyPhrases(phrasesResponse.data.phrases || []);
            } catch (err) {
                console.error('Error fetching user data:', err);
                toast.error('Failed to load your saved words and phrases.');
            } finally {
                setDataLoading(false);
            }
        };
        
        loadData();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Helper function to check if button should be disabled
    const isButtonDisabled = () => {
        const maxAvailable = practiceMode === 'words' ? myWords.length : myPhrases.length;
        return (
            loading || 
            maxAvailable === 0 ||
            !numSentences ||
            numSentences < 1 ||
            numSentences > 20 ||
            numSentences > maxAvailable
        );
    };

    // Helper function to get tooltip message for disabled button
    const getTooltipMessage = () => {
        if (loading) return '';
        const maxAvailable = practiceMode === 'words' ? myWords.length : myPhrases.length;
        
        if (maxAvailable === 0) {
            return `No ${practiceMode} available in your collection`;
        }
        if (!numSentences) {
            return 'Please enter a number';
        }
        if (numSentences < 1) {
            return 'Number must be at least 1';
        }
        if (numSentences > 20) {
            return 'Maximum 20 items per session';
        }
        if (numSentences > maxAvailable) {
            return `You only have ${maxAvailable} ${practiceMode} available`;
        }
        return 'Invalid input';
    };

    const getRandomItems = (items, count) => {
        const shuffled = [...items].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(count, items.length));
    };

    const handleStartPractice = async () => {
        setError('');
        setGeneratedSentences(null);
        
        const sourceItems = practiceMode === 'words' ? myWords : myPhrases;
        
        if (sourceItems.length === 0) {
            setError(`You don't have any saved ${practiceMode} yet. Add some ${practiceMode} to your collection first.`);
            return;
        }

        // if (numSentences < 1 || numSentences > 20) {
        //     setError('Please enter a number between 1 and 20.');
        //     return;
        // }

        setLoading(true);

        try {
            // Get random items from user's collection
            const randomItems = getRandomItems(sourceItems, numSentences);
            setPracticeItems(randomItems);

            // Prepare simplified data for practice sentences (meanings required by backend)
            let practiceData;
            if (practiceMode === 'words') {
                practiceData = randomItems.map(word => ({
                    word: word.word,
                    meaning: word.meanings?.[0]?.definition || 'A word to practice with',
                    part_of_speech: word.meanings?.[0]?.part_of_speech || 'noun'
                }));
                
                // Generate simple sentences using words API
                const response = await sentencesAPI.frameSentences(practiceData);
                // Simplify response to show only one sentence per word
                const simplifiedData = {
                    sentences: response.data.sentences?.map(item => ({
                        word: item.word,
                        sentence: item.sentences?.[0] || `This is an example with ${item.word}.`,
                        part_of_speech: item.part_of_speech
                    })) || []
                };
                setGeneratedSentences(simplifiedData);
            } else {
                practiceData = randomItems.map(phrase => ({
                    phrase: phrase.phrase,
                    meaning: phrase.meanings?.[0]?.definition || 'A phrase to practice with',
                    context: phrase.meanings?.[0]?.context || 'general'
                }));
                
                // Generate simple sentences using phrases API
                const response = await phrasesAPI.frameSentences(practiceData);
                // Simplify response to show only one sentence per phrase
                const simplifiedData = {
                    sentences: response.data.sentences?.map(item => ({
                        phrase: item.phrase,
                        sentence: item.sentences?.[0] || `Here is an example using "${item.phrase}".`,
                        context: item.context
                    })) || []
                };
                setGeneratedSentences(simplifiedData);
            }

            toast.success(`Generated ${randomItems.length} practice sentence${randomItems.length > 1 ? 's' : ''} for daily learning! 📚`);
        } catch (err) {
            console.error('Error generating practice sentences:', err);
            setError('Failed to generate practice sentences. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setGeneratedSentences(null);
        setPracticeItems([]);
        setError('');
    };

    if (dataLoading) {
        return <LoadingSpinner message="Loading your collection..." />;
    }

    return (
        <div className="container">
            <div className="text-center mb-4">
                <h1>🎯 Practice</h1>
                <p className="text-muted">
                    Generate practice sentences from your saved words and phrases
                </p>
            </div>

            {/* Practice Settings */}
            <div className="card mb-4">
                <div className="card-header">
                    <h3>⚙️ Practice Settings</h3>
                </div>
                <div className="card-content">
                    {/* Mode Selection */}
                    <div className="mb-4">
                        <label className="form-label">Practice Mode:</label>
                        <div className="flex gap-4 mt-2">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="practiceMode"
                                    value="words"
                                    checked={practiceMode === 'words'}
                                    onChange={(e) => setPracticeMode(e.target.value)}
                                    className="mr-2"
                                />
                                📝 Words ({myWords.length} available)
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="practiceMode"
                                    value="phrases"
                                    checked={practiceMode === 'phrases'}
                                    onChange={(e) => setPracticeMode(e.target.value)}
                                    className="mr-2"
                                />
                                💬 Phrases ({myPhrases.length} available)
                            </label>
                        </div>
                    </div>

                    {/* Number Input with +/- buttons */}
                    <div className="mb-4">
                        <label htmlFor="numSentences" className="form-label">
                            Number of {practiceMode} to practice:
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                            <button
                                type="button"
                                onClick={() => {
                                    const newNum = Math.max(1, (numSentences || 1) - 1);
                                    setNumSentences(newNum);
                                }}
                                disabled={numSentences <= 1}
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '6px',
                                    border: '1px solid #d1d5db',
                                    backgroundColor: numSentences <= 1 ? '#f9fafb' : '#ffffff',
                                    color: numSentences <= 1 ? '#9ca3af' : '#374151',
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    cursor: numSentences <= 1 ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    if (numSentences > 1) {
                                        e.target.style.backgroundColor = '#f3f4f6';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (numSentences > 1) {
                                        e.target.style.backgroundColor = '#ffffff';
                                    }
                                }}
                            >
                                −
                            </button>
                            <input
                                type="text"
                                id="numSentences"
                                value={numSentences || ''}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === '') {
                                        setNumSentences('');
                                    } else {
                                        const num = parseInt(value);
                                        if (isNaN(num)) {
                                            setNumSentences('');
                                            return;
                                        }
                                        
                                        const maxAvailable = practiceMode === 'words' ? myWords.length : myPhrases.length;
                                        
                                        // Check if number exceeds available count
                                        if (num > maxAvailable) {
                                            toast.error(`You only have ${maxAvailable} ${practiceMode} available!`);
                                            setNumSentences(maxAvailable || 1);
                                            return;
                                        }
                                        
                                        // Check if number exceeds maximum limit
                                        if (num > 20) {
                                            toast.error('Maximum 20 items allowed per practice session!');
                                            setNumSentences(20);
                                            return;
                                        }
                                        
                                        setNumSentences(Math.max(1, num));
                                    }
                                }}
                                className="form-input"
                                style={{ 
                                    width: '60px', 
                                    textAlign: 'center',
                                    fontSize: '16px',
                                    fontWeight: '500'
                                }}
                                placeholder="1"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    const maxAvailable = practiceMode === 'words' ? myWords.length : myPhrases.length;
                                    const maxAllowed = Math.min(20, maxAvailable);
                                    const newNum = Math.min(maxAllowed, (numSentences || 1) + 1);
                                    
                                    if ((numSentences || 1) >= maxAvailable) {
                                        toast.error(`You only have ${maxAvailable} ${practiceMode} available!`);
                                        return;
                                    }
                                    
                                    if ((numSentences || 1) >= 20) {
                                        toast.error('Maximum 20 items allowed per practice session!');
                                        return;
                                    }
                                    
                                    setNumSentences(newNum);
                                }}
                                disabled={numSentences >= Math.min(20, practiceMode === 'words' ? myWords.length : myPhrases.length)}
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '6px',
                                    border: '1px solid #d1d5db',
                                    backgroundColor: numSentences >= Math.min(20, practiceMode === 'words' ? myWords.length : myPhrases.length) ? '#f9fafb' : '#ffffff',
                                    color: numSentences >= Math.min(20, practiceMode === 'words' ? myWords.length : myPhrases.length) ? '#9ca3af' : '#374151',
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    cursor: numSentences >= Math.min(20, practiceMode === 'words' ? myWords.length : myPhrases.length) ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    if (numSentences < Math.min(20, practiceMode === 'words' ? myWords.length : myPhrases.length)) {
                                        e.target.style.backgroundColor = '#f3f4f6';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (numSentences < Math.min(20, practiceMode === 'words' ? myWords.length : myPhrases.length)) {
                                        e.target.style.backgroundColor = '#ffffff';
                                    }
                                }}
                            >
                                +
                            </button>
                        </div>
                        <p className="text-small text-muted mt-1">
                            Maximum: {Math.min(
                                20, 
                                practiceMode === 'words' ? myWords.length : myPhrases.length
                            )}
                            {(practiceMode === 'words' ? myWords.length === 0 : myPhrases.length === 0) && (
                                <span className="text-warning"> - No {practiceMode} available!</span>
                            )}
                        </p>
                    </div>

                    {/* Start Button */}
                    <div className="flex gap-2">
                        <div className="tooltip-container">
                            <button
                                onClick={isButtonDisabled() ? (e) => e.preventDefault() : handleStartPractice}
                                disabled={isButtonDisabled()}
                                className={`btn ${isButtonDisabled() ? 'btn-disabled' : 'btn-primary'}`}
                            >
                                {loading ? (
                                    '⏳ Generating...'
                                ) : isButtonDisabled() ? (
                                    '🚀 Start Practice'
                                ) : (
                                    '🚀 Start Practice'
                                )}
                            </button>
                            {isButtonDisabled() && !loading && (
                                <div className="tooltip">
                                    {getTooltipMessage()}
                                </div>
                            )}
                        </div>
                        {generatedSentences && (
                            <button
                                onClick={handleReset}
                                className="btn btn-secondary"
                            >
                                🔄 New Practice
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="alert alert-error mb-4">
                    {error}
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="text-center py-8">
                    <LoadingSpinner message="Generating practice sentences..." />
                </div>
            )}

            {/* Generated Practice Sentences */}
            {generatedSentences && !loading && (
                <div className="card">
                    <div className="card-header">
                        <h3>� Daily Practice Sentences</h3>
                        <p className="text-muted">
                            Simple, easy-to-grasp sentences for daily learning • {practiceItems.length} {practiceMode}
                        </p>
                    </div>
                    <div className="card-content">
                        <div className="practice-sentences-grid">
                            {generatedSentences.sentences?.map((item, index) => (
                                <div key={index} className="practice-sentence-card">
                                    <div className="sentence-header">
                                        <span className="sentence-number">#{index + 1}</span>
                                        <span className="word-highlight">
                                            {practiceMode === 'words' ? item.word : item.phrase}
                                        </span>
                                    </div>
                                    <div className="sentence-content">
                                        <p className="practice-sentence">
                                            "{item.sentence}"
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Practice Stats */}
                        <div className="practice-stats mt-6 p-4 bg-light rounded">
                            <h4>📊 Practice Session Stats</h4>
                            <div className="stats-grid">
                                <div className="stat-item">
                                    <span className="stat-label">Items Practiced:</span>
                                    <span className="stat-value">{practiceItems.length}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Mode:</span>
                                    <span className="stat-value">{practiceMode}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Total Available:</span>
                                    <span className="stat-value">
                                        {practiceMode === 'words' ? myWords.length : myPhrases.length}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!generatedSentences && !loading && (
                <div className="empty-state">
                    <h3>🎯 Ready to Practice?</h3>
                    <p>
                        Select your practice mode and number of items above, then click "Start Practice" 
                        to generate random sentences from your saved collection.
                    </p>
                    {(myWords.length === 0 && myPhrases.length === 0) && (
                        <div className="mt-4">
                            <p className="text-muted">
                                You don't have any saved words or phrases yet. 
                                Start by adding some to your collection!
                            </p>
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
                .practice-sentences-grid {
                    display: grid;
                    gap: 16px;
                    margin-top: 20px;
                }

                .practice-sentence-card {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 16px;
                    padding: 24px;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }

                .practice-sentence-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
                }

                .sentence-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 16px;
                }

                .sentence-number {
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: 600;
                }

                .word-highlight {
                    background: rgba(255, 255, 255, 0.15);
                    color: white;
                    padding: 6px 16px;
                    border-radius: 20px;
                    font-weight: 600;
                    font-size: 16px;
                }

                .sentence-content {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 16px;
                }

                .practice-sentence {
                    color: white;
                    font-size: 18px;
                    line-height: 1.6;
                    margin: 0;
                    font-style: italic;
                }

                .practice-meta {
                    display: flex;
                    gap: 8px;
                }

                .practice-meaning {
                    color: #4a5568;
                    margin-bottom: 16px;
                    font-size: 14px;
                }

                .practice-sentences {
                    color: #2d3748;
                }

                .sentence-list {
                    margin: 8px 0;
                    padding-left: 16px;
                }

                .sentence-item {
                    margin-bottom: 8px;
                    color: #4a5568;
                    font-style: italic;
                    line-height: 1.5;
                }

                .practice-stats {
                    background: #f0f9ff;
                    border: 1px solid #bae6fd;
                    border-radius: 8px;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 16px;
                    margin-top: 12px;
                }

                .stat-item {
                    display: flex;
                    flex-direction: column;
                    text-align: center;
                }

                .stat-label {
                    font-size: 12px;
                    color: #6b7280;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    font-weight: 500;
                }

                .stat-value {
                    font-size: 18px;
                    font-weight: 600;
                    color: #1f2937;
                    margin-top: 4px;
                }

                .badge {
                    display: inline-block;
                    padding: 4px 8px;
                    background-color: #3b82f6;
                    color: white;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 500;
                }

                /* Tooltip Styles */
                .tooltip-container {
                    position: relative;
                    display: inline-block;
                }

                .tooltip {
                    position: absolute;
                    bottom: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    margin-bottom: 8px;
                    padding: 12px 16px;
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                    color: white;
                    border-radius: 12px;
                    font-size: 14px;
                    font-weight: 500;
                    white-space: nowrap;
                    box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease;
                    z-index: 1000;
                    pointer-events: none;
                }

                .tooltip::after {
                    content: '';
                    position: absolute;
                    top: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    border: 6px solid transparent;
                    border-top-color: #dc2626;
                }

                .tooltip-container:hover .tooltip {
                    opacity: 1;
                    visibility: visible;
                    transform: translateX(-50%) translateY(-4px);
                }

                .tooltip-container .btn-disabled:hover {
                    cursor: not-allowed !important;
                }

                @media (max-width: 768px) {
                    .practice-header {
                        flex-direction: column;
                        gap: 8px;
                    }

                    .practice-term {
                        font-size: 16px;
                    }

                    .stats-grid {
                        grid-template-columns: 1fr;
                        gap: 12px;
                    }
                }
            `}</style>
        </div>
    );
};

export default PracticePage;