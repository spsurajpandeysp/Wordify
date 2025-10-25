import os
import requests
import json
import dotenv
dotenv.load_dotenv()

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
from security import verify_token


def call_gemini_for_definitions(word):
    """Call Gemini API to get all meanings of a word"""
    gemini_api_key = os.getenv('GEMINI_API_KEY')
    
    if not gemini_api_key:
        raise Exception("GEMINI_API_KEY environment variable not set")
    
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_api_key}"
        
        prompt = f"""
        Meaning will be read by new English learners. Give simple, clear, and easy-to-understand sentences.
        Provide all meanings/definitions of the word "{word}". 
        If the word has multiple meanings or can be used as different parts of speech, list them all. (Limit to 2 or 3 with valid and easy-to-understand meanings)
        
        Return the response as a JSON object with this exact structure:
        {{
            "word": "{word}",
            "meanings": [
                {{
                    "definition": "definition text here",
                    "part_of_speech": "noun/verb/adjective etc",
                    "examples": ["example sentence 1", "example sentence 2"],
                    "synonyms": ["synonym1", "synonym2"]
                }}
            ]
        }}
        
        Make sure to include all different meanings if the word has multiple definitions.
        """
        
        payload = {
            "contents": [{
                "role": "user",
                "parts": [{
                    "text": prompt
                }]
            }]
        }
        
        headers = {"Content-Type": "application/json"}
        
        # Try with shorter timeout first, then retry with longer timeout
        for attempt in range(2):
            try:
                timeout = 15 if attempt == 0 else 30
                print(f'Attempt {attempt + 1}: Calling Gemini API with {timeout}s timeout...')
                
                response = requests.post(url, json=payload, headers=headers, timeout=timeout)
                
                if not response.ok:
                    error_text = response.text
                    print(f'Gemini API error: {error_text}')
                    if attempt == 1:  # Last attempt
                        raise Exception(f'Failed to call Gemini API: {response.status_code}')
                    continue
                
                data = response.json()
                print(f'Gemini API response received successfully')
                
                # Extract the text response from Gemini
                if not data.get('candidates') or not data['candidates'][0].get('content') or not data['candidates'][0]['content'].get('parts'):
                    if attempt == 1:  # Last attempt
                        raise Exception('Invalid response format from Gemini API')
                    continue
                
                response_text = data['candidates'][0]['content']['parts'][0]['text']
                print(f'Response extracted successfully')
                return response_text
                
            except requests.exceptions.Timeout:
                print(f'Timeout on attempt {attempt + 1}')
                if attempt == 1:  # Last attempt failed
                    # Return fallback response
                    print('Returning fallback response due to timeout')
                    return get_fallback_definition(word)
                continue
            except Exception as e:
                print(f'Error on attempt {attempt + 1}: {e}')
                if attempt == 1:  # Last attempt
                    # Return fallback response
                    print('Returning fallback response due to error')
                    return get_fallback_definition(word)
                continue
        
    except Exception as e:
        print(f'Error calling Gemini API: {e}')
        return get_fallback_definition(word)

def get_fallback_definition(word):
    """Provide a basic fallback definition when Gemini API fails"""
    return f'''{{
        "word": "{word}",
        "meanings": [
            {{
                "definition": "Definition temporarily unavailable. Please try again later.",
                "part_of_speech": "unknown",
                "examples": ["The word '{word}' is being processed."],
                "synonyms": []
            }}
        ]
    }}'''

def extract_definitions_from_response_for_words(response_text):
    """Extract JSON from Gemini response"""
    import re
    
    try:
        # Try to find JSON in the response
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group()
            # Clean up any markdown formatting
            json_str = json_str.replace('```json', '').replace('```', '').strip()
            return json.loads(json_str)
        else:
            # If no JSON found, create a simple structure
            return {
                "word": "unknown",
                "meanings": [{
                    "definition": response_text,
                    "part_of_speech": "unknown",
                    "examples": [],
                    "synonyms": []
                }]
            }
    except json.JSONDecodeError as e:
        print(f'JSON decode error: {e}')
        # Return raw response if JSON parsing fails
        return {
            "word": "unknown",
            "meanings": [{
                "definition": response_text,
                "part_of_speech": "unknown",
                "examples": [],
                "synonyms": []
            }]
        }


# MongoDB connection setup
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI)
db = client["dictionary_app"]
words_collection = db["words"]

# Create router for word endpoints
router = APIRouter(prefix="/words", tags=["Words"])

# Pydantic Models for words
class WordRequest(BaseModel):
    word: str

class AddWordRequest(BaseModel):
    word: str
    meanings: Optional[List[dict]] = []
    sentences: Optional[List[str]] = []
    part_of_speech: Optional[List[str]] = []
    synonyms: Optional[List[str]] = []

@router.post("/add")
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

@router.get("/my_words")
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

@router.post("/define")
async def define_word(request: WordRequest, current_user_id: str = Depends(verify_token)):
    """Get word definitions without saving to collection"""
    word = request.word.strip().lower()
    
    if not word:
        raise HTTPException(status_code=400, detail="Word cannot be empty")
    
    try:
        print(f'Getting definitions for word: {word}')
        
        # Call Gemini API to get definitions
        response_text = call_gemini_for_definitions(word)
        
        # Extract definitions from the response
        definitions_data = extract_definitions_from_response_for_words(response_text)
        
        # Prepare data for response (but don't save)
        meanings = definitions_data.get("meanings", [])
        
        # Return only the definitions without saving
        return {
            "word": word,
            "meanings": meanings,
            "total_meanings": len(meanings),
            "source": "gemini_api"
        }
        
    except Exception as err:
        print(f'Server error: {err}')
        raise HTTPException(status_code=500, detail=f"Server error: {str(err)}")

@router.delete("/delete/{word}")
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

@router.delete("/delete_by_id/{word_id}")
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