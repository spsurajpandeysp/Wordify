"""
FastAPI Server - Clean and Organized
Main server file with proper routing
"""
import os
import uvicorn
import dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
dotenv.load_dotenv()

# Import routers from different modules
from auth import router as auth_router
from words import router as words_router
from sentence import router as sentence_router
from phrases import router as phrases_router

# Initialize FastAPI app
app = FastAPI(
    title="Wordify API",
    description="API for word definitions, sentence generation, and user authentication",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(auth_router)
app.include_router(words_router)
app.include_router(sentence_router)
app.include_router(phrases_router)

# Root endpoints
@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "Wordify API is running!",
        "version": "1.0.0",
        "endpoints": {
            "auth": "/auth/signup, /auth/login",
            "words": "/words/add, /words/my_words, /words/define, /words/delete/{word}, /words/delete_by_id/{word_id}",
            "sentences": "/sentences/frame_sentences",
            "phrases": "/phrases/add, /phrases/my_phrases, /phrases/define, /phrases/frame_sentences, /phrases/delete/{phrase}, /phrases/delete_by_id/{phrase_id}",
            "health": "/health"
        }
    }

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Wordify API",
        "gemini_api_configured": bool(os.getenv('GEMINI_API_KEY')),
        "mongo_uri_configured": bool(os.getenv('MONGO_URI'))
    }

if __name__ == "__main__":
    # Check environment variables
    print("=== Wordify API Startup ===")
    
    if not os.getenv('GEMINI_API_KEY'):
        print("WARNING: GEMINI_API_KEY environment variable not set!")
        print("Please set it with: $env:GEMINI_API_KEY='your_api_key_here' (PowerShell)")
    else:
        print("Gemini API key configured")
    
    if not os.getenv('MONGO_URI'):
        print("Using default MongoDB URI: mongodb://localhost:27017/")
    else:
        print("MongoDB URI configured")

    print("Starting Wordify API server...")
    print("Available endpoints:")
    print("   - Authentication: http://localhost:8000/auth/")
    print("   - Words: http://localhost:8000/words/")
    print("   - Sentences: http://localhost:8000/sentences/")
    print("   - Phrases: http://localhost:8000/phrases/")
    print("   - Health Check: http://localhost:8000/health")
    print("   - API Docs: http://localhost:8000/docs")
    
    uvicorn.run(
        "server_clean:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8000)),
        reload=True
    )