import React, { useState } from 'react';
import { wordsAPI, phrasesAPI, sentencesAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';

const GetMeaningPage = () => {
    const [searchType, setSearchType] = useState('word'); // 'word' or 'phrase'
    const [searchTerm, setSearchTerm] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [saveLoading, setSaveLoading] = useState(false);
    const [sentences, setSentences] = useState(null);
    const [sentenceLoading, setSentenceLoading] = useState(false);
    const toast = useToast();

    const handleSearch = async (e) => {
        e.preventDefault();

        if (!searchTerm.trim()) {
            setError('Please enter a word or phrase to search.');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);
        setSentences(null);

        try {
            let response;
            if (searchType === 'word') {
                response = await wordsAPI.define(searchTerm.trim());
            } else {
                response = await phrasesAPI.define(searchTerm.trim());
            }

            setResult({
                type: searchType,
                term: searchTerm.trim(),
                data: response.data
            });
        } catch (err) {
            let errorMessage = `Failed to get ${searchType} meaning. Please try again.`;
            
            if (err.code === 'ECONNABORTED') {
                errorMessage = `Request timed out. The AI service might be busy. Please try again in a moment.`;
            } else if (err.response?.status === 500) {
                errorMessage = `Server error occurred. Please try again later.`;
            } else if (err.response?.data?.detail) {
                errorMessage = err.response.data.detail;
            }
            
            setError(errorMessage);
            console.error(`Error getting ${searchType} meaning:`, err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!result) return;

        setSaveLoading(true);
        setError('');

        try {
            if (result.type === 'word') {
                await wordsAPI.addWord({
                    word: result.term,
                    meanings: result.data.meanings || [],
                    sentences: [],
                    part_of_speech: result.data.meanings?.map(m => m.part_of_speech) || [],
                    synonyms: result.data.meanings?.flatMap(m => m.synonyms || []) || []
                });
            } else {
                await phrasesAPI.addPhrase({
                    phrase: result.term,
                    meanings: result.data.meanings || [],
                    examples: result.data.meanings?.flatMap(m => m.examples || []) || [],
                    contexts: result.data.meanings?.map(m => m.context) || [],
                    similar_phrases: result.data.meanings?.flatMap(m => m.similar_phrases || []) || []
                });
            }

            toast.success(`${result.type === 'word' ? 'Word' : 'Phrase'} saved successfully!`);
        } catch (err) {
            if (err.response?.status === 409) {
                toast.warning(`This ${result.type} is already in your collection.`);
            } else {
                toast.error(`Failed to save ${result.type}. Please try again.`);
            }
            console.error(`Error saving ${result.type}:`, err);
        } finally {
            setSaveLoading(false);
        }
    };

    const generateSentences = async () => {
        if (!result) return;

        setSentenceLoading(true);
        setError('');

        try {
            let response;
            if (result.type === 'word') {
                // Use the first meaning for sentence generation
                const firstMeaning = result.data.meanings?.[0];
                if (firstMeaning) {
                    const wordData = [{
                        word: result.term,
                        meaning: firstMeaning.definition,
                        part_of_speech: firstMeaning.part_of_speech
                    }];
                    response = await sentencesAPI.frameSentences(wordData);
                }
            } else {
                // Use the first meaning for phrase sentence generation
                const firstMeaning = result.data.meanings?.[0];
                if (firstMeaning) {
                    const phraseData = [{
                        phrase: result.term,
                        meaning: firstMeaning.definition,
                        context: firstMeaning.context || 'general'
                    }];
                    response = await phrasesAPI.frameSentences(phraseData);
                }
            }

            setSentences(response?.data || null);
        } catch (err) {
            setError('Failed to generate sentences. Please try again.');
            console.error('Error generating sentences:', err);
        } finally {
            setSentenceLoading(false);
        }
    };

    const handleReset = () => {
        setSearchTerm('');
        setResult(null);
        setError('');
        setSentences(null);
    };

    return (
        <div className="container">
            <div className="text-center mb-4">
                <h1>🔍 Get Meaning</h1>
                <p className="text-muted">
                    Search for word or phrase definitions powered by AI
                </p>
            </div>

            {/* Search Form */}
            <div className="card mb-4">
                <form onSubmit={handleSearch}>
                    <div className="form-group">
                        <label className="form-label">Search Type</label>
                        <div className="flex gap-4 mb-4">
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="searchType"
                                    value="word"
                                    checked={searchType === 'word'}
                                    onChange={(e) => setSearchType(e.target.value)}
                                />
                                📝 Word
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="searchType"
                                    value="phrase"
                                    checked={searchType === 'phrase'}
                                    onChange={(e) => setSearchType(e.target.value)}
                                />
                                💬 Phrase
                            </label>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="searchTerm" className="form-label">
                            {searchType === 'word' ? 'Enter Word' : 'Enter Phrase'}
                        </label>
                        <input
                            type="text"
                            id="searchTerm"
                            className="form-input"
                            placeholder={
                                searchType === 'word'
                                    ? 'e.g., happy, beautiful, run...'
                                    : 'e.g., break the ice, piece of cake...'
                            }
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || !searchTerm.trim()}
                        >
                            {loading ? 'Searching...' : '🔍 Search'}
                        </button>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="btn btn-secondary"
                            disabled={loading}
                        >
                            🔄 Reset
                        </button>
                    </div>
                </form>
            </div>

            {/* Loading State */}
            {loading && (
                <LoadingSpinner message={`Getting ${searchType} meaning...`} />
            )}

            {/* Error State */}
            {error && (
                <div className="alert alert-error">
                    {error}
                </div>
            )}

            {/* Search Results */}
            {result && (
                <div className="card mb-4">
                    <div className="card-header">
                        <div className="flex justify-between items-center">
                            <h2>
                                {result.type === 'word' ? '📝' : '💬'} {result.term}
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={generateSentences}
                                    className="btn btn-success btn-small"
                                    disabled={sentenceLoading}
                                >
                                    {sentenceLoading ? 'Generating...' : '✨ Frame Sentences'}
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="btn btn-primary btn-small"
                                    disabled={saveLoading}
                                >
                                    {saveLoading ? 'Saving...' : '💾 Save'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="card-content">
                        {result.data.meanings && result.data.meanings.map((meaning, index) => (
                            <div key={index} className="mb-4 p-4" style={{ backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                                <div className="flex justify-between items-center mb-2">
                                    <strong>
                                        {result.type === 'word'
                                            ? meaning.part_of_speech
                                            : `Context: ${meaning.context || 'General'}`
                                        }
                                    </strong>
                                </div>

                                <p className="mb-3" style={{ fontSize: '1.1rem' }}>
                                    {meaning.definition}
                                </p>

                                {meaning.examples && meaning.examples.length > 0 && (
                                    <div className="mb-3">
                                        <strong>📖 Examples:</strong>
                                        <ul className="list mt-2">
                                            {meaning.examples.map((example, idx) => (
                                                <li key={idx} className="text-muted mb-1">
                                                    "{example}"
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {result.type === 'word' && meaning.synonyms && meaning.synonyms.length > 0 && (
                                    <div>
                                        <strong>🔄 Synonyms:</strong>
                                        <div className="flex gap-2 flex-wrap mt-2">
                                            {meaning.synonyms.map((synonym, idx) => (
                                                <span key={idx} className="badge-secondary">
                                                    {synonym}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {result.type === 'phrase' && meaning.similar_phrases && meaning.similar_phrases.length > 0 && (
                                    <div>
                                        <strong>🔄 Similar Phrases:</strong>
                                        <div className="flex gap-2 flex-wrap mt-2">
                                            {meaning.similar_phrases.map((similar, idx) => (
                                                <span key={idx} className="badge-secondary">
                                                    "{similar}"
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Generated Sentences */}
            {sentences && (
                <div className="card">
                    <div className="card-header">
                        <h3>📖 Example Sentences</h3>
                    </div>
                    <div className="card-content">
                        {sentences.sentences?.map((item, index) => (
                            <div key={index} className="mb-4 p-4" style={{ backgroundColor: '#eef2ff', borderRadius: '8px' }}>
                                <div className="card-header">
                                    <h4>
                                        {result.type === 'word'
                                            ? `${item.word} (${item.part_of_speech})`
                                            : `"${item.phrase}" (${item.context})`
                                        }
                                    </h4>
                                    <p className="text-small text-muted">
                                        {item.meaning}
                                    </p>
                                </div>
                                <div className="mt-3">
                                    {item.sentences?.map((sentence, idx) => (
                                        <p key={idx} className="mb-2" style={{ fontStyle: 'italic' }}>
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
    );
};

// Add badge styles
const styles = `
.badge-secondary {
  display: inline-block;
  padding: 4px 8px;
  background-color: #e2e8f0;
  color: #4a5568;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

input[type="radio"] {
  width: 16px;
  height: 16px;
  accent-color: #4f46e5;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
}

export default GetMeaningPage;