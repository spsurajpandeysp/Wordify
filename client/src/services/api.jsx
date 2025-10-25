import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // Increased to 30 seconds for AI API calls
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add authorization token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle unauthorized responses
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API calls
export const authAPI = {
    signup: (userData) => api.post('/auth/signup', userData),
    login: (credentials) => api.post('/auth/login', credentials),
};

// Words API calls
export const wordsAPI = {
    define: (word) => api.post('/words/define', { word }),
    getMyWords: () => api.get('/words/my_words'),
    addWord: (wordData) => api.post('/words/add', wordData),
    deleteWord: (word) => api.delete(`/words/delete/words/${word}`),
    deleteWordById: (wordId) => api.delete(`/words/delete_by_id/${wordId}`),
};

// Phrases API calls
export const phrasesAPI = {
    define: (phrase) => api.post('/phrases/define', { phrase }),
    getMyPhrases: () => api.get('/phrases/my_phrases'),
    addPhrase: (phraseData) => api.post('/phrases/add', phraseData),
    deletePhrase: (phrase) => api.delete(`/phrases/delete/${phrase}`),
    deletePhraseById: (phraseId) => api.delete(`/phrases/delete_by_id/${phraseId}`),
    frameSentences: (phrases) => api.post('/phrases/frame_sentences', { phrases }),
};

// Sentences API calls
export const sentencesAPI = {
    frameSentences: (words) => api.post('/sentences/frame_sentences', { words }),
};

// Health check
export const healthAPI = {
    check: () => api.get('/health'),
};

export default api;