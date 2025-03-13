import sys
import os

# Add the parent directory to the path so we can import from the root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the main Flask app
from app import app

# This is the handler that Vercel will use
def handler(request):
    """Handle a request to the function."""
    return app 