# auth/jwt_utils.py

import jwt
from datetime import datetime, timedelta

SECRET_KEY = "authyoda"  # Replace with a secure key

def create_jwt_token(user_id):
    """Create JWT token with an expiration time."""
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(hours=1)  # Token expires in 1 hour
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def verify_jwt_token(token):
    """Verify JWT token and return decoded payload if valid."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return None  # Token has expired
    except jwt.InvalidTokenError:
        return None  # Invalid token
