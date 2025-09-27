import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { phrasesAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import PhraseCard from '../components/PhraseCard';
import { useToast } from '../components/Toast';

const MyPhrasesPage = () => {
    const [phrases, setPhrases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedPhrases, setSelectedPhrases] = useState([]);
    const [generatedSentences, setGeneratedSentences] = useState(null);
    const [sentenceLoading, setSentenceLoading] = useState(false);
    const toast = useToast();

    useEffect(() => {
        fetchMyPhrases();
    }, []);

    const fetchMyPhrases = async () => {
        try {
            setLoading(true);
            const response = await phrasesAPI.getMyPhrases();
            console.log('Fetched phrases:', response.data);
            const phrasesData = response.data.phrases || [];
            console.log('Phrases data:', phrasesData);
            setPhrases(phrasesData);
        } catch (err) {
            setError('Failed to load your phrases. Please try again.');
            console.error('Error fetching phrases:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePhrase = async (phraseId, phraseText) => {
        const confirmed = await toast.confirm(
            `Are you sure you want to delete "${phraseText}" from your collection?`,
            'Delete Phrase'
        );
        
        if (!confirmed) {
            return;
        }

        try {
            console.log('Deleting phrase:', { phraseId, phraseText });
            const response = await phrasesAPI.deletePhraseById(phraseId);
            console.log('Delete response:', response);
            
            setPhrases(phrases.filter(phrase => phrase.phrase_id !== phraseId));
            toast.success(`"${phraseText}" deleted successfully`);
        } catch (err) {
            console.error('Error deleting phrase:', err);
            console.error('Error response:', err.response);
            console.error('Error message:', err.message);
            
            let errorMessage = 'Failed to delete phrase. Please try again.';
            if (err.response?.data?.detail) {
                errorMessage = err.response.data.detail;
            } else if (err.response?.status === 404) {
                errorMessage = 'Phrase not found in your collection.';
            } else if (err.response?.status === 401) {
                errorMessage = 'Please login again to delete phrases.';
            } else if (err.message) {
                errorMessage = `Error: ${err.message}`;
            }
            
            toast.error(errorMessage);
        }
    };

    const handlePhraseSelection = (phraseData) => {
        const isSelected = selectedPhrases.some(p => p.phrase === phraseData.phrase);
        if (isSelected) {
            setSelectedPhrases(selectedPhrases.filter(p => p.phrase !== phraseData.phrase));
        } else {
            // Add the first meaning for sentence generation
            const firstMeaning = phraseData.meanings && phraseData.meanings[0];
            if (firstMeaning) {
                setSelectedPhrases([...selectedPhrases, {
                    phrase: phraseData.phrase,
                    meaning: firstMeaning.definition,
                    context: firstMeaning.context || 'general'
                }]);
            }
        }
    };

    const generateSentences = async () => {
        if (selectedPhrases.length === 0) {
            setError('Please select at least one phrase to generate sentences.');
            return;
        }

        setSentenceLoading(true);
        setError('');

        try {
            const response = await phrasesAPI.frameSentences(selectedPhrases);
            setGeneratedSentences(response.data);
        } catch (err) {
            setError('Failed to generate sentences. Please try again.');
            console.error('Error generating sentences:', err);
        } finally {
            setSentenceLoading(false);
        }
    };

    const clearSelection = () => {
        setSelectedPhrases([]);
        setGeneratedSentences(null);
    };

    if (loading) {
        return <LoadingSpinner message="Loading your phrases..." />;
    }

    return (
        <div className="container">
            <div className="flex justify-between items-center mb-4">
                <h1>💬 My Phrases</h1>
                <Link to="/get-meaning" className="btn btn-primary btn-small">
                    ➕ Add New Phrase
                </Link>
            </div>

            {error && (
                <div className="alert alert-error">
                    {error}
                </div>
            )}

            {/* Selection and Sentence Generation */}
            {selectedPhrases.length > 0 && (
                <div className="card mb-4">
                    <div className="card-header">
                        <h3>🎯 Generate Sentences</h3>
                        <p className="text-muted">
                            Selected {selectedPhrases.length} phrase{selectedPhrases.length !== 1 ? 's' : ''} for sentence generation
                        </p>
                    </div>
                    <div className="card-content">
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={generateSentences}
                                className="btn btn-success"
                                disabled={sentenceLoading}
                            >
                                {sentenceLoading ? 'Generating...' : '✨ Generate Sentences'}
                            </button>
                            <button
                                onClick={clearSelection}
                                className="btn btn-secondary"
                            >
                                🗑️ Clear Selection
                            </button>
                        </div>

                        {/* Selected Phrases Preview */}
                        <div className="mb-4">
                            <strong>Selected Phrases:</strong>
                            <div className="flex gap-2 flex-wrap mt-2">
                                {selectedPhrases.map((phrase, index) => (
                                    <span key={index} className="badge">
                                        {phrase.phrase} ({phrase.context})
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Generated Sentences */}
                        {generatedSentences && (
                            <div>
                                <h4>📖 Generated Sentences:</h4>
                                <div className="grid gap-4 mt-2">
                                    {generatedSentences.sentences?.map((item, index) => (
                                        <div key={index} className="card">
                                            <div className="card-header">
                                                <h4>"{item.phrase}"</h4>
                                                <p className="text-small text-muted">
                                                    {item.context} - {item.meaning}
                                                </p>
                                            </div>
                                            <div className="card-content">
                                                {item.sentences?.map((sentence, idx) => (
                                                    <p key={idx} className="mb-2">
                                                        "{sentence}"
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Phrases List */}
            {phrases.length === 0 ? (
                <div className="empty-state">
                    <h3>💬 No phrases saved yet</h3>
                    <p>Start building your phrase collection by searching for phrase meanings!</p>
                    <Link to="/get-meaning" className="btn btn-primary mt-4">
                        🔍 Search Phrases
                    </Link>
                </div>
            ) : (
                <div className="phrases-grid">
                    {phrases.map((phrase) => (
                        <PhraseCard
                            key={phrase.phrase_id}
                            phrase={phrase.phrase}
                            meaning={phrase.meanings?.[0]?.definition || 'No definition available'}
                            examples={phrase.meanings?.[0]?.examples || []}
                            synonyms={phrase.meanings?.[0]?.similar_phrases || []}
                            isSelected={selectedPhrases.some(p => p.phrase === phrase.phrase)}
                            onSelect={() => handlePhraseSelection(phrase)}
                            onDelete={() => handleDeletePhrase(phrase.phrase_id, phrase.phrase)}
                            showActions={true}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// Add grid and badge styles  
const styles = `
.phrases-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 100%;
}

@media (min-width: 768px) {
    .phrases-grid {
        gap: 12px;
    }
}

.badge {
  display: inline-block;
  padding: 4px 8px;
  background-color: #4f46e5;
  color: white;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge-secondary {
  display: inline-block;
  padding: 4px 8px;
  background-color: #e2e8f0;
  color: #4a5568;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
    const existingStyle = document.getElementById('phrases-page-styles');
    if (!existingStyle) {
        const styleElement = document.createElement('style');
        styleElement.id = 'phrases-page-styles';
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
    }
}

export default MyPhrasesPage;