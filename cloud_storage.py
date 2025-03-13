import os
import cloudinary
import cloudinary.uploader
import cloudinary.api

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME'),
    api_key=os.environ.get('CLOUDINARY_API_KEY'),
    api_secret=os.environ.get('CLOUDINARY_API_SECRET'),
    secure=True
)

def upload_file(file, folder="lieferspatz"):
    """Upload a file to Cloudinary and return the URL."""
    if not file:
        return None
    
    try:
        # Upload the file
        result = cloudinary.uploader.upload(
            file,
            folder=folder,
            resource_type="auto"
        )
        # Return the secure URL
        return result['secure_url']
    except Exception as e:
        print(f"Error uploading to Cloudinary: {str(e)}")
        return None

def delete_file(public_id):
    """Delete a file from Cloudinary using its public ID."""
    if not public_id:
        return False
    
    try:
        # Delete the file
        result = cloudinary.uploader.destroy(public_id)
        return result['result'] == 'ok'
    except Exception as e:
        print(f"Error deleting from Cloudinary: {str(e)}")
        return False 