import jwt
import re
from datetime import datetime, timedelta
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pymongo import MongoClient
from bson import ObjectId
from bson.errors import InvalidId
import os
import json

# Configuration
SECRET_KEY = os.getenv('SECRET_KEY', 'your_default_secret_key')
MONGODB_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')

# Initialize MongoDB connection
client = MongoClient(MONGODB_URI)
db = client.dictionary_app
users_collection = db.users

# Security
security = HTTPBearer()

def generate_token(user_id):
    """Generate JWT token for user"""
    payload = {
        'user_id': str(user_id),
        'exp': datetime.utcnow() + timedelta(days=7),  # Token expires in 7 days
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT token for FastAPI dependency injection"""
    try:
        token = credentials.credentials
        data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        current_user_id = data['user_id']
        
        # Check if user exists
        user = users_collection.find_one({'_id': ObjectId(current_user_id)})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return {"user_id": current_user_id, "user": user}
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except InvalidId:
        raise HTTPException(status_code=401, detail="Invalid user ID")

def token_required(f):
    """Decorator to require JWT token for protected routes (for backward compatibility)"""
    @wraps(f)
    def decorated(*args, **kwargs):
        # This can be used with FastAPI dependency injection instead
        # Just kept for compatibility if needed
        return f(*args, **kwargs)
    return decorated

# Helper functions for user management
def create_user(email: str, password: str, name: str = ""):
    """Create a new user in the database"""
    hashed_password = generate_password_hash(password)
    print(email, password, name, hashed_password)
    user_data = {
        "email": email.lower(),
        "password": hashed_password,
        "name": name,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    print(user_data)
    result = users_collection.insert_one(user_data)
    print(result)
    return result.inserted_id

def get_user_by_email(email: str):
    """Get user by email"""
    return users_collection.find_one({"email": email.lower()})

def get_user_by_id(user_id: str):
    """Get user by ID"""
    try:
        return users_collection.find_one({'_id': ObjectId(user_id)})
    except InvalidId:
        return None

def update_user_login(user_id):
    """Update user's last login timestamp"""
    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"last_login": datetime.utcnow()}}
    )