from app import app

# This is the correct handler for Vercel
def handler(request):
    return app(request) 