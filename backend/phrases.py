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

def get_fallback_phrase_definition(phrase):
    """Provide a basic fallback definition when Gemini API fails"""
    return f'''{{
        "phrase": "{phrase}",
        "meanings": [
            {{
                "definition": "Definition temporarily unavailable. Please try again later.",
                "context": "general",
                "examples": ["The phrase '{phrase}' is being processed."],
                "similar_phrases": []
            }}
        ]
    }}'''

def call_gemini_for_phrase_meanings(phrase):
    """Call Gemini API to get all meanings and usage of an English phrase"""
    gemini_api_key = os.getenv('GEMINI_API_KEY')
    
    if not gemini_api_key:
        raise Exception("GEMINI_API_KEY environment variable not set")
    
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_api_key}"
        
        prompt = f"""
        This will be read by new English learners. Give simple, clear, and easy-to-understand explanations.
        Provide all meanings and usage contexts of the English phrase "{phrase}". 
        If the phrase has multiple meanings or can be used in different contexts, list them all. (Limit to 2 or 3 with valid and easy-to-understand meanings)
        
        Return the response as a JSON object with this exact structure:
        {{
            "phrase": "{phrase}",
            "meanings": [
                {{
                    "definition": "definition text here",
                    "context": "formal/informal/business/daily conversation etc",
                    "examples": ["example sentence 1", "example sentence 2"],
                    "similar_phrases": ["similar phrase 1", "similar phrase 2"]
                }}
            ]
        }}
        
        Make sure to include all different meanings if the phrase has multiple definitions or usage contexts.
        Focus on practical usage that English learners would encounter in daily conversation.
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
                print(f'Phrase attempt {attempt + 1}: Calling Gemini API with {timeout}s timeout...')
                
                response = requests.post(url, json=payload, headers=headers, timeout=timeout)
                
                if not response.ok:
                    error_text = response.text
                    print(f'Gemini API error (phrase meanings): {error_text}')
                    if attempt == 1:  # Last attempt
                        return get_fallback_phrase_definition(phrase)
                    continue
                
                break  # Success, exit retry loop
                
            except requests.exceptions.Timeout:
                print(f'Phrase timeout on attempt {attempt + 1}')
                if attempt == 1:  # Last attempt failed
                    print('Returning fallback phrase definition due to timeout')
                    return get_fallback_phrase_definition(phrase)
                continue
            except Exception as e:
                print(f'Phrase error on attempt {attempt + 1}: {e}')
                if attempt == 1:  # Last attempt
                    print('Returning fallback phrase definition due to error')
                    return get_fallback_phrase_definition(phrase)
                continue
        else:
            # If we get here, all attempts failed
            return get_fallback_phrase_definition(phrase)
        
        data = response.json()
        print(f'Gemini API response: {json.dumps(data, indent=2)}')
        
        # Extract the text response from Gemini
        if not data.get('candidates') or not data['candidates'][0].get('content') or not data['candidates'][0]['content'].get('parts'):
            raise Exception('Invalid response format from Gemini API')
        
        response_text = data['candidates'][0]['content']['parts'][0]['text']
        print(f'Response text: {response_text}')
        
        return response_text
        
    except Exception as e:
        print(f'Error calling Gemini API: {e}')
        raise

def extract_phrase_meanings_from_response(response_text):
    """Extract JSON from Gemini response for phrases"""
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
                "phrase": "unknown",
                "meanings": [{
                    "definition": response_text,
                    "context": "unknown",
                    "examples": [],
                    "similar_phrases": []
                }]
            }
    except json.JSONDecodeError as e:
        print(f'JSON decode error: {e}')
        # Return raw response if JSON parsing fails
        return {
            "phrase": "unknown",
            "meanings": [{
                "definition": response_text,
                "context": "unknown",
                "examples": [],
                "similar_phrases": []
            }]
        }


def call_gemini_for_phrase_sentences(phrase_data_array):
    """Call Gemini API to frame sentences using array of phrases with their meanings and contexts"""
    gemini_api_key = os.getenv('GEMINI_API_KEY')
    
    if not gemini_api_key:
        raise Exception("GEMINI_API_KEY environment variable not set")
    
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_api_key}"
        
        # Build the phrase list for the prompt
        phrase_descriptions = []
        for item in phrase_data_array:
            phrase = item.get('phrase', '')
            meaning = item.get('meaning', '')
            context = item.get('context', '')
            phrase_descriptions.append(f'- "{phrase}" (meaning: {meaning}, context: {context})')
        
        phrases_text = '\n'.join(phrase_descriptions)
        
        prompt = f"""
        These sentences will be read by new English learners. Give simple, clear, and easy-to-understand sentences.
        Provide sentences that are in daily conversation and easy to understand.
        Create sentences using these English phrases with their specific meanings and contexts:
        
        {phrases_text}
        
        For each phrase, create 2-3 example sentences that clearly demonstrate the given meaning and context.
        Make sure the sentences show natural usage of the phrase in conversation.
        
        Return the response as a JSON object with this exact structure:
        {{
            "sentences": [
                {{
                    "phrase": "phrase here",
                    "meaning": "the specific meaning used",
                    "context": "formal/informal/business etc",
                    "sentences": ["sentence 1 using the phrase", "sentence 2 using the phrase", "sentence 3 using the phrase"]
                }}
            ]
        }}
        
        Make sure each sentence clearly shows the phrase being used in the context of the given meaning and situation.
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
        response = requests.post(url, json=payload, headers=headers, timeout=25)  # 25 second timeout
        
        if not response.ok:
            error_text = response.text
            print(f'Gemini API error (phrase sentences): {error_text}')
            print(f'Request URL: {url}')
            print(f'Request payload: {json.dumps(payload, indent=2)}')
            raise Exception(f'Failed to call Gemini API: {response.status_code}')
        
        data = response.json()
        print(f'Gemini API response: {json.dumps(data, indent=2)}')
        
        # Extract the text response from Gemini
        if not data.get('candidates') or not data['candidates'][0].get('content') or not data['candidates'][0]['content'].get('parts'):
            raise Exception('Invalid response format from Gemini API')
        
        response_text = data['candidates'][0]['content']['parts'][0]['text']
        print(f'Response text: {response_text}')
        
        return response_text
        
    except Exception as e:
        print(f'Error calling Gemini API: {e}')
        raise

def extract_phrase_sentences_from_response(response_text):
    """Extract JSON from Gemini response for phrase sentences"""
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
                "sentences": [{
                    "phrase": "unknown",
                    "meaning": "unknown",
                    "context": "unknown",
                    "sentences": [response_text]
                }]
            }
    except json.JSONDecodeError as e:
        print(f'JSON decode error: {e}')
        # Return raw response if JSON parsing fails
        return {
            "sentences": [{
                "phrase": "unknown", 
                "meaning": "unknown",
                "context": "unknown",
                "sentences": [response_text]
            }]
        }


# MongoDB connection setup
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI)
db = client["dictionary_app"]
phrases_collection = db["phrases"]

# Create router for phrase endpoints
router = APIRouter(prefix="/phrases", tags=["Phrases"])

# Pydantic Models for phrases
class PhraseRequest(BaseModel):
    phrase: str

class AddPhraseRequest(BaseModel):
    phrase: str
    meanings: Optional[List[dict]] = []
    examples: Optional[List[str]] = []
    contexts: Optional[List[str]] = []
    similar_phrases: Optional[List[str]] = []

# Pydantic Models for phrase sentences
class PhraseData(BaseModel):
    phrase: str
    meaning: str
    context: str

class PhraseSentenceRequest(BaseModel):
    phrases: List[PhraseData]

@router.post("/add")
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

@router.get("/my_phrases")
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

@router.post("/define")
async def define_phrase(request: PhraseRequest, current_user_id: str = Depends(verify_token)):
    """Get phrase meanings without saving to collection"""
    phrase = request.phrase.strip().lower()
    
    if not phrase:
        raise HTTPException(status_code=400, detail="Phrase cannot be empty")
    
    try:
        print(f'Getting meanings for phrase: {phrase}')
        
        # Call Gemini API to get phrase meanings
        response_text = call_gemini_for_phrase_meanings(phrase)
        
        # Extract meanings from the response
        meanings_data = extract_phrase_meanings_from_response(response_text)
        
        # Prepare data for response (but don't save)
        meanings = meanings_data.get("meanings", [])
        
        # Return only the definitions without saving
        return {
            "phrase": phrase,
            "meanings": meanings,
            "total_meanings": len(meanings),
            "source": "gemini_api"
        }
        
    except Exception as err:
        print(f'Server error: {err}')
        raise HTTPException(status_code=500, detail=f"Server error: {str(err)}")

@router.delete("/delete/{phrase}")
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

@router.delete("/delete_by_id/{phrase_id}")
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

@router.post("/frame_sentences")
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