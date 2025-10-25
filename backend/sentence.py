import os 
import requests
import json
import dotenv

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

dotenv.load_dotenv()

def get_fallback_sentences(word_data_array):
    """Provide fallback sentences when Gemini API fails"""
    sentences = []
    for item in word_data_array:
        word = item.get('word', 'word')
        sentences.append({
            "word": word,
            "sentences": [f"This is an example sentence using the word '{word}'."],
            "part_of_speech": item.get('part_of_speech', 'unknown')
        })
    
    return {
        "sentences": sentences
    }

def call_gemini_for_sentences(word_data_array):
    """Call Gemini API to frame sentences using array of words with their meanings and parts of speech"""
    gemini_api_key = os.getenv('GEMINI_API_KEY')
    
    if not gemini_api_key:
        raise Exception("GEMINI_API_KEY environment variable not set")
    
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_api_key}"
        
        # Build the word list for the prompt
        word_descriptions = []
        for item in word_data_array:
            word = item.get('word', '')
            meaning = item.get('meaning', '')
            part_of_speech = item.get('part_of_speech', '')
            word_descriptions.append(f'- "{word}" (meaning: {meaning}, part of speech: {part_of_speech})')
        
        words_text = '\n'.join(word_descriptions)
        
        prompt = f"""
        Meaning will be read by new English learners. Give simple, clear, and easy-to-understand sentences.
        Provide sentences that are in daily conversation and easy to understand. Sentences should be new and easy to grasp.
        Create sentences using these words with their specific meanings and parts of speech:
        
        {words_text}
        
        For each word, create 2-3 example sentences that clearly demonstrate the given meaning and part of speech.
        
        Return the response as a JSON object with this exact structure:
        {{
            "sentences": [
                {{
                    "word": "word here",
                    "meaning": "the specific meaning used",
                    "part_of_speech": "noun/verb/adjective etc",
                    "sentences": ["sentence 1 using the word", "sentence 2 using the word", "sentence 3 using the word"]
                }}
            ]
        }}
        
        Make sure each sentence clearly shows the word being used in the context of the given meaning and part of speech.
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
                print(f'Sentence generation attempt {attempt + 1}: Calling Gemini API with {timeout}s timeout...')
                
                response = requests.post(url, json=payload, headers=headers, timeout=timeout)
                
                if not response.ok:
                    error_text = response.text
                    print(f'Gemini API error: {error_text}')
                    if attempt == 1:  # Last attempt
                        return get_fallback_sentences(word_data_array)
                    continue
                
                data = response.json()
                print(f'Sentence generation: Gemini API response received successfully')
                
                # Extract the text response from Gemini
                if not data.get('candidates') or not data['candidates'][0].get('content') or not data['candidates'][0]['content'].get('parts'):
                    if attempt == 1:  # Last attempt
                        return get_fallback_sentences(word_data_array)
                    continue
                
                response_text = data['candidates'][0]['content']['parts'][0]['text']
                print(f'Sentence generation: Response extracted successfully')
                break
                
            except requests.exceptions.Timeout:
                print(f'Sentence generation timeout on attempt {attempt + 1}')
                if attempt == 1:  # Last attempt failed
                    print('Returning fallback sentences due to timeout')
                    return get_fallback_sentences(word_data_array)
                continue
            except Exception as e:
                print(f'Sentence generation error on attempt {attempt + 1}: {e}')
                if attempt == 1:  # Last attempt
                    print('Returning fallback sentences due to error')
                    return get_fallback_sentences(word_data_array)
                continue
        else:
            # If we get here, all attempts failed
            return get_fallback_sentences(word_data_array)
        print(f'Response text: {response_text}')
        
        return response_text
        
    except Exception as e:
        print(f'Error calling Gemini API: {e}')
        raise

def extract_sentences_from_response(response_text):
    """Extract JSON from Gemini response for sentences"""
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
                    "word": "unknown",
                    "meaning": "unknown",
                    "part_of_speech": "unknown",
                    "example_sentences": [response_text]
                }]
            }
    except json.JSONDecodeError as e:
        print(f'JSON decode error: {e}')
        # Return raw response if JSON parsing fails
        return {
            "sentences": [{
                "word": "unknown", 
                "meaning": "unknown",
                "part_of_speech": "unknown",
                "example_sentences": [response_text]
            }]
        }


# Create router for sentence endpoints
router = APIRouter(prefix="/sentences", tags=["Sentences"])

# Pydantic Models for sentences
class WordData(BaseModel):
    word: str
    meaning: str
    part_of_speech: str

class SentenceRequest(BaseModel):
    words: List[WordData]

@router.post("/frame_sentences")
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
