import os
import requests
import json
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, session
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_cors import CORS
from authlib.integrations.flask_client import OAuth  # Google OAuth Integration

# ============================ ⚙️ CONFIGURATION ============================ #
app = Flask(__name__)

# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY", "supersecretkey")

# Google OAuth Configuration
app.config["GOOGLE_CLIENT_ID"] = os.getenv("GOOGLE_CLIENT_ID")
app.config["GOOGLE_CLIENT_SECRET"] = os.getenv("GOOGLE_CLIENT_SECRET")

# OpenStreetMap Headers
HEADERS = {"User-Agent": "Lieferspatz/1.0"}

# ============================ 🔌 INITIALIZE EXTENSIONS ============================ #
db = SQLAlchemy(app)
migrate = Migrate(app, db)
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)
login_manager.login_view = "login"
CORS(app)  # Enable Cross-Origin Requests
oauth = OAuth(app)  # Google OAuth Integration

# ============================ 🔑 GOOGLE OAUTH SETUP ============================ #
google = oauth.register(
    name='google',
    client_id=app.config["GOOGLE_CLIENT_ID"],
    client_secret=app.config["GOOGLE_CLIENT_SECRET"],
    access_token_url='https://oauth2.googleapis.com/token',
    authorize_url='https://accounts.google.com/o/oauth2/auth',
    authorize_params=None,
    api_base_url='https://www.googleapis.com/oauth2/v1/',
    client_kwargs={'scope': 'openid email profile'}
)

# ============================ 🛠️ DATABASE MODELS ============================ #
class User(db.Model, UserMixin):
    """User model for authentication."""
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=True)
    google_id = db.Column(db.String(256), unique=True, nullable=True)

    def set_password(self, password):
        """Hashes the password and stores it."""
        self.password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    def check_password(self, password):
        """Verifies the password hash."""
        return bcrypt.check_password_hash(self.password_hash, password)


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# ============================ 🌐 ROUTES ============================ #
@app.route("/")
def home():
    return render_template("index.html")

# ============================ 🔑 AUTHENTICATION ROUTES ============================ #
@app.route("/login", methods=["GET", "POST"])
def login():
    """Handles user login."""
    if request.method == "POST":
        email = request.form.get("email").strip().lower()
        password = request.form.get("password")

        user = User.query.filter_by(email=email).first()

        if user and user.check_password(password):
            login_user(user)
            session["user_id"] = user.id
            session["email"] = user.email
            session["username"] = user.username
            flash("Login successful!", "success")
            return redirect(url_for("dashboard"))
        else:
            flash("Invalid credentials, please try again.", "danger")

    return render_template("login.html")


@app.route("/register", methods=["GET", "POST"])
def register():
    """Handles user registration."""
    if request.method == "POST":
        username = request.form.get("username", "").strip().lower()
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")

        print(f"Received Data: Username: {username}, Email: {email}")  # Debugging

        # Check if the user already exists
        existing_user = User.query.filter((User.username == username) | (User.email == email)).first()
        if existing_user:
            print("User already exists!")  # Debugging
            return jsonify({"status": "error", "message": "Username or email already exists!"}), 400

        # Create new user
        new_user = User(username=username, email=email)
        new_user.set_password(password)

        db.session.add(new_user)
        try:
            db.session.commit()
            print(f"User {new_user.username} successfully registered!")  # Debugging
        except Exception as e:
            db.session.rollback()
            print(f"Database commit failed: {e}")  # Debugging
            return jsonify({"status": "error", "message": "Database error"}), 500

        return jsonify({"status": "success", "message": "Registration successful! Please log in."})
    
    return render_template("register.html")



@app.route("/logout")
@login_required
def logout():
    """Logs out the user."""
    logout_user()
    session.clear()
    flash("You have been logged out.", "info")
    return redirect(url_for("home"))

# ============================ 🔑 GOOGLE OAUTH LOGIN ============================ #
@app.route("/login/google")
def google_login():
    redirect_uri = url_for("google_callback", _external=True)
    
    # If running locally, force HTTPS to avoid Google callback issues
    if request.host.startswith("127.0.0.1") or request.host.startswith("localhost"):
        redirect_uri = redirect_uri.replace("http://", "https://")
    
    return google.authorize_redirect(redirect_uri)


@app.route("/login/google/callback")
def google_callback():
    """Handles the callback from Google OAuth."""
    token = google.authorize_access_token()
    user_info = google.get("userinfo").json()

    if "email" not in user_info:
        flash("Google authentication failed.", "danger")
        return redirect(url_for("login"))

    user = User.query.filter_by(email=user_info["email"]).first()

    if not user:
        user = User(username=user_info["name"], email=user_info["email"], google_id=user_info["id"])
        db.session.add(user)
        db.session.commit()

    login_user(user)
    flash("Logged in with Google successfully!", "success")
    return redirect(url_for("home"))

# ============================ 📍 OPENSTREETMAP API ============================ #
@app.route("/api/places", methods=["GET"])
def get_places():
    """Fetches place suggestions from OpenStreetMap (OSM)."""
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
    """Fetches all restaurants."""
    restaurants = Restaurant.query.all() 
    return render_template("restaurants.html", restaurants=restaurants)

@app.route("/<restaurant>/menu")
def menu(restaurant):
    return render_template("menu.html", restaurant=restaurant)

@app.route("/order-overview")
@login_required
def order_overview():
    return render_template("order.html")

# ============================ 🚀 RUN APP ============================ #
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        print("✅ Database initialized")
    
    app.run(debug=True, host="127.0.0.1", port=5001)
