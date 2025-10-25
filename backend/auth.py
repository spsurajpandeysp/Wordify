"""
Authentication Routes and Handlers
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from security import generate_token, get_user_by_email, create_user, update_user_login
from werkzeug.security import check_password_hash

# Create router for auth endpoints
router = APIRouter(prefix="/auth", tags=["Authentication"])

# Pydantic Models
class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str = ""

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/signup")
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

@router.post("/login")
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