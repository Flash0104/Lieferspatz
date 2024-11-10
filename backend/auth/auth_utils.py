import bcrypt
from sqlalchemy.orm import Session
from init_db import User
import jwt
import os
from datetime import datetime, timedelta

# Secret key for JWT
JWT_SECRET = os.getenv("JWT_SECRET", "your_jwt_secret")

def hash_password(password):
    """Hash a password for storing."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(password, hashed_password):
    """Check hashed password."""
    return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))

def get_user_by_username(session: Session, username: str):
    """Retrieve user by username."""
    return session.query(User).filter_by(username=username).first()

def authenticate_user(session: Session, username: str, password: str):
    """Authenticate user by username and password."""
    user = get_user_by_username(session, username)
    if user and verify_password(password, user.password):
        return user
    return None

def create_jwt_token(user_id: int):
    """Generate a JWT token for a given user ID."""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=1)  # Token valid for 1 hour
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")
