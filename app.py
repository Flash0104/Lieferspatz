import os
import logging
import uuid
import secrets
from datetime import datetime
from sqlalchemy import func
from sqlalchemy import or_
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from database import db, get_database_url
from models import User, Restaurant, MenuItem, Item, Order, OrderHasItems, Category, Payment, Rating, Admin
from cloud_storage import upload_file

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev_key_for_testing_only")
app.config["SQLALCHEMY_DATABASE_URI"] = get_database_url()
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["UPLOAD_FOLDER"] = "static/uploads"

# Ensure upload directory exists
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

# Initialize database
db.init_app(app)

@app.route("/search")
def search():
    query = request.args.get("q", "")
    if not query:
        return render_template("search_results.html", results=[], query="")
    
    # Search for restaurants
    restaurants = Restaurant.query.filter(
        or_(
            Restaurant.name.ilike(f"%{query}%"),
            Restaurant.description.ilike(f"%{query}%"),
            Restaurant.city.ilike(f"%{query}%")
        )
    ).all()
    
    # Search for menu items
    menu_items = MenuItem.query.filter(
        or_(
            MenuItem.name.ilike(f"%{query}%"),
            MenuItem.description.ilike(f"%{query}%")
        )
    ).all()
    
    # Combine results
    results = {
        "restaurants": restaurants,
        "menu_items": menu_items
    }
    
    return render_template("search_results.html", results=results, query=query)

@app.route("/restaurant/upload-image", methods=["POST"])
@login_required
def upload_restaurant_image():
    """Upload a restaurant's profile picture."""
    if current_user.user_type != "restaurant":
        flash("Unauthorized access!", "danger")
        return redirect(url_for("home"))
    
    # Get the restaurant for the current user
    restaurant = Restaurant.query.filter_by(user_id=current_user.id).first()
    if not restaurant:
        flash("Restaurant information not found!", "danger")
        return redirect(url_for("restaurant_dashboard"))
    
    # Check if the post request has the file part
    if 'profile_image' not in request.files:
        flash('No file selected', 'warning')
        return redirect(url_for("restaurant_dashboard"))
    
    file = request.files['profile_image']
    
    # If user does not select file, browser also
    # submit an empty part without filename
    if file.filename == '':
        flash('No file selected', 'warning')
        return redirect(url_for("restaurant_dashboard"))
    
    # Check if the file is allowed
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
    if not ('.' in file.filename and file.filename.rsplit('.', 1)[1].lower() in allowed_extensions):
        flash('Invalid file type. Please upload an image (PNG, JPG, JPEG, GIF).', 'danger')
        return redirect(url_for("restaurant_dashboard"))
    
    try:
        # Upload to Cloudinary
        image_url = upload_file(file)
        
        if not image_url:
            flash('Error uploading image. Please try again.', 'danger')
            return redirect(url_for("restaurant_dashboard"))
        
        # Update restaurant image URL
        restaurant.image_url = image_url
        db.session.commit()
        
        flash('Profile picture updated successfully!', 'success')
    except Exception as e:
        logger.error(f"Error uploading image: {str(e)}")
        flash(f"Error uploading image: {str(e)}", "danger")
    
    return redirect(url_for("restaurant_dashboard"))

# Vercel serverless handler
def handler(event, context):
    return app

if __name__ == "__main__":
    # Create all tables if they don't exist
    with app.app_context():
        db.create_all()
    # Run the app
    app.run(debug=True)



