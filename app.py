import os
import requests
import json
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, session
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_cors import CORS
from models import db, init_db, User, Customer, Restaurant, Category, Item, Order, OrderHasItems, Payment  # Import models

# ============================ ⚙️ CONFIGURATION ============================ #

app = Flask(__name__, static_folder="static", template_folder="templates")
basedir = os.path.abspath(os.path.dirname(__file__))
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{os.path.join(basedir, 'instance', 'database.sqlite')}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = "your_secret_key"

# Initialize Database First
init_db(app)
migrate = Migrate(app, db)  # Place this AFTER init_db(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)
login_manager.login_view = "login"
CORS(app)

# User Loader (Ensure It’s After DB Init)
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# OpenStreetMap Headers
HEADERS = {"User-Agent": "Lieferspatz/1.0"}

# ============================ 🌐 ROUTES ============================ #

# Supported Cities (for validation)
SUPPORTED_CITIES = ["Duisburg", "Essen", "Düsseldorf", "Köln", "Bonn", "Hamburg", "München", "Berlin"]


@app.route("/")
def home():
    city = request.args.get("city", "Duisburg")  # Default to Duisburg
    print(f"🔍 Requested City: {city}")  # Debugging
    restaurants = Restaurant.query.filter_by(city=city).all()
    print(f"📊 Found {len(restaurants)} restaurants in {city}")  # Debugging
    return render_template("index.html", restaurants=restaurants, city=city, user=current_user)


# ============================ 🔑 AUTHENTICATION ROUTES ============================ #
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")
        user_type = request.form.get("user_type", "customer")  # Default to customer

        user = User.query.filter_by(email=email, user_type=user_type).first()

        if user and user.check_password(password):
            login_user(user, remember=True)
            flash(f"Welcome back, {user.first_name}!", "success")  # Show user name
            return redirect(url_for("home"))  # Redirect to the main page

        flash("Invalid email, password, or account type!", "danger")

    return render_template("login.html")



@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        first_name = request.form.get("first_name")
        last_name = request.form.get("last_name")
        location = request.form.get("location")
        plz = request.form.get("plz")
        email = request.form.get("email")
        password = request.form.get("password")
        user_type = request.form.get("user_type", "customer")

        if not (first_name and last_name and location and plz and email and password):
            flash("All fields are required.", "danger")
            return redirect(url_for("register"))

        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            flash("Email is already registered. Please login.", "warning")
            return redirect(url_for("login"))

        new_user = User(
            first_name=first_name,
            last_name=last_name,
            location=location,
            plz=plz,
            email=email,
            user_type=user_type,
        )
        new_user.set_password(password)

        db.session.add(new_user)
        db.session.commit()

        flash("Registration successful! You can now login.", "success")
        return redirect(url_for("login"))

    return render_template("register.html")


@app.route("/logout")
@login_required
def logout():
    logout_user()
    session.clear()
    flash("You have been logged out.", "info")
    return redirect(url_for("home"))

# ============================ 📍 OPENSTREETMAP API ============================ #
@app.route("/api/places", methods=["GET"])
def get_places():
    query = request.args.get("query")
    if not query:
        return jsonify({"error": "Query parameter is missing"}), 400

    try:
        url = "https://nominatim.openstreetmap.org/search"
        params = {"q": query, "format": "json", "addressdetails": 1, "limit": "5"}
        response = requests.get(url, params=params, headers=HEADERS)
        response.raise_for_status()
        return jsonify({"places": response.json()})

    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Failed to fetch places: {str(e)}"}), 500

# ============================ 🍽️ MENU & ORDER ROUTES ============================ #
@app.route("/restaurants")
def restaurants():
    """Render all available restaurants."""
    restaurants = Restaurant.query.all()
    return render_template("restaurants.html", restaurants=restaurants)


@app.route("/<restaurant>/menu")
def menu(restaurant):
    """Render menu page for a given restaurant."""
    return render_template("menu.html", restaurant=restaurant)



@app.route("/api/restaurants")
def get_restaurants():
    """API endpoint to get restaurants by city."""
    city = request.args.get("city", "Duisburg")  # Default to Duisburg

    # Debugging logs
    print(f"🔍 Requested City: {city}")

    # Query database for restaurants in the given city
    restaurants = Restaurant.query.filter_by(city=city).all()

    if not restaurants:
        print(f"❌ No restaurants found in {city}")

    return jsonify({
        "restaurants": [r.to_dict() for r in restaurants]
    })

# Convert Restaurant objects to JSON
def to_dict(self):
    return {
        "name": self.name,
        "address": self.address,
        "city": self.city,
        "image_url": self.image_url or "/static/images/default.png"
    }

Restaurant.to_dict = to_dict  # Attach the function dynamically
@app.route("/order-overview")
@login_required
def order_overview():
    return render_template("order.html")

# ============================ 🚀 RUN APP ============================ #
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        print("✅ Database initialized")
    
    app.run(debug=True, host="127.0.0.1", port=5000)
