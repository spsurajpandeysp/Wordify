import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { wordsAPI, sentencesAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import WordCard from '../components/WordCard';
import { useToast } from '../components/Toast';

const MyWordsPage = () => {
    const [words, setWords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedWords, setSelectedWords] = useState([]);
    const [generatedSentences, setGeneratedSentences] = useState(null);
    const [sentenceLoading, setSentenceLoading] = useState(false);
    const toast = useToast();

    useEffect(() => {
        fetchMyWords();
    }, []);

    const fetchMyWords = async () => {
        try {
            setLoading(true);
            const response = await wordsAPI.getMyWords();
            console.log('Fetched words:', response.data);
            const wordsData = response.data.words || [];
            console.log('Words data:', wordsData);
            setWords(wordsData);
        } catch (err) {
            setError('Failed to load your words. Please try again.');
            console.error('Error fetching words:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteWord = async (wordId, wordText) => {
        const confirmed = await toast.confirm(
            `Are you sure you want to delete "${wordText}" from your collection?`,
            'Delete Word'
        );
        
        if (!confirmed) {
            return;
        }

        try {
            console.log('Deleting word:', { wordId, wordText });
            const response = await wordsAPI.deleteWordById(wordId);
            console.log('Delete response:', response);
            
            setWords(words.filter(word => word.word_id !== wordId));
            toast.success(`"${wordText}" deleted successfully`);
        } catch (err) {
            console.error('Error deleting word:', err);
            console.error('Error response:', err.response);
            console.error('Error message:', err.message);
            
            let errorMessage = 'Failed to delete word. Please try again.';
            if (err.response?.data?.detail) {
                errorMessage = err.response.data.detail;
            } else if (err.response?.status === 404) {
                errorMessage = 'Word not found in your collection.';
            } else if (err.response?.status === 401) {
                errorMessage = 'Please login again to delete words.';
            } else if (err.message) {
                errorMessage = `Error: ${err.message}`;
            }
            
            toast.error(errorMessage);
        }
    };

    const handleWordSelection = (wordData) => {
        const isSelected = selectedWords.some(w => w.word === wordData.word);
        if (isSelected) {
            setSelectedWords(selectedWords.filter(w => w.word !== wordData.word));
        } else {
            // Add the first meaning for sentence generation
            const firstMeaning = wordData.meanings && wordData.meanings[0];
            if (firstMeaning) {
                setSelectedWords([...selectedWords, {
                    word: wordData.word,
                    meaning: firstMeaning.definition,
                    part_of_speech: firstMeaning.part_of_speech
                }]);
            }
        }
    };

    const generateSentences = async () => {
        if (selectedWords.length === 0) {
            setError('Please select at least one word to generate sentences.');
            return;
        }

        setSentenceLoading(true);
        setError('');

        try {
            const response = await sentencesAPI.frameSentences(selectedWords);
            setGeneratedSentences(response.data);
        } catch (err) {
            setError('Failed to generate sentences. Please try again.');
            console.error('Error generating sentences:', err);
        } finally {
            setSentenceLoading(false);
        }
    };

    const clearSelection = () => {
        setSelectedWords([]);
        setGeneratedSentences(null);
    };

    if (loading) {
        return <LoadingSpinner message="Loading your words..." />;
    }

    return (
        <div className="container">
            <div className="flex justify-between items-center mb-4">
                <h1>📝 My Words</h1>
                <Link to="/get-meaning" className="btn btn-primary btn-small">
                    ➕ Add New Word
                </Link>
            </div>

            {error && (
                <div className="alert alert-error">
                    {error}
                </div>
            )}

            {/* Selection and Sentence Generation */}
            {selectedWords.length > 0 && (
                <div className="card mb-4">
                    <div className="card-header">
                        <h3>🎯 Generate Sentences</h3>
                        <p className="text-muted">
                            Selected {selectedWords.length} word{selectedWords.length !== 1 ? 's' : ''} for sentence generation
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

                        {/* Selected Words Preview */}
                        <div className="mb-4">
                            <strong>Selected Words:</strong>
                            <div className="flex gap-2 flex-wrap mt-2">
                                {selectedWords.map((word, index) => (
                                    <span key={index} className="badge">
                                        {word.word} ({word.part_of_speech})
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
                                                <h4>{item.word}</h4>
                                                <p className="text-small text-muted">
                                                    {item.part_of_speech} - {item.meaning}
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

            {/* Words List */}
            {words.length === 0 ? (
                <div className="empty-state">
                    <h3>📚 No words saved yet</h3>
                    <p>Start building your vocabulary by searching for word meanings!</p>
                    <Link to="/get-meaning" className="btn btn-primary mt-4">
                        🔍 Search Words
                    </Link>
                </div>
            ) : (
                <div className="words-grid">
                    {words.map((word) => (
                        <WordCard
                            key={word.word_id}
                            word={word.word}
                            meaning={word.meanings?.[0]?.definition || 'No definition available'}
                            examples={word.meanings?.[0]?.examples || []}
                            synonyms={word.meanings?.[0]?.synonyms || []}
                            isSelected={selectedWords.some(w => w.word === word.word)}
                            onSelect={() => handleWordSelection(word)}
                            onDelete={() => handleDeleteWord(word.word_id, word.word)}
                            showActions={true}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// Add badge styles
const styles = `
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
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
}

// Add grid styles for better layout
const gridStyles = `
.words-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 100%;
}

@media (min-width: 768px) {
    .words-grid {
        gap: 12px;
    }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
    const existingStyle = document.getElementById('words-grid-styles');
    if (!existingStyle) {
        const styleElement = document.createElement('style');
        styleElement.id = 'words-grid-styles';
        styleElement.textContent = gridStyles;
        document.head.appendChild(styleElement);
    }
}

export default MyWordsPage;