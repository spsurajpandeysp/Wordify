import os
import json
import requests
import dotenv
dotenv.load_dotenv()
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from werkzeug.security import generate_password_hash, check_password_hash

from security import (
    generate_token, 
    verify_token, 
    create_user, 
    get_user_by_email, 
    update_user_login
)
from words import call_gemini_for_definitions, extract_definitions_from_response_for_words, router as words_router
from sentence import call_gemini_for_sentences, extract_sentences_from_response, router as sentence_router
from phrases import (
    call_gemini_for_phrase_meanings, 
    extract_phrase_meanings_from_response,
    call_gemini_for_phrase_sentences,
    extract_phrase_sentences_from_response,
    router as phrases_router
)

from pymongo import MongoClient
from bson import ObjectId

# MongoDB connection setup
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI)
db = client["dictionary_app"]
words_collection = db["words"]
phrases_collection = db["phrases"]

app = FastAPI(title="Wordify API", description="API for word definitions and sentence generation")

# Include routers
app.include_router(words_router)
app.include_router(phrases_router)
app.include_router(sentence_router)

# Pydantic Models
class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str = ""

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class WordRequest(BaseModel):
    word: str

class WordData(BaseModel):
    word: str
    meaning: str
    part_of_speech: str

class SentenceRequest(BaseModel):
    words: List[WordData]

class AddWordRequest(BaseModel):
    # user_id: str
    word: str
    meanings: Optional[List[dict]] = []
    sentences: Optional[List[str]] = []
    part_of_speech: Optional[List[str]] = []
    synonyms: Optional[List[str]] = []

# Phrase Models
class PhraseRequest(BaseModel):
    phrase: str

class AddPhraseRequest(BaseModel):
    phrase: str
    meanings: Optional[List[dict]] = []
    examples: Optional[List[str]] = []
    contexts: Optional[List[str]] = []
    similar_phrases: Optional[List[str]] = []

class PhraseData(BaseModel):
    phrase: str
    meaning: str
    context: str

class PhraseSentenceRequest(BaseModel):
    phrases: List[PhraseData]

@app.post("/add_word")
async def add_word_manually(word_data: AddWordRequest, current_user_id: str = Depends(verify_token)):
    """Add a word to user's collection"""
    try:
        word = word_data.word.strip().lower()
        user_id = current_user_id["user_id"]
        if not word:
            raise HTTPException(status_code=400, detail="Word cannot be empty")
        
        # Check if word already exists
        existing_word = words_collection.find_one({
            "user_id": ObjectId(user_id),
            "word": word
        })
        
        if existing_word:
            raise HTTPException(status_code=409, detail="Word already exists in your collection")
        
        # Create word data
        word_document = {
            "user_id": ObjectId(user_id),
            "word": word,
            "meanings": word_data.meanings,
            "sentences": word_data.sentences,
            "part_of_speech": word_data.part_of_speech,
            "synonyms": word_data.synonyms,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = words_collection.insert_one(word_document)
        
        return {
            "message": "Word added successfully",
            "word_id": str(result.inserted_id),
            "word": word
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add word: {str(e)}")

from fastapi import FastAPI, HTTPException, Depends
from bson import ObjectId
from datetime import datetime

app = FastAPI(title="Wordify API", description="API for word definitions and sentence generation")

@app.get("/my_words")
async def get_my_words(current_user: dict = Depends(verify_token)):
    """
    Fetch all words for the logged-in user with meanings, sentences, part of speech, and synonyms.
    """
    try:
        user_id = current_user["user_id"]

        # Fetch all words for this user
        words_cursor = words_collection.find({"user_id": ObjectId(user_id)}).sort("updated_at", -1)

        # Format response
        words_list = []
        for word in words_cursor:
            words_list.append({
                "word_id": str(word["_id"]),
                "word": word["word"],
                "meanings": word.get("meanings", []),
                "sentences": word.get("sentences", []),
                "part_of_speech": word.get("part_of_speech", []),
                "synonyms": word.get("synonyms", []),
                "created_at": word.get("created_at"),
                "updated_at": word.get("updated_at")
            })

        return {
            "words": words_list,
            "total_words": len(words_list)
        }

    except Exception as e:
        print(f"Error fetching user words: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch words: {str(e)}")
    
@app.post("/signup")
def signup(request: SignupRequest):
    """User registration"""
    try:
        email = request.email.lower()
        password = request.password
        name = request.name.strip()
        
        # Check password length
        if len(password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")
        
        # Check if user already exists
        if get_user_by_email(email):
            raise HTTPException(status_code=409, detail="User with this email already exists")
        
        # Create new user

        user_id = create_user(email, password, name)
        
        # Generate JWT token
        token = generate_token(user_id)
        print(f'User {email} created successfully with ID {user_id}', token)
        return {
            "message": "User created successfully",
            "user_id": str(user_id),
            "email": email,
            "name": name,
            "token": token
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f'Signup error: {e}')
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.post("/login")
def login(request: LoginRequest):
    """User login"""
    try:
        email = request.email.lower()
        password = request.password
        
        # Find user
        user = get_user_by_email(email)
        
        if not user or not check_password_hash(user['password'], password):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Generate JWT token
        token = generate_token(user['_id'])
        
        # Update last login
        update_user_login(user['_id'])
        
        return {
            "message": "Login successful",
            "user_id": str(user['_id']),
            "email": user['email'],
            "name": user.get('name', ''),
            "token": token
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f'Login error: {e}')
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")


@app.post("/define")
async def define_word(request: WordRequest, current_user_id: str = Depends(verify_token)):
    """Get word definitions and save to user's collection"""
    word = request.word.strip().lower()
    
    if not word:
        raise HTTPException(status_code=400, detail="Word cannot be empty")
    
    try:
        print(f'Getting definitions for word: {word}')
        
        # Call Gemini API to get definitions
        response_text = call_gemini_for_definitions(word)
        
        # Extract definitions from the response
        definitions_data = extract_definitions_from_response_for_words(response_text)
        
        # Prepare data for add_word function
        meanings = definitions_data.get("meanings", [])
        part_of_speech = [meaning.get('part_of_speech', '') for meaning in meanings]
        synonyms = []
        for meaning in meanings:
            synonyms.extend(meaning.get('synonyms', []))
        synonyms = list(set(synonyms))  # Remove duplicates
        
        # Create AddWordRequest object
        word_data = AddWordRequest(
            word=word,
            meanings=meanings,
            sentences=[],
            part_of_speech=part_of_speech,
            synonyms=synonyms
        )
        
        # Call add_word function directly
        try:
            add_result = await add_word_manually(word_data, current_user_id)
            save_status = "saved"
            word_id = add_result["word_id"]
        except HTTPException as e:
            if e.status_code == 409:  # Word already exists
                save_status = "already_exists"
                word_id = None
            else:
                save_status = "failed"
                word_id = None
        
        # Return the response
        return {
            "word": word,
            "meanings": meanings,
            "total_meanings": len(meanings),
            "source": "gemini_api",
            "word_id": word_id,
            "save_status": save_status
        }
        
    except Exception as err:
        print(f'Server error: {err}')
        raise HTTPException(status_code=500, detail=f"Server error: {str(err)}")
    
@app.post("/frame_sentences")
def frame_sentences(request: SentenceRequest):
    """Main endpoint to frame sentences using array of words with meanings and parts of speech"""
    words_array = request.words
    
    # Validate that words_array is not empty
    if len(words_array) == 0:
        raise HTTPException(status_code=400, detail="Words must be a non-empty array")
    
    try:
        print(f'Framing sentences for {len(words_array)} words')
        
        # Convert Pydantic models to dict for the API call
        words_dict_array = [word.dict() for word in words_array]
        
        # Call Gemini API to get sentences
        response_text = call_gemini_for_sentences(words_dict_array)
        
        print('Sentences fetched successfully, processing response...')
        
        # Extract sentences from the response
        sentences_data = extract_sentences_from_response(response_text)
        
        print(f'Extracted sentences: {json.dumps(sentences_data, indent=2)}')
        
        # Return the structured response
        return {
            "words_processed": len(words_array),
            "sentences": sentences_data.get("sentences", []),
            "total_words": len(sentences_data.get("sentences", [])),
            "source": "gemini_api"
        }
        
    except Exception as err:
        print(f'Server error: {err}')
        raise HTTPException(status_code=500, detail=f"Server error: {str(err)}")

@app.delete("/delete/{word}")
async def delete_word(word: str, current_user: dict = Depends(verify_token)):
    """Delete a specific word from user's collection"""
    try:
        user_id = current_user["user_id"]
        word_lower = word.strip().lower()
        
        if not word_lower:
            raise HTTPException(status_code=400, detail="Word cannot be empty")
        
        # Find and delete the word from user's collection  
        result = words_collection.delete_one({
            "user_id": ObjectId(user_id),
            "word": word_lower
        })
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=404, 
                detail=f"Word '{word}' not found in your collection"
            )
        
        return {
            "message": f"Word '{word}' deleted successfully",
            "deleted_word": word,
            "deleted_count": result.deleted_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting word: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to delete word: {str(e)}"
        )

@app.delete("/delete_by_id/{word_id}")
async def delete_word_by_id(word_id: str, current_user: dict = Depends(verify_token)):
    """Delete a word by its ID from user's collection"""
    try:
        user_id = current_user["user_id"]
        
        # Validate ObjectId format
        try:
            word_object_id = ObjectId(word_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid word ID format")
        
        # Find the word first to get the word name for response
        word_doc = words_collection.find_one({
            "_id": word_object_id,
            "user_id": ObjectId(user_id)
        })
        
        if not word_doc:
            raise HTTPException(
                status_code=404, 
                detail="Word not found in your collection"
            )
        
        # Delete the word
        result = words_collection.delete_one({
            "_id": word_object_id,
            "user_id": ObjectId(user_id)
        })
        
        return {
            "message": f"Word '{word_doc['word']}' deleted successfully",
            "deleted_word": word_doc['word'],
            "deleted_word_id": word_id,
            "deleted_count": result.deleted_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting word by ID: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to delete word: {str(e)}"
        )

# ===== PHRASE ENDPOINTS =====

@app.post("/phrases/add")
async def add_phrase_manually(phrase_data: AddPhraseRequest, current_user_id: str = Depends(verify_token)):
    """Add a phrase to user's collection"""
    try:
        phrase = phrase_data.phrase.strip().lower()
        user_id = current_user_id["user_id"]
        
        if not phrase:
            raise HTTPException(status_code=400, detail="Phrase cannot be empty")
        
        # Check if phrase already exists
        existing_phrase = phrases_collection.find_one({
            "user_id": ObjectId(user_id),
            "phrase": phrase
        })
        
        if existing_phrase:
            raise HTTPException(status_code=409, detail="Phrase already exists in your collection")
        
        # Create phrase data
        phrase_document = {
            "user_id": ObjectId(user_id),
            "phrase": phrase,
            "meanings": phrase_data.meanings,
            "examples": phrase_data.examples,
            "contexts": phrase_data.contexts,
            "similar_phrases": phrase_data.similar_phrases,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = phrases_collection.insert_one(phrase_document)
        
        return {
            "message": "Phrase added successfully",
            "phrase_id": str(result.inserted_id),
            "phrase": phrase
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add phrase: {str(e)}")

@app.get("/phrases/my_phrases")
async def get_my_phrases(current_user: dict = Depends(verify_token)):
    """
    Fetch all phrases for the logged-in user with meanings, examples, contexts, and similar phrases.
    """
    try:
        user_id = current_user["user_id"]

        # Fetch all phrases for this user
        phrases_cursor = phrases_collection.find({"user_id": ObjectId(user_id)}).sort("updated_at", -1)

        # Format response
        phrases_list = []
        for phrase in phrases_cursor:
            phrases_list.append({
                "phrase_id": str(phrase["_id"]),
                "phrase": phrase["phrase"],
                "meanings": phrase.get("meanings", []),
                "examples": phrase.get("examples", []),
                "contexts": phrase.get("contexts", []),
                "similar_phrases": phrase.get("similar_phrases", []),
                "created_at": phrase.get("created_at"),
                "updated_at": phrase.get("updated_at")
            })

        return {
            "phrases": phrases_list,
            "total_phrases": len(phrases_list)
        }

    except Exception as e:
        print(f"Error fetching user phrases: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch phrases: {str(e)}")

@app.post("/phrases/define")
async def define_phrase(request: PhraseRequest, current_user_id: str = Depends(verify_token)):
    """Get phrase meanings and save to user's collection"""
    phrase = request.phrase.strip().lower()
    
    if not phrase:
        raise HTTPException(status_code=400, detail="Phrase cannot be empty")
    
    try:
        print(f'Getting meanings for phrase: {phrase}')
        
        # Call Gemini API to get phrase meanings
        response_text = call_gemini_for_phrase_meanings(phrase)
        
        # Extract meanings from the response
        meanings_data = extract_phrase_meanings_from_response(response_text)
        
        # Prepare data for add_phrase function
        meanings = meanings_data.get("meanings", [])
        contexts = [meaning.get('context', '') for meaning in meanings]
        similar_phrases = []
        examples = []
        
        for meaning in meanings:
            similar_phrases.extend(meaning.get('similar_phrases', []))
            examples.extend(meaning.get('examples', []))
        
        similar_phrases = list(set(similar_phrases))  # Remove duplicates
        examples = list(set(examples))  # Remove duplicates
        
        # Create AddPhraseRequest object
        phrase_data = AddPhraseRequest(
            phrase=phrase,
            meanings=meanings,
            examples=examples,
            contexts=contexts,
            similar_phrases=similar_phrases
        )
        
        # Call add_phrase function directly
        try:
            add_result = await add_phrase_manually(phrase_data, current_user_id)
            save_status = "saved"
            phrase_id = add_result["phrase_id"]
        except HTTPException as e:
            if e.status_code == 409:  # Phrase already exists
                save_status = "already_exists"
                phrase_id = None
            else:
                save_status = "failed"
                phrase_id = None
        
        # Return the response
        return {
            "phrase": phrase,
            "meanings": meanings,
            "total_meanings": len(meanings),
            "source": "gemini_api",
            "phrase_id": phrase_id,
            "save_status": save_status
        }
        
    except Exception as err:
        print(f'Server error: {err}')
        raise HTTPException(status_code=500, detail=f"Server error: {str(err)}")

@app.delete("/phrases/delete/{phrase}")
async def delete_phrase(phrase: str, current_user: dict = Depends(verify_token)):
    """Delete a specific phrase from user's collection"""
    try:
        user_id = current_user["user_id"]
        phrase_lower = phrase.strip().lower()
        
        if not phrase_lower:
            raise HTTPException(status_code=400, detail="Phrase cannot be empty")
        
        # Find and delete the phrase from user's collection
        result = phrases_collection.delete_one({
            "user_id": ObjectId(user_id),
            "phrase": phrase_lower
        })
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=404, 
                detail=f"Phrase '{phrase}' not found in your collection"
            )
        
        return {
            "message": f"Phrase '{phrase}' deleted successfully",
            "deleted_phrase": phrase,
            "deleted_count": result.deleted_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting phrase: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to delete phrase: {str(e)}"
        )

@app.delete("/phrases/delete_by_id/{phrase_id}")
async def delete_phrase_by_id(phrase_id: str, current_user: dict = Depends(verify_token)):
    """Delete a phrase by its ID from user's collection"""
    try:
        user_id = current_user["user_id"]
        
        # Validate ObjectId format
        try:
            phrase_object_id = ObjectId(phrase_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid phrase ID format")
        
        # Find the phrase first to get the phrase name for response
        phrase_doc = phrases_collection.find_one({
            "_id": phrase_object_id,
            "user_id": ObjectId(user_id)
        })
        
        if not phrase_doc:
            raise HTTPException(
                status_code=404, 
                detail="Phrase not found in your collection"
            )
        
        # Delete the phrase
        result = phrases_collection.delete_one({
            "_id": phrase_object_id,
            "user_id": ObjectId(user_id)
        })
        
        return {
            "message": f"Phrase '{phrase_doc['phrase']}' deleted successfully",
            "deleted_phrase": phrase_doc['phrase'],
            "deleted_phrase_id": phrase_id,
            "deleted_count": result.deleted_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting phrase by ID: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to delete phrase: {str(e)}"
        )

@app.post("/phrases/frame_sentences")
def frame_phrase_sentences(request: PhraseSentenceRequest):
    """Main endpoint to frame sentences using array of phrases with meanings and contexts"""
    phrases_array = request.phrases
    
    # Validate that phrases_array is not empty
    if len(phrases_array) == 0:
        raise HTTPException(status_code=400, detail="Phrases must be a non-empty array")
    
    try:
        print(f'Framing sentences for {len(phrases_array)} phrases')
        
        # Convert Pydantic models to dict for the API call
        phrases_dict_array = [phrase.dict() for phrase in phrases_array]
        
        # Call Gemini API to get sentences
        response_text = call_gemini_for_phrase_sentences(phrases_dict_array)
        
        print('Phrase sentences fetched successfully, processing response...')
        
        # Extract sentences from the response
        sentences_data = extract_phrase_sentences_from_response(response_text)
        
        print(f'Extracted phrase sentences: {json.dumps(sentences_data, indent=2)}')
        
        # Return the structured response
        return {
            "phrases_processed": len(phrases_array),
            "sentences": sentences_data.get("sentences", []),
            "total_phrases": len(sentences_data.get("sentences", [])),
            "source": "gemini_api"
        }
        
    except Exception as err:
        print(f'Server error: {err}')
        raise HTTPException(status_code=500, detail=f"Server error: {str(err)}")

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Wordify API",
        "gemini_api_configured": bool(os.getenv('GEMINI_API_KEY'))
    }


if __name__ == "__main__":
    import uvicorn
    
    # Check if Gemini API key is set
    if not os.getenv('GEMINI_API_KEY'):
        print("WARNING: GEMINI_API_KEY environment variable not set!")
        print("Please set it with: export GEMINI_API_KEY='your_api_key_here'")
    else:
        print("Gemini API key configured successfully")
    
    print("Starting Wordify API...")
    uvicorn.run(app, host="localhost", port=5000, reload=True)