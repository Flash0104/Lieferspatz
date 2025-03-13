import os
import requests
import json
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, session, make_response
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user, AnonymousUserMixin
from flask_cors import CORS
from models import db, init_db, User, Customer, Restaurant, Category, Item, Order, OrderHasItems, Payment, MenuItem, Menu, Rating, Admin   # Import models
import time
import random
from werkzeug.security import generate_password_hash, check_password_hash
import logging  # Add logging for critical operations
from sqlalchemy import text  # Import text for SQL statements
from werkzeug.utils import secure_filename
import uuid
from datetime import datetime
from sqlalchemy import func

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('lieferspatz')

# ============================ ⚙️ CONFIGURATION ============================ #

app = Flask(__name__, static_folder="static", template_folder="templates")
basedir = os.path.abspath(os.path.dirname(__file__))
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{os.path.join(basedir, 'instance', 'database.sqlite')}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = "your_secret_key"

# Session configuration
app.config["SESSION_TYPE"] = "filesystem"
app.config["SESSION_PERMANENT"] = False
app.config["PERMANENT_SESSION_LIFETIME"] = 1800  # 30 minutes
app.config["SESSION_USE_SIGNER"] = True
app.config["SESSION_COOKIE_SECURE"] = False  # Set to True in production with HTTPS
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"

# Initialize Database First
init_db(app)
migrate = Migrate(app, db)  # Place this AFTER init_db(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)
login_manager.login_view = "login"
CORS(app)

# User Loader (Ensure It's After DB Init)
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
    city = request.args.get("city", "Duisburg")
    user = current_user if current_user.is_authenticated else None
    
    # Get restaurants with ratings information, ordered by display_order
    restaurants = Restaurant.query.filter_by(city=city).order_by(Restaurant.display_order, Restaurant.id).all()
    
    # Enhance restaurant data for display
    for restaurant in restaurants:
        # Count ratings
        restaurant.ratings_count = db.session.query(Rating).filter_by(restaurant_id=restaurant.id).count()
        
        # Format rating to one decimal place
        if restaurant.rating:
            restaurant.display_rating = "{:.1f}".format(restaurant.rating)
        else:
            restaurant.display_rating = "0.0"
        
        # TODO: In the future, consider adding these properties to the Restaurant model:
        # - has_offer: Boolean - Whether the restaurant has a special offer
        # - is_favorite: Boolean - Whether the restaurant is a favorite for the current user
        # - delivery_fee: Float - The delivery fee for the restaurant
        # - delivery_time: String - The estimated delivery time (e.g., "45 Min.")
    
    user_balance = current_user.balance if current_user.is_authenticated else 0.0
    
    return render_template(
        "index.html", 
        restaurants=restaurants, 
        city=city, 
        user=user, 
        user_balance=user_balance,
        current_year=datetime.now().year
    )

@app.before_request
def make_session_permanent():
    session.permanent = False  # Ensure sessions expire on logout


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

@app.route("/check-auth")
def check_auth():
    response = jsonify({"logged_in": current_user.is_authenticated})
    # Add headers to prevent caching
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response



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
        
        # Set initial balance to 100 for customers
        if user_type == "customer":
            new_user.balance = 100.0
        # For restaurants, explicitly set to 0.0
        elif user_type == "restaurant":
            new_user.balance = 0.0
            
        new_user.set_password(password)

        db.session.add(new_user)
        db.session.commit()

        # 🔥 If user is a restaurant, create a restaurant entry
        if user_type == "restaurant":
            new_restaurant = Restaurant.create_for_user(new_user)
            # Explicitly set balance to 0.0 to avoid None issues
            new_restaurant.balance = 0.0
            db.session.add(new_restaurant)
            db.session.commit()
            logger.info(f"Created new restaurant with id {new_restaurant.id} with initial balance 0.0")

        flash("Registration successful! You can now login.", "success")
        return redirect(url_for("login"))

    return render_template("register.html")





@app.route("/logout", methods=["GET", "POST"])
@login_required
def logout():
    # First, log the user out using Flask-Login
    logout_user()
    
    # Clear the session completely
    session.clear()
    
    # Create a response with aggressive cache-busting headers
    response = make_response(redirect(url_for("home")))
    
    # Set very strict cache control headers
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0, private"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "-1"
    
    # Set a special cookie to signal to JavaScript that logout occurred
    response.set_cookie('logged_out', '1', max_age=60)
    
    # Explicitly expire the session cookie and any other auth cookies
    response.set_cookie('session', '', expires=0, max_age=0)
    response.set_cookie('remember_token', '', expires=0, max_age=0)
    
    # Log the logout for debugging
    print("User logged out successfully, session cleared")
    
    # Add a flash message
    flash("You have been logged out successfully!", "success")
    
    return response






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

# ============================ 🆕 MENU MANAGEMENT ROUTES ============================ #
@app.route("/restaurant/menu/add", methods=["GET", "POST"])
@login_required
def add_menu_item():
    """Allows a restaurant to add a new menu item."""
    if current_user.user_type != "restaurant":
        flash("Unauthorized access!", "danger")
        return redirect(url_for("home"))
    
    # Get the restaurant information
    restaurant = Restaurant.query.filter_by(user_id=current_user.id).first()
    if not restaurant:
        flash("Restaurant not found!", "danger")
        return redirect(url_for("home"))

    if request.method == "POST":
        name = request.form.get("name")
        description = request.form.get("description")
        price = request.form.get("price")
        image_url = request.form.get("image_url") or "/static/images/default_food.png"
        category_name = request.form.get("category_name").strip()

        # 🛑 Prevent duplicate categories by checking if it already exists
        existing_category = Category.query.filter_by(name=category_name, restaurant_id=restaurant.id).first()
        if existing_category:
            category_id = existing_category.id
        else:
            new_category = Category(name=category_name, restaurant_id=restaurant.id)
            db.session.add(new_category)
            db.session.commit()
            category_id = new_category.id

        new_item = Item(
            name=name,
            description=description,
            price=float(price),
            image_url=image_url,
            category_id=category_id,
            restaurant_id=restaurant.id
        )

        db.session.add(new_item)
        db.session.commit()
        flash("Menu item added successfully!", "success")
        return redirect(url_for("restaurant_dashboard"))

    # Fetch categories for this restaurant
    categories = Category.query.filter_by(restaurant_id=restaurant.id).all()
    
    # If no categories exist, create default ones
    if not categories:
        default_categories = ["Main Dishes", "Drinks", "Appetizers", "Desserts"]
        for category_name in default_categories:
            new_category = Category(name=category_name, restaurant_id=restaurant.id)
            db.session.add(new_category)
        db.session.commit()
        categories = Category.query.filter_by(restaurant_id=restaurant.id).all()
    
    return render_template("add_menu_item.html", categories=categories)



# ============================ 🆕 ORDER MANAGEMENT ROUTES ============================ #
@app.route("/restaurant/orders")
@login_required
def restaurant_orders():
    """Redirects to restaurant dashboard as orders are now managed there."""
    if current_user.user_type != "restaurant":
        flash("Unauthorized access!", "danger")
        return redirect(url_for("home"))

    # Redirect to the dashboard since orders functionality is consolidated there
    return redirect(url_for("restaurant_dashboard"))

@app.route("/restaurant/dashboard")
@login_required
def restaurant_dashboard():
    """Restaurant dashboard showing menu items, orders, and restaurant settings."""
    if current_user.user_type != "restaurant":
        flash("Unauthorized access!", "danger")
        return redirect(url_for("home"))
    
    # Get the restaurant information
    restaurant = Restaurant.query.filter_by(user_id=current_user.id).first()
    if not restaurant:
        flash("Restaurant not found!", "danger")
        return redirect(url_for("home"))
    
    # Ensure restaurant balance is initialized
    if restaurant.balance is None:
        # Initialize balance to 0 if it's None
        restaurant.balance = 0
        db.session.commit()
        logger.info(f"Initialized missing balance for restaurant {restaurant.id}")
    
    # Check if restaurant balance and user balance are synchronized
    if restaurant.balance != current_user.balance:
        logger.warning(f"Balance mismatch detected: Restaurant {restaurant.id} ({restaurant.balance}) != User {current_user.id} ({current_user.balance})")
        # Synchronize balances - use restaurant balance as source of truth
        current_user.balance = restaurant.balance
        db.session.commit()
        logger.info(f"Synchronized user balance with restaurant balance: {restaurant.balance}")
    
    # Get menu items
    menu_items = Item.query.filter_by(restaurant_id=restaurant.id).all()
    
    # Get current and completed orders
    current_orders = Order.query.filter(
        Order.restaurant_id == restaurant.id,
        Order.order_status.in_(["pending", "accepted", "prepared"])
    ).all()
    completed_orders = Order.query.filter_by(restaurant_id=restaurant.id, order_status="completed").all()
    
    # Get categories for adding new menu items
    categories = Category.query.filter_by(restaurant_id=restaurant.id).all()
    
    # Log the balance for debugging
    logger.info(f"Restaurant {restaurant.id} dashboard accessed with balance = {restaurant.balance}")
    
    return render_template(
        "restaurant_dashboard.html",
        restaurant=restaurant,
        menu_items=menu_items,
        current_orders=current_orders,
        completed_orders=completed_orders,
        categories=categories
    )

@app.route("/restaurant/toggle-status", methods=["POST"])
@login_required
def toggle_restaurant_status():
    """Toggle the restaurant's open/closed status."""
    if current_user.user_type != "restaurant":
        flash("Unauthorized action!", "danger")
        return redirect(url_for("home"))
    
    restaurant = Restaurant.query.filter_by(user_id=current_user.id).first()
    if not restaurant:
        flash("Restaurant not found!", "danger")
        return redirect(url_for("home"))
    
    # Toggle the status
    restaurant.is_open = not restaurant.is_open
    db.session.commit()
    
    status = "open" if restaurant.is_open else "closed"
    flash(f"Restaurant is now {status}!", "success")
    return redirect(url_for("restaurant_dashboard"))


@app.route("/restaurant/orders/<int:order_id>/accept", methods=["POST"])
@login_required
def accept_order(order_id):
    """Allows restaurant to accept an order."""
    if current_user.user_type != "restaurant":
        flash("Unauthorized action!", "danger")
        return redirect(url_for("home"))

    order = Order.query.get_or_404(order_id)
    order.status = "accepted"
    order.order_status = "accepted"
    db.session.commit()
    flash("Order accepted!", "success")
    return redirect(url_for("restaurant_dashboard"))


@app.route("/restaurant/orders/<int:order_id>/cancel", methods=["POST"])
@login_required
def cancel_order(order_id):
    """Allows restaurant to cancel an order."""
    if current_user.user_type != "restaurant":
        flash("Unauthorized action!", "danger")
        return redirect(url_for("home"))

    order = Order.query.get_or_404(order_id)
    order.status = "canceled"
    order.order_status = "canceled"
    db.session.commit()
    flash("Order canceled.", "warning")
    return redirect(url_for("restaurant_dashboard"))


@app.route("/restaurant/orders/<int:order_id>/complete", methods=["POST"])
@login_required
def complete_order(order_id):
    """Allows restaurant to mark an order as completed after preparation."""
    if current_user.user_type != "restaurant":
        flash("Unauthorized action!", "danger")
        return redirect(url_for("home"))

    order = Order.query.get_or_404(order_id)
    order.status = "completed"
    order.order_status = "completed"
    db.session.commit()
    flash("Order marked as completed!", "success")
    return redirect(url_for("restaurant_dashboard"))

@app.route("/restaurant/orders/<int:order_id>/prepared", methods=["POST"])
@login_required
def mark_order_prepared(order_id):
    """Allows restaurant to mark an order as prepared (ready for delivery)."""
    if current_user.user_type != "restaurant":
        flash("Unauthorized action!", "danger")
        return redirect(url_for("home"))

    order = Order.query.get_or_404(order_id)
    order.status = "prepared"
    order.order_status = "prepared"
    db.session.commit()
    flash("Order marked as prepared and ready for delivery!", "success")
    return redirect(url_for("restaurant_dashboard"))

@app.route("/restaurant/orders/<int:order_id>/delivered", methods=["POST"])
@login_required
def mark_order_delivered(order_id):
    """Allows restaurant to mark an order as delivered (completed)."""
    if current_user.user_type != "restaurant":
        flash("Unauthorized action!", "danger")
        return redirect(url_for("home"))

    order = Order.query.get_or_404(order_id)
    order.status = "completed"
    order.order_status = "completed"
    db.session.commit()
    flash("Order marked as delivered and completed!", "success")
    return redirect(url_for("restaurant_dashboard"))


@app.route("/restaurants")
def restaurants():
    """Render all available restaurants."""
    restaurants = Restaurant.query.all()
    return render_template("restaurants.html", restaurants=restaurants)


@app.route("/menu")
def menu():
    restaurant_name = request.args.get("restaurant")
    
    if not restaurant_name:
        return "Error: Restaurant name is missing!", 400
    
    # Find the restaurant by name (case insensitive)
    restaurant = Restaurant.query.filter(Restaurant.name.ilike(f"%{restaurant_name}%")).first()
    
    if not restaurant:
        return "Error: Restaurant not found!", 404

    # Get the menu items for this restaurant
    menu_items = Item.query.filter_by(restaurant_id=restaurant.id).all()

    # Categorize menu items by category
    menu = {}
    for item in menu_items:
        category_name = item.category.name if item.category else "Uncategorized"
        if category_name not in menu:
            menu[category_name] = []
        menu[category_name].append(item)

    return render_template("menu.html", restaurant=restaurant, menu=menu, menu_items=menu_items)

@app.route("/restaurant/<int:restaurant_id>")
@login_required
def restaurant_menu_page(restaurant_id):
    restaurant = Restaurant.query.get_or_404(restaurant_id)
    
    # Get all items for this restaurant
    menu_items = Item.query.filter_by(restaurant_id=restaurant_id).all()
    
    # Organize items by category
    categories = {}
    
    for item in menu_items:
        # Get the category name from the category relationship
        category = Category.query.get(item.category_id)
        category_name = category.name if category else "Uncategorized"
        
        if category_name not in categories:
            categories[category_name] = []
        categories[category_name].append(item)
    
    user_balance = current_user.balance
    return render_template("menu.html", restaurant=restaurant, menu=categories, user_balance=user_balance)




@app.route("/api/restaurants")
def get_restaurants():
    """API endpoint to get restaurants in Duisburg, Essen, and Düsseldorf only."""
    city = request.args.get("city", "Duisburg")  # Default to Duisburg
    ALLOWED_CITIES = ["Duisburg", "Essen", "Düsseldorf"]

    if city not in ALLOWED_CITIES:
        return jsonify({"restaurants": []})  # Return an empty list for unsupported cities

    restaurants = Restaurant.query.filter(Restaurant.city.in_(ALLOWED_CITIES)).all()

    return jsonify({"restaurants": [r.to_dict() for r in restaurants]})



@app.route("/order-overview")
@login_required
def order_overview():
    return render_template("order.html")

# Get Cart Count (for frontend update)
@app.route("/cart/count")
@login_required
def cart_count():
    cart = session.get("cart", {})
    total_items = sum(item["quantity"] for item in cart.values())
    return jsonify({"count": total_items})



@app.route("/cart")
@login_required
def view_cart():
    cart = session.get("cart", {})
    formatted_cart = [
        {
            "id": key,
            "name": value["name"],
            "price": value["price"],
            "quantity": value["quantity"]
        }
        for key, value in cart.items()
    ]

    total_price = sum(item["price"] * item["quantity"] for item in cart.values())
    return jsonify({"items": formatted_cart, "total_price": total_price})


@app.route("/cart/items")
@login_required
def view_cart_items():
    # This is an alias for the /cart route to maintain compatibility with main.js
    cart = session.get("cart", {})
    formatted_cart = [
        {
            "id": key,
            "name": value["name"],
            "price": value["price"],
            "quantity": value["quantity"]
        }
        for key, value in cart.items()
    ]

    total_price = sum(item["price"] * item["quantity"] for item in cart.values())
    return jsonify({"items": formatted_cart, "total_price": total_price})


@app.route("/api/cart", methods=["GET"])
@login_required
def api_view_cart():
    cart = session.get("cart", {})
    total_price = sum(item["price"] * item["quantity"] for item in cart.values())
    
    # Calculate fees correctly
    # Original fee is the total price (85%)
    original_fee = total_price
    # Service fee is 15% of original fee / 85% = 15/85 of original fee
    service_fee = (original_fee * 15) / 85
    # Total fee is original fee + service fee
    total_fee = original_fee + service_fee

    return jsonify({
        "items": [{"id": key, **value} for key, value in cart.items()],
        "total": original_fee,
        "original_fee": original_fee,
        "service_fee": service_fee,
        "total_fee": total_fee
    })



@app.route("/cart/remove/<int:item_id>", methods=["POST"])
@login_required
def remove_from_cart(item_id):
    cart = session.get("cart", {})

    if str(item_id) in cart:
        del cart[str(item_id)]
        session["cart"] = cart
        session.modified = True
        print(f"✅ Removed item {item_id} from cart.")  # Debug log
        return jsonify({"success": True, "message": "Item removed"})

    return jsonify({"error": "Item not found"}), 404  # 🔥 Here is the 404 error



@app.route("/checkout", methods=["GET", "POST"])
def checkout():
    if request.method == "POST":
        # Get the shopping cart from the session
        cart = session.get("cart", {})

        if not cart:
            flash("Your cart is empty!", "warning")
            return redirect(url_for("home"))
            
        # Calculate total price
        total_price = calculate_cart_total(cart)
        service_fee = (total_price * 15) / 85  # 15% service fee
        original_fee = total_price  # Original fee for restaurant
        total_fee = total_price + service_fee  # Total fee including service fee
        
        # Check if the user has enough balance
        if current_user.balance < total_fee:
            flash(f"Insufficient balance! You need €{total_fee:.2f} but have €{current_user.balance:.2f}.", "danger")
            return redirect(url_for("view_cart"))

        # Get restaurant from cart
        restaurant = get_restaurant_from_cart(cart)
        if not restaurant:
            flash("Could not determine restaurant for this order. Please try again.", "danger")
            return redirect(url_for("view_cart"))
            
        # Check if restaurant is open
        if not restaurant.is_open:
            flash("Sorry, this restaurant is currently closed.", "danger")
            return redirect(url_for("view_cart"))
            
        try:
            # Get or create customer record
            customer = None
            if hasattr(current_user, 'customer') and current_user.customer:
                # Get the first customer record (should be only one)
                customer = current_user.customer[0]
            
            if not customer:
                # Create a customer record
                customer = Customer(
                    user_id=current_user.id,
                    address=current_user.location,
                    postal_code=current_user.plz
                )
                db.session.add(customer)
                db.session.flush()  # Get ID without committing
                
            # Create a new order
            new_order = Order(
                user_id=current_user.id,
                customer_id=customer.id,
                restaurant_id=restaurant.id,
                total_price=total_fee,
                original_fee=original_fee,
                service_fee=service_fee,
                order_status='pending'
            )
            db.session.add(new_order)
            db.session.flush()  # Get the order ID
            
            # Add order items
            for item_id, item_data in cart.items():
                order_item = OrderHasItems(
                    order_id=new_order.id,
                    item_id=int(item_id),
                    quantity=item_data["quantity"]
                )
                db.session.add(order_item)

            # Update balances
            # First, update customer balance - this is crucial
            logger.info(f"Customer {current_user.id} before update: balance = {current_user.balance}")
            previous_balance = current_user.balance
            current_user.balance -= total_fee
            logger.info(f"Customer {current_user.id} after update: balance = {current_user.balance}")
            
            # Update restaurant balance with original fee only
            print(f"Restaurant {restaurant.id} before update: balance = {restaurant.balance}")
            success, new_balance = update_restaurant_balance(restaurant.id, original_fee, "add")
            
            if not success:
                # Restaurant balance update failed, but we'll continue with the order
                logger.error(f"Failed to update restaurant balance during checkout")
                flash("Your order was placed, but there was an issue updating the restaurant's balance. The restaurant has been notified.", "warning")
                
                # Fallback: Try to update the balance directly as a last resort
                try:
                    if restaurant.balance is None:
                        restaurant.balance = original_fee
                    else:
                        restaurant.balance += original_fee
                    logger.info(f"Fallback: Updated restaurant balance to {restaurant.balance} directly")
                except Exception as e:
                    logger.error(f"Fallback also failed: {str(e)}")
            else:
                logger.info(f"Restaurant {restaurant.id} balance updated to {new_balance} after order")
                # Make sure in-memory object is updated
                restaurant.balance = new_balance
            
            # Update admin balance with service fee
            try:
                # Find an admin to credit the service fee to
                admin = Admin.query.first()
                if admin:
                    # Update admin's total earnings
                    admin.total_earnings += service_fee
                    logger.info(f"Admin {admin.id} earnings updated: +{service_fee:.2f} = {admin.total_earnings:.2f}")
                    
                    # Also update the admin user's balance
                    admin_user = User.query.get(admin.user_id)
                    if admin_user:
                        admin_user.balance += service_fee
                        logger.info(f"Admin user {admin_user.id} balance updated: +{service_fee:.2f} = {admin_user.balance:.2f}")
                    else:
                        logger.warning(f"Admin user not found for admin ID {admin.id}")
                else:
                    logger.warning("No admin found to credit service fee")
            except Exception as e:
                logger.error(f"Error updating admin earnings: {str(e)}")
            
            # Clear the cart and commit all changes
            session["cart"] = {}
            
            # Commit all changes - this is crucial!
            try:
                db.session.commit()
                logger.info(f"Order {new_order.id} created and all changes committed successfully")
            except Exception as e:
                db.session.rollback()
                logger.error(f"Error committing order changes: {str(e)}")
                # Restore user's balance since order failed
                current_user.balance = previous_balance
                flash("There was an error processing your order. Please try again.", "danger")
                return redirect(url_for("view_cart"))
                
            print(f"Order Created: {new_order.id}")
            
            # Flash success message
            flash("Order placed successfully!", "success")
            return redirect(url_for("order_history"))

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error during checkout: {str(e)}")
            flash(f"Error during checkout: {str(e)}", "danger")
            return redirect(url_for("view_cart"))
    
    # GET request - show checkout page
    cart = session.get("cart", {})
    total_price = calculate_cart_total(cart)
    service_fee = (total_price * 15) / 85  # 15% service fee
    total_fee = total_price + service_fee  # Total fee including service fee
    
    return render_template("checkout.html", cart=cart, total_price=total_price, service_fee=service_fee, total_fee=total_fee)



@app.route("/order_history")
@login_required
def order_history():
    # Fetch previous orders for the current user with their ratings
    previous_orders = Order.query.filter_by(user_id=current_user.id).order_by(Order.order_date.desc()).all()
    
    # Get cart items if any
    cart_items = session.get("cart", {}).values()
    
    # Retrieve balance from the user model
    user_balance = current_user.balance
    
    # Log orders and their ratings for debugging
    for order in previous_orders:
        if order.order_status == 'completed':
            rating = Rating.query.filter_by(order_id=order.id).first()
            logger.debug(f"Order {order.id} status: {order.order_status}, rating: {rating.rating if rating else None}")
    
    return render_template("order_history.html", 
                          current_order=None, 
                          previous_orders=previous_orders, 
                          cart_items=cart_items, 
                          user_balance=user_balance)

@app.route("/profile")
@login_required
def profile():
    # Fetch statistics for the current user
    user_id = current_user.id

    if current_user.user_type == "customer":
        # For customers, first get the customer record
        customer = Customer.query.filter_by(user_id=user_id).first()
        if customer:
            # Then use the customer_id to get order statistics
            total_orders = Order.query.filter_by(customer_id=customer.id).count()
            completed_orders = Order.query.filter_by(customer_id=customer.id, status="completed").count()
        else:
            # If customer record doesn't exist, create one
            customer = Customer(user_id=user_id, address=current_user.location, postal_code=current_user.plz)
            db.session.add(customer)
            db.session.commit()
            total_orders = 0
            completed_orders = 0
    else:
        # For restaurants, get their order statistics
        restaurant = Restaurant.query.filter_by(user_id=user_id).first()
        if restaurant:
            total_orders = Order.query.filter_by(restaurant_id=restaurant.id).count()
            completed_orders = Order.query.filter_by(restaurant_id=restaurant.id, status="completed").count()
        else:
            total_orders = 0
            completed_orders = 0

    return render_template("profile.html", total_orders=total_orders, completed_orders=completed_orders)

@app.route("/update_profile", methods=["POST"])
@login_required
def update_profile():
    # Get form data
    first_name = request.form.get("first_name")
    last_name = request.form.get("last_name")
    email = request.form.get("email")
    location = request.form.get("location")
    plz = request.form.get("plz")
    
    # Validate the data
    if not first_name or not last_name or not email or not location or not plz:
        flash("All fields are required", "error")
        return redirect(url_for("profile"))
    
    # Check if email is already in use by another user
    existing_user = User.query.filter(User.email == email, User.id != current_user.id).first()
    if existing_user:
        flash("Email address is already in use", "error")
        return redirect(url_for("profile"))
    
    # Update user data
    current_user.first_name = first_name
    current_user.last_name = last_name
    current_user.email = email
    current_user.location = location
    current_user.plz = plz
    
    # Update corresponding Customer record if it exists
    if current_user.user_type == "customer":
        customer = Customer.query.filter_by(user_id=current_user.id).first()
        if customer:
            customer.address = location
            customer.postal_code = plz
    
    # Update corresponding Restaurant record if it exists
    elif current_user.user_type == "restaurant":
        restaurant = Restaurant.query.filter_by(user_id=current_user.id).first()
        if restaurant:
            restaurant.name = f"{first_name} {last_name}"  # Update name based on user's name
            restaurant.address = location
    
    db.session.commit()
    flash("Profile updated successfully", "success")
    return redirect(url_for("profile"))

@app.route("/change_password", methods=["POST"])
@login_required
def change_password():
    # Get form data
    current_password = request.form.get("current_password")
    new_password = request.form.get("new_password")
    confirm_password = request.form.get("confirm_password")
    
    # Validate the data
    if not current_password or not new_password or not confirm_password:
        flash("All fields are required", "error")
        return redirect(url_for("profile"))
    
    # Check if current password is correct using the User model's check_password method
    if not current_user.check_password(current_password):
        flash("Current password is incorrect", "error")
        return redirect(url_for("profile"))
    
    # Check if new passwords match
    if new_password != confirm_password:
        flash("New passwords do not match", "error")
        return redirect(url_for("profile"))
    
    # Update password using the User model's set_password method
    current_user.set_password(new_password)
    db.session.commit()
    flash("Password changed successfully", "success")
    return redirect(url_for("profile"))

@app.route("/topup_balance", methods=["POST"])
@login_required
def topup_balance():
    # Get form data
    try:
        amount = float(request.form.get("amount"))
    except (ValueError, TypeError):
        flash("Please enter a valid amount", "error")
        return redirect(url_for("profile"))
    
    # Validate the amount
    if amount <= 0:
        flash("Amount must be greater than zero", "error")
        return redirect(url_for("profile"))
    
    # Update user balance
    current_user.balance += amount
    
    # If this is a restaurant owner, also update the restaurant balance
    if current_user.user_type == "restaurant":
        restaurant = Restaurant.query.filter_by(user_id=current_user.id).first()
        if restaurant:
            logger.info(f"Updating restaurant balance for topup: restaurant_id={restaurant.id}, amount={amount}")
            restaurant.balance += amount
    
    db.session.commit()
    flash(f"Successfully added €{amount:.2f} to your balance", "success")
    return redirect(url_for("profile"))

@app.route('/add_product', methods=['GET', 'POST'])
def add_product():
    if request.method == 'POST':
        category_id = request.form['category']
        name = request.form['name']
        description = request.form['description']
        price = request.form['price']
        image_url = request.form['image_url']
        
        new_item = Item(
            category_id=category_id,
            name=name,
            description=description,
            price=price,
            image_url=image_url,
            restaurant_id=current_user.restaurant_id
        )
        db.session.add(new_item)
        db.session.commit()
        return redirect(url_for('restaurant_dashboard'))
    
    categories = Category.query.all()
    return render_template('add_product.html', categories=categories)



@app.route('/cart/add/<int:item_id>', methods=['POST'])
@login_required
def add_to_cart(item_id):
    item = Item.query.get(item_id)
    if item:
        cart = session.get("cart", {})
        # Get quantity from request data or default to 1
        quantity = request.json.get('quantity', 1) if request.is_json else 1
        
        # Check if item already exists in cart
        if str(item_id) in cart:
            cart[str(item_id)]['quantity'] += quantity
        else:
            cart[str(item_id)] = {
            'name': item.name,
            'price': item.price,
            'quantity': quantity,
            'restaurant_id': item.restaurant_id
        }
        
        session["cart"] = cart
        session.modified = True
        print(cart)  # Debugging: Check cart contents
        return jsonify({'success': True, 'message': 'Item added to cart'})
    return jsonify({'success': False, 'message': 'Item not found'}), 404

@app.context_processor
def inject_cart_count():
    cart = session.get("cart", {})
    cart_count = sum(item["quantity"] for item in cart.values()) if cart else 0
    return dict(cart_count=cart_count)

@app.context_processor
def inject_user_balance():
    """Make user balance available to all templates with consistent euro formatting."""
    if current_user.is_authenticated:
        return dict(user_balance=current_user.balance)
    return dict(user_balance=0.0)

@app.route("/submit_order", methods=["POST"])
@login_required
def submit_order():
    """Submit the current user's order."""
    # Get the current user and shopping cart
    user = current_user
    cart = session.get("cart", {})
    
    if not cart:
        return jsonify({"success": False, "message": "Your cart is empty!"})
    
    # Calculate the total price and fee
    total_price = calculate_cart_total(cart)
    service_fee = (total_price * 15) / 85  # 15% service fee
    total_fee = total_price + service_fee
    
    # Get the restaurant from the cart
    restaurant = get_restaurant_from_cart(cart)
    if not restaurant:
        return jsonify({"success": False, "message": "Could not determine restaurant"})
    
    # Check if the restaurant is open
    if not restaurant.is_open:
        return jsonify({"success": False, "message": "This restaurant is currently closed"})
    
    # Check if the user has enough balance
    if user.balance < total_fee:
        return jsonify({
            "success": False, 
            "message": f"Insufficient balance! You need €{total_fee:.2f} but have €{user.balance:.2f}."
        }), 400
    
    try:
        # Start a transaction
        logger.info(f"Processing order: user={user.id}, restaurant={restaurant.id}, total={total_fee}")
        
        # Store original balance in case we need to roll back
        original_balance = user.balance
        
        # Get or create customer record
        customer = None
        if hasattr(user, 'customer') and user.customer:
            # Get the first customer record (should be only one)
            customer = user.customer[0]
        
        if not customer:
            # Create a customer record
            customer = Customer(
                user_id=user.id,
                address=user.location,
                postal_code=user.plz
            )
            db.session.add(customer)
            db.session.flush()
            
        # Create a new order
        new_order = Order(
            user_id=user.id,
            customer_id=customer.id,
            restaurant_id=restaurant.id,
            total_price=total_fee,
            original_fee=total_price,
            service_fee=service_fee,
            order_status='pending'
        )
        db.session.add(new_order)
        db.session.flush()  # Get the order ID
        
        # Add order items
        for item_id, item_data in cart.items():
            order_item = OrderHasItems(
                order_id=new_order.id,
                item_id=int(item_id),
                quantity=item_data["quantity"]
            )
            db.session.add(order_item)
        
        # Update customer balance
        logger.info(f"Customer {user.id} before update: balance = {user.balance}")
        user.balance -= total_fee
        logger.info(f"Customer {user.id} after update: balance = {user.balance}")
        
        # Update restaurant balance using utility function
        logger.info(f"Restaurant {restaurant.id} before update: balance = {restaurant.balance}")
        
        success, new_balance = update_restaurant_balance(restaurant.id, total_fee, "add")
        
        if not success:
            logger.error(f"Failed to update restaurant balance during submit_order")
            # Try direct update as fallback
            try:
                if restaurant.balance is None:
                    restaurant.balance = total_fee
                else:
                    restaurant.balance += total_fee
                logger.info(f"Fallback: Updated restaurant balance to {restaurant.balance} directly")
            except Exception as e:
                logger.error(f"Fallback update also failed: {str(e)}")
        else:
            logger.info(f"Restaurant {restaurant.id} balance updated to {new_balance}")
            # Update in-memory object
            restaurant.balance = new_balance
        
        # Update admin balance with service fee
        try:
            # Find an admin to credit the service fee to
            admin = Admin.query.first()
            if admin:
                # Update admin's total earnings
                admin.total_earnings += service_fee
                logger.info(f"Admin {admin.id} earnings updated: +{service_fee:.2f} = {admin.total_earnings:.2f}")
                
                # Also update the admin user's balance
                admin_user = User.query.get(admin.user_id)
                if admin_user:
                    admin_user.balance += service_fee
                    logger.info(f"Admin user {admin_user.id} balance updated: +{service_fee:.2f} = {admin_user.balance:.2f}")
                else:
                    logger.warning(f"Admin user not found for admin ID {admin.id}")
            else:
                logger.warning("No admin found to credit service fee")
        except Exception as e:
            logger.error(f"Error updating admin earnings: {str(e)}")
        
        # Clear the cart
        session["cart"] = {}
        
        # Commit all changes
        try:
            db.session.commit()
            logger.info(f"Order {new_order.id} created and all changes committed successfully")
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error committing order: {str(e)}")
            # Restore user's balance
            user.balance = original_balance
            return jsonify({"success": False, "message": f"Error processing order: {str(e)}"}), 500
        
        return jsonify({"success": True, "message": "Order placed successfully!"})
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error in submit_order: {str(e)}")
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

def get_restaurant_from_cart(cart):
    try:
        restaurant_id = next(iter(cart.values()))['restaurant_id']
        return Restaurant.query.get(restaurant_id)
    except KeyError:
        print("KeyError: 'restaurant_id' not found in cart")
        return None

def calculate_cart_total(cart):
    total = 0
    for item in cart.values():
        total += item['price'] * item['quantity']
    return total

def add_item_to_cart(cart, item_id, quantity):
    item = Item.query.get(item_id)
    if item:
        cart[item_id] = {
            'name': item.name,
            'price': item.price,
            'quantity': quantity,
            'restaurant_id': item.restaurant_id  # Ensure this is included
        }

# Add a special route for checking auth status with forced session check
@app.route("/check-auth-status")
def check_auth_status():
    """
    Special endpoint that forces a complete session check and returns
    the current authentication status with aggressive no-cache headers.
    """
    # Force session check
    is_authenticated = current_user.is_authenticated
    
    # Create response with auth status
    response = jsonify({
        "logged_in": is_authenticated,
        "timestamp": int(time.time()),
        "random": ''.join(random.choices('abcdefghijklmnopqrstuvwxyz0123456789', k=8))
    })
    
    # Set aggressive no-cache headers
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0, private"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "-1"
    
    return response

@app.route("/api/restaurant/<int:restaurant_id>/menu")
def get_restaurant_menu(restaurant_id):
    """API endpoint to get menu items for a specific restaurant."""
    menu_items = MenuItem.query.filter_by(restaurant_id=restaurant_id).all()
    
    if not menu_items:
        # Try to get items from the Item model as fallback
        menu_items = Item.query.filter_by(restaurant_id=restaurant_id).all()
    
    items_data = []
    for item in menu_items:
        items_data.append({
            "id": item.id,
            "name": item.name,
            "price": item.price,
            "description": getattr(item, 'description', ''),
            "image_url": getattr(item, 'image_url', '/static/images/default_food.png')
        })
    
    return jsonify(items_data)

@app.route("/order/<int:order_id>/cashback", methods=["POST"])
@login_required
def apply_order_cashback(order_id):
    """Applies cashback from a completed order to customer's balance."""
    # Get the order
    order = Order.query.get_or_404(order_id)
    
    # Verify this is the restaurant that received the order
    restaurant = Restaurant.query.get_or_404(order.restaurant_id)
    if current_user.user_type != "restaurant" or current_user.id != restaurant.user_id:
        flash("Unauthorized action! Only restaurants can issue cashback.", "danger")
        return redirect(url_for("restaurant_dashboard"))
    
    # Verify that order is completed (can only give cashback for completed orders)
    if order.order_status != "completed":
        flash("Cashback can only be applied to completed orders!", "warning")
        return redirect(url_for("restaurant_dashboard"))
    
    # Check if cashback was already applied
    if order.cashback_applied:
        flash("Cashback has already been applied to this order!", "warning")
        return redirect(url_for("restaurant_dashboard"))
    
    # Get the exact cashback amount from the form
    try:
        cashback_amount = float(request.form.get("cashback_amount", 0))
        # Ensure the amount is positive and not greater than the order total
        if cashback_amount <= 0:
            flash("Cashback amount must be greater than zero!", "warning")
            return redirect(url_for("restaurant_dashboard"))
        if cashback_amount > order.total_price:
            flash("Cashback amount cannot exceed the order total!", "warning")
            return redirect(url_for("restaurant_dashboard"))
    except ValueError:
        flash("Invalid cashback amount!", "danger")
        return redirect(url_for("restaurant_dashboard"))
    
    # Round to 2 decimal places for currency
    cashback_amount = round(cashback_amount, 2)
    
    # Get customer from the order
    customer = User.query.get_or_404(order.user_id)
    
    # Check if restaurant has enough balance
    if restaurant.balance < cashback_amount:
        flash("Insufficient restaurant balance to provide this cashback!", "danger")
        return redirect(url_for("restaurant_dashboard"))
    
    # Update balances
    try:
        # Debug print before update
        print(f"Restaurant {restaurant.id} before cashback: balance = {restaurant.balance}")
        
        # Use the utility function to update the restaurant balance
        success, new_balance = update_restaurant_balance(restaurant.id, cashback_amount, "subtract")
        
        if not success:
            flash("Failed to process cashback. Please try again.", "danger")
            return redirect(url_for("restaurant_dashboard"))
        
        logger.info(f"Restaurant {restaurant.id} balance updated to {new_balance} after cashback")
        # Make sure in-memory object is updated 
        restaurant.balance = new_balance
        
        # Update customer balance
        customer.balance += cashback_amount
        
        # Mark order as having received cashback
        order.cashback_applied = True
    except Exception as e:
        logger.error(f"ERROR updating balances during cashback: {str(e)}")
        flash("An error occurred processing the cashback. Please try again.", "danger")
        return redirect(url_for("restaurant_dashboard"))
    
    db.session.commit()
    
    flash(f"Cashback of €{cashback_amount:.2f} has been applied to the customer's balance!", "success")
    return redirect(url_for("restaurant_dashboard"))

# New utility function for updating restaurant balance
def update_restaurant_balance(restaurant_id, amount, operation):
    """
    Update a restaurant's balance using direct SQL to ensure consistency.
    Also ensures the restaurant owner's user account balance is synchronized.
    
    Args:
        restaurant_id: The ID of the restaurant
        amount: The amount to add or subtract
        operation: Either "add" or "subtract"
        
    Returns:
        Tuple of (success, new_balance)
    """
    from sqlalchemy import text  # Ensure text is imported directly here
    
    if amount <= 0:
        logger.error(f"Invalid amount {amount} for restaurant balance update")
        return False, None
        
    logger.info(f"Updating restaurant {restaurant_id} balance: {operation} {amount}")
    
    try:
        # Get the restaurant object first for verification
        restaurant = Restaurant.query.get(restaurant_id)
        if not restaurant:
            logger.error(f"Restaurant {restaurant_id} not found")
            return False, None
            
        # Get current balance from the object
        current_balance = restaurant.balance
        if current_balance is None:
            current_balance = 0
            
        logger.info(f"Current restaurant {restaurant_id} balance: {current_balance}")
        
        # Calculate new balance
        new_balance = None
        if operation == "add":
            new_balance = current_balance + amount
        elif operation == "subtract":
            if current_balance < amount:
                logger.error(f"Restaurant {restaurant_id} has insufficient balance: {current_balance} < {amount}")
                return False, None
            new_balance = current_balance - amount
        else:
            logger.error(f"Invalid operation {operation}")
            return False, None
            
        # Update the restaurant object directly
        restaurant.balance = new_balance
        
        # Get and update the user object associated with this restaurant
        user = User.query.get(restaurant.user_id)
        if user:
            logger.info(f"Synchronizing user balance for restaurant owner (user_id: {restaurant.user_id})")
            # Update user's balance to match restaurant balance
            user.balance = new_balance
            logger.info(f"Updated user {user.id} balance to {new_balance}")
        else:
            logger.warning(f"User not found for restaurant {restaurant_id}, user_id {restaurant.user_id}")
        
        # Commit the change
        try:
            db.session.commit()
            logger.info(f"Restaurant {restaurant_id} balance updated from {current_balance} to {new_balance}")
            return True, new_balance
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error committing balance update: {str(e)}")
            return False, None
            
    except Exception as e:
        logger.error(f"Error updating restaurant {restaurant_id} balance: {str(e)}")
        return False, None

@app.route("/submit-rating", methods=["POST"])
@login_required
def submit_rating():
    """Handle restaurant rating submissions for completed orders"""
    if not request.is_json:
        return jsonify({"success": False, "message": "Invalid request format"}), 400
    
    data = request.get_json()
    order_id = data.get('order_id')
    restaurant_id = data.get('restaurant_id')
    rating_value = data.get('rating')
    
    # Validate input data
    if not all([order_id, restaurant_id, rating_value]):
        return jsonify({"success": False, "message": "Missing required fields"}), 400
    
    try:
        rating_value = float(rating_value)
        if rating_value < 0 or rating_value > 5:
            return jsonify({"success": False, "message": "Rating must be between 0 and 5"}), 400
    except ValueError:
        return jsonify({"success": False, "message": "Invalid rating value"}), 400
    
    # Get the order and verify it belongs to the current user and is completed
    order = Order.query.get(order_id)
    if not order:
        return jsonify({"success": False, "message": "Order not found"}), 404
    
    if order.user_id != current_user.id:
        return jsonify({"success": False, "message": "You cannot rate an order that doesn't belong to you"}), 403
    
    if order.order_status != 'completed':
        return jsonify({"success": False, "message": "You can only rate completed orders"}), 400
    
    # Check if a rating already exists for this order
    existing_rating = Rating.query.filter_by(order_id=order_id).first()
    
    try:
        if existing_rating:
            # Update existing rating
            old_rating = existing_rating.rating
            existing_rating.rating = rating_value
            db.session.add(existing_rating)
            logger.info(f"Updated rating for order {order_id} from {old_rating} to {rating_value}")
        else:
            # Create a new rating
            new_rating = Rating(
                user_id=current_user.id,
                restaurant_id=restaurant_id,
                order_id=order_id,
                rating=rating_value
            )
            db.session.add(new_rating)
            logger.info(f"Created new rating {rating_value} for order {order_id}")
        
        # Update restaurant's average rating
        restaurant = Restaurant.query.get(restaurant_id)
        if restaurant:
            # Calculate the new average rating
            ratings = Rating.query.filter_by(restaurant_id=restaurant_id).all()
            total_rating = sum(r.rating for r in ratings)
            avg_rating = total_rating / len(ratings) if ratings else 0
            
            # Update the restaurant's rating
            restaurant.rating = round(avg_rating * 10) / 10  # Round to nearest 0.1 (one decimal place)
            logger.info(f"Updated restaurant {restaurant_id} rating to {restaurant.rating}")
        
        db.session.commit()
        return jsonify({"success": True, "message": "Rating submitted successfully"})
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error submitting rating: {str(e)}")
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

@app.route("/restaurant/upload-image", methods=["POST"])
@login_required
def upload_restaurant_image():
    """Upload a new profile picture for the restaurant."""
    if current_user.user_type != "restaurant":
        flash("Unauthorized access!", "danger")
        return redirect(url_for("home"))
    
    # Get the restaurant information
    restaurant = Restaurant.query.filter_by(user_id=current_user.id).first()
    if not restaurant:
        flash("Restaurant not found!", "danger")
        return redirect(url_for("home"))
    
    # Check if the post request has the file part
    if 'profile_image' not in request.files:
        flash('No file part', 'danger')
        return redirect(url_for('restaurant_dashboard'))
    
    file = request.files['profile_image']
    
    # If user does not select file, browser also
    # submit an empty part without filename
    if file.filename == '':
        flash('No selected file', 'danger')
        return redirect(url_for('restaurant_dashboard'))
    
    # Check if the file is allowed
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
    if not file.filename.lower().endswith(tuple('.' + ext for ext in allowed_extensions)):
        flash('Invalid file type. Please upload an image file (PNG, JPG, JPEG, GIF).', 'danger')
        return redirect(url_for('restaurant_dashboard'))
    
    # Create the static/uploads directory if it doesn't exist
    upload_folder = os.path.join(app.static_folder, 'uploads')
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)
    
    # Generate a secure filename
    filename = secure_filename(file.filename)
    unique_filename = f"{uuid.uuid4().hex}_{filename}"
    file_path = os.path.join(upload_folder, unique_filename)
    
    # Save the file
    file.save(file_path)
    
    # Update the restaurant image URL in the database
    restaurant.image_url = f"/static/uploads/{unique_filename}"
    db.session.commit()
    
    flash('Restaurant profile picture updated successfully!', 'success')
    return redirect(url_for('restaurant_dashboard'))

@app.route("/restaurant/update-image-url", methods=["POST"])
@login_required
def update_restaurant_image_url():
    """Update restaurant profile picture using a URL."""
    if current_user.user_type != "restaurant":
        flash("Unauthorized access!", "danger")
        return redirect(url_for("home"))
    
    # Get the restaurant information
    restaurant = Restaurant.query.filter_by(user_id=current_user.id).first()
    if not restaurant:
        flash("Restaurant not found!", "danger")
        return redirect(url_for("home"))
    
    # Get the image URL from the form
    image_url = request.form.get("image_url")
    if not image_url:
        flash("Please provide a valid image URL", "danger")
        return redirect(url_for("restaurant_dashboard"))
    
    # Update the restaurant image URL in the database
    restaurant.image_url = image_url
    db.session.commit()
    
    flash("Restaurant profile picture URL updated successfully!", "success")
    return redirect(url_for("restaurant_dashboard"))

@app.route("/restaurant/set-default-image", methods=["POST"])
@login_required
def set_default_restaurant_image():
    """Set restaurant profile picture to the default image."""
    if current_user.user_type != "restaurant":
        flash("Unauthorized access!", "danger")
        return redirect(url_for("home"))
    
    # Get the restaurant information
    restaurant = Restaurant.query.filter_by(user_id=current_user.id).first()
    if not restaurant:
        flash("Restaurant not found!", "danger")
        return redirect(url_for("home"))
    
    # Update the restaurant image URL to the default
    restaurant.image_url = "/static/images/default_restaurant.png"
    db.session.commit()
    
    flash("Restaurant profile picture set to default!", "success")
    return redirect(url_for("restaurant_dashboard"))

# ============================ 👑 ADMIN ROUTES ============================ #
@app.route("/admin_login", methods=["GET", "POST"])
def admin_login():
    """Admin login page with special access."""
    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")
        
        user = User.query.filter_by(email=email, user_type="admin").first()
        
        if user and user.check_password(password):
            login_user(user, remember=True)
            flash(f"Welcome back, Admin {user.first_name}!", "success")
            return redirect(url_for("admin_dashboard"))
        
        flash("Invalid email or password for admin account!", "danger")
    
    return render_template("admin_login.html")

@app.route("/admin_register", methods=["GET", "POST"])
def admin_register():
    """Admin registration page with special access."""
    if request.method == "POST":
        first_name = request.form.get("first_name")
        last_name = request.form.get("last_name")
        location = request.form.get("location")
        plz = request.form.get("plz")
        email = request.form.get("email")
        password = request.form.get("password")
        
        if not (first_name and last_name and location and plz and email and password):
            flash("All fields are required.", "danger")
            return redirect(url_for("admin_register"))
        
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            flash("Email is already registered. Please login.", "warning")
            return redirect(url_for("admin_login"))
        
        new_user = User(
            first_name=first_name,
            last_name=last_name,
            location=location,
            plz=plz,
            email=email,
            user_type="admin",  # Set user type to admin
            balance=0.0  # Admins don't need balance
        )
        new_user.set_password(password)
        
        db.session.add(new_user)
        db.session.flush()  # Get the user ID without committing
        
        # Create an Admin entry for the new admin user
        new_admin = Admin(
            user_id=new_user.id,
            total_earnings=0.0
        )
        db.session.add(new_admin)
        
        db.session.commit()
        
        flash("Admin registration successful! You can now login.", "success")
        return redirect(url_for("admin_login"))
    
    return render_template("admin_register.html")

@app.route("/admin/dashboard")
@login_required
def admin_dashboard():
    # Check if user is admin
    if current_user.user_type != "admin":
        flash("You don't have permission to access this page.", "danger")
        return redirect(url_for("home"))
    
    try:
        # Get admin data
        admin = Admin.query.filter_by(user_id=current_user.id).first()
        if not admin:
            flash("Admin profile not found.", "danger")
            return redirect(url_for("home"))
        
        # Get statistics
        total_orders = Order.query.count()
        active_restaurants = Restaurant.query.filter_by(is_open=True).count()
        total_users = User.query.count()
        
        # Get recent orders with user data
        recent_orders = db.session.query(Order, User)\
            .join(User, Order.user_id == User.id)\
            .order_by(Order.order_date.desc())\
            .limit(10)\
            .all()
        
        # Get top restaurants by service fees
        top_restaurants_data = db.session.query(
            Restaurant.id,
            Restaurant.name,
            func.count(Order.id).label('total_orders'),
            func.sum(Order.service_fee).label('service_fees')
        ).join(Order, Restaurant.id == Order.restaurant_id)\
         .group_by(Restaurant.id)\
         .order_by(func.sum(Order.service_fee).desc())\
         .limit(5)\
         .all()
        
        top_restaurants = []
        for restaurant in top_restaurants_data:
            top_restaurants.append({
                'id': restaurant.id,
                'name': restaurant.name,
                'total_orders': restaurant.total_orders,
                'service_fees': restaurant.service_fees or 0
            })
        
        # Get all restaurants for the management section
        restaurants = Restaurant.query.order_by(Restaurant.display_order).all()
        
        # Get all users for the user management section
        users = User.query.order_by(User.id).all()
        
        return render_template(
            "admin_dashboard.html",
            admin=admin,
            total_orders=total_orders,
            active_restaurants=active_restaurants,
            total_users=total_users,
            recent_orders=recent_orders,
            top_restaurants=top_restaurants,
            restaurants=restaurants,
            users=users
        )
    
    except Exception as e:
        logger.error(f"Error in admin dashboard: {str(e)}")
        flash(f"An error occurred: {str(e)}", "danger")
        return redirect(url_for("home"))

@app.route("/admin/restaurants/add", methods=["GET", "POST"])
@login_required
def admin_add_restaurant():
    """Add a new restaurant from admin panel."""
    if current_user.user_type != "admin":
        flash("Unauthorized access! Admin privileges required.", "danger")
        return redirect(url_for("home"))
    
    if request.method == "POST":
        # Get restaurant data
        name = request.form.get("name")
        address = request.form.get("address")
        city = request.form.get("city")
        description = request.form.get("description", "")
        is_open = True if request.form.get("is_open") else False
        
        # Get user account data
        first_name = request.form.get("first_name")
        last_name = request.form.get("last_name")
        email = request.form.get("email")
        password = request.form.get("password")
        
        # Validate required fields
        if not (name and address and city and first_name and last_name and email and password):
            flash("All required fields must be filled out.", "danger")
            return redirect(url_for("admin_add_restaurant"))
        
        # Check if email already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            flash("Email is already registered. Please use a different email.", "danger")
            return redirect(url_for("admin_add_restaurant"))
        
        try:
            # Create restaurant owner user
            new_user = User(
                first_name=first_name,
                last_name=last_name,
                location=address,
                plz="00000",  # Default placeholder
                email=email,
                user_type="restaurant",
                balance=0.0
            )
            new_user.set_password(password)
            db.session.add(new_user)
            db.session.flush()  # Get the user ID without committing
            
            # Get the highest display_order value
            max_order = db.session.query(db.func.max(Restaurant.display_order)).scalar() or 0
            
            # Create restaurant
            new_restaurant = Restaurant(
                user_id=new_user.id,
                name=name,
                address=address,
                city=city,
                description=description,
                is_open=is_open,
                display_order=max_order + 1  # Set as last in order
            )
            
            # Handle image upload or URL
            if 'image_file' in request.files and request.files['image_file'].filename:
                file = request.files['image_file']
                if file and allowed_file(file.filename):
                    filename = secure_filename(file.filename)
                    unique_filename = f"{uuid.uuid4().hex}_{filename}"
                    
                    # Ensure uploads directory exists
                    upload_folder = os.path.join(app.static_folder, 'uploads')
                    if not os.path.exists(upload_folder):
                        os.makedirs(upload_folder)
                    
                    file_path = os.path.join(upload_folder, unique_filename)
                    file.save(file_path)
                    new_restaurant.image_url = f"/static/uploads/{unique_filename}"
            elif request.form.get("image_url"):
                new_restaurant.image_url = request.form.get("image_url")
            else:
                new_restaurant.image_url = "/static/images/default_restaurant.png"
            
            db.session.add(new_restaurant)
            db.session.commit()
            
            flash(f"Restaurant '{name}' has been created successfully!", "success")
            return redirect(url_for("admin_dashboard"))
            
        except Exception as e:
            db.session.rollback()
            flash(f"Error creating restaurant: {str(e)}", "danger")
            return redirect(url_for("admin_add_restaurant"))
    
    # GET request - show the form
    return render_template("admin_restaurant_form.html", restaurant=None, supported_cities=SUPPORTED_CITIES)

@app.route("/admin/restaurants/edit/<int:restaurant_id>", methods=["GET", "POST"])
@login_required
def admin_edit_restaurant(restaurant_id):
    """Edit an existing restaurant from admin panel."""
    if current_user.user_type != "admin":
        flash("Unauthorized access! Admin privileges required.", "danger")
        return redirect(url_for("home"))
    
    restaurant = Restaurant.query.get_or_404(restaurant_id)
    
    if request.method == "POST":
        # Update restaurant data
        restaurant.name = request.form.get("name")
        restaurant.address = request.form.get("address")
        restaurant.city = request.form.get("city")
        restaurant.description = request.form.get("description", "")
        restaurant.is_open = True if request.form.get("is_open") else False
        
        # Handle image upload or URL
        if 'image_file' in request.files and request.files['image_file'].filename:
            file = request.files['image_file']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                unique_filename = f"{uuid.uuid4().hex}_{filename}"
                
                # Ensure uploads directory exists
                upload_folder = os.path.join(app.static_folder, 'uploads')
                if not os.path.exists(upload_folder):
                    os.makedirs(upload_folder)
                
                file_path = os.path.join(upload_folder, unique_filename)
                file.save(file_path)
                restaurant.image_url = f"/static/uploads/{unique_filename}"
        elif request.form.get("image_url"):
            restaurant.image_url = request.form.get("image_url")
        
        try:
            db.session.commit()
            flash(f"Restaurant '{restaurant.name}' has been updated successfully!", "success")
            return redirect(url_for("admin_dashboard"))
        except Exception as e:
            db.session.rollback()
            flash(f"Error updating restaurant: {str(e)}", "danger")
    
    return render_template("admin_restaurant_form.html", restaurant=restaurant, supported_cities=SUPPORTED_CITIES)

@app.route("/admin/restaurants/delete/<int:restaurant_id>", methods=["POST"])
@login_required
def admin_delete_restaurant(restaurant_id):
    """Delete a restaurant from admin panel."""
    if current_user.user_type != "admin":
        flash("Unauthorized access! Admin privileges required.", "danger")
        return redirect(url_for("home"))
    
    restaurant = Restaurant.query.get_or_404(restaurant_id)
    user = User.query.get(restaurant.user_id)
    
    try:
        # Delete all related data
        # First, delete all orders related to this restaurant
        orders = Order.query.filter_by(restaurant_id=restaurant_id).all()
        for order in orders:
            # Delete order items
            OrderHasItems.query.filter_by(order_id=order.id).delete()
            # Delete ratings
            Rating.query.filter_by(order_id=order.id).delete()
            # Delete payments
            Payment.query.filter_by(order_id=order.id).delete()
        
        # Delete the orders
        Order.query.filter_by(restaurant_id=restaurant_id).delete()
        
        # Delete menu items
        Item.query.filter_by(restaurant_id=restaurant_id).delete()
        MenuItem.query.filter_by(restaurant_id=restaurant_id).delete()
        
        # Delete categories
        Category.query.filter_by(restaurant_id=restaurant_id).delete()
        
        # Delete the restaurant
        db.session.delete(restaurant)
        
        # Delete the user account if it exists
        if user:
            db.session.delete(user)
        
        db.session.commit()
        flash(f"Restaurant and all related data have been deleted successfully!", "success")
    except Exception as e:
        db.session.rollback()
        flash(f"Error deleting restaurant: {str(e)}", "danger")
    
    return redirect(url_for("admin_dashboard"))

@app.route("/admin/restaurants/toggle/<int:restaurant_id>", methods=["POST"])
@login_required
def admin_toggle_restaurant(restaurant_id):
    """Toggle a restaurant's open/closed status from admin panel."""
    if current_user.user_type != "admin":
        flash("Unauthorized access! Admin privileges required.", "danger")
        return redirect(url_for("home"))
    
    restaurant = Restaurant.query.get_or_404(restaurant_id)
    
    try:
        # Toggle the status
        restaurant.is_open = not restaurant.is_open
        db.session.commit()
        
        status = "opened" if restaurant.is_open else "closed"
        flash(f"Restaurant '{restaurant.name}' has been {status} successfully!", "success")
    except Exception as e:
        db.session.rollback()
        flash(f"Error toggling restaurant status: {str(e)}", "danger")
    
    return redirect(url_for("admin_dashboard"))

@app.route("/admin/update-restaurant-order", methods=["POST"])
@login_required
def admin_update_restaurant_order():
    """Update the display order of restaurants."""
    if current_user.user_type != "admin":
        return jsonify({"success": False, "message": "Unauthorized access"}), 403
    
    try:
        # Get the restaurant IDs in the new order
        restaurant_ids = request.json.get("restaurantIds", [])
        
        # Update the display_order for each restaurant
        for index, restaurant_id in enumerate(restaurant_ids):
            restaurant = Restaurant.query.get(restaurant_id)
            if restaurant:
                restaurant.display_order = index
        
        db.session.commit()
        return jsonify({"success": True, "message": "Restaurant order updated successfully"})
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating restaurant order: {str(e)}")
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

# User Management Routes
@app.route("/admin/users/add", methods=["GET", "POST"])
@login_required
def admin_add_user():
    """Add a new user from admin panel."""
    if current_user.user_type != "admin":
        flash("Unauthorized access! Admin privileges required.", "danger")
        return redirect(url_for("home"))
    
    if request.method == "POST":
        # Get user data
        first_name = request.form.get("first_name")
        last_name = request.form.get("last_name")
        email = request.form.get("email")
        password = request.form.get("password")
        user_type = request.form.get("user_type")
        location = request.form.get("location")
        plz = request.form.get("plz")
        balance = request.form.get("balance", 0.0)
        
        # Validate required fields
        if not (first_name and last_name and email and password and user_type):
            flash("All required fields must be filled out.", "danger")
            return redirect(url_for("admin_add_user"))
        
        # Check if email already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            flash("Email is already registered. Please use a different email.", "danger")
            return redirect(url_for("admin_add_user"))
        
        try:
            # Create new user
            new_user = User(
                first_name=first_name,
                last_name=last_name,
                email=email,
                user_type=user_type,
                location=location,
                plz=plz,
                balance=float(balance) if balance else 0.0
            )
            new_user.set_password(password)
            
            db.session.add(new_user)
            db.session.flush()  # Get the user ID without committing
            
            # If user is admin, create Admin entry
            if user_type == "admin":
                new_admin = Admin(
                    user_id=new_user.id,
                    total_earnings=0.0
                )
                db.session.add(new_admin)
            
            # If user is restaurant, create Restaurant entry
            elif user_type == "restaurant":
                # Get the highest display_order
                max_order = db.session.query(func.max(Restaurant.display_order)).scalar() or 0
                
                new_restaurant = Restaurant(
                    user_id=new_user.id,
                    name=f"{first_name}'s Restaurant",
                    address=location or "Address not provided",
                    city="Berlin",  # Default city
                    description="Restaurant description not provided",
                    image_url="/static/images/default_restaurant.jpg",
                    is_open=False,
                    display_order=max_order + 1
                )
                db.session.add(new_restaurant)
            
            db.session.commit()
            flash(f"User '{first_name} {last_name}' has been added successfully!", "success")
            return redirect(url_for("admin_dashboard"))
            
        except Exception as e:
            db.session.rollback()
            flash(f"Error adding user: {str(e)}", "danger")
            return redirect(url_for("admin_add_user"))
    
    return render_template("admin_user_form.html", user=None)

@app.route("/admin/users/edit/<int:user_id>", methods=["GET", "POST"])
@login_required
def admin_edit_user(user_id):
    """Edit an existing user from admin panel."""
    if current_user.user_type != "admin":
        flash("Unauthorized access! Admin privileges required.", "danger")
        return redirect(url_for("home"))
    
    user = User.query.get_or_404(user_id)
    
    if request.method == "POST":
        # Get user data
        first_name = request.form.get("first_name")
        last_name = request.form.get("last_name")
        email = request.form.get("email")
        new_password = request.form.get("password")
        user_type = request.form.get("user_type")
        location = request.form.get("location")
        plz = request.form.get("plz")
        balance = request.form.get("balance")
        
        # Validate required fields
        if not (first_name and last_name and email and user_type):
            flash("All required fields must be filled out.", "danger")
            return redirect(url_for("admin_edit_user", user_id=user_id))
        
        # Check if email already exists and belongs to another user
        existing_user = User.query.filter_by(email=email).first()
        if existing_user and existing_user.id != user_id:
            flash("Email is already registered to another user. Please use a different email.", "danger")
            return redirect(url_for("admin_edit_user", user_id=user_id))
        
        try:
            # Update user data
            user.first_name = first_name
            user.last_name = last_name
            user.email = email
            user.location = location
            user.plz = plz
            
            # Only update password if provided
            if new_password:
                user.set_password(new_password)
            
            # Update balance if provided
            if balance is not None:
                user.balance = float(balance)
            
            # Handle user type change
            if user.user_type != user_type:
                # If changing to admin and no admin entry exists
                if user_type == "admin" and not Admin.query.filter_by(user_id=user.id).first():
                    new_admin = Admin(
                        user_id=user.id,
                        total_earnings=0.0
                    )
                    db.session.add(new_admin)
                
                # If changing to restaurant and no restaurant entry exists
                elif user_type == "restaurant" and not Restaurant.query.filter_by(user_id=user.id).first():
                    # Get the highest display_order
                    max_order = db.session.query(func.max(Restaurant.display_order)).scalar() or 0
                    
                    new_restaurant = Restaurant(
                        user_id=user.id,
                        name=f"{first_name}'s Restaurant",
                        address=location or "Address not provided",
                        city="Berlin",  # Default city
                        description="Restaurant description not provided",
                        image_url="/static/images/default_restaurant.jpg",
                        is_open=False,
                        display_order=max_order + 1
                    )
                    db.session.add(new_restaurant)
                
                # Update user type
                user.user_type = user_type
            
            db.session.commit()
            flash(f"User '{first_name} {last_name}' has been updated successfully!", "success")
            return redirect(url_for("admin_dashboard"))
            
        except Exception as e:
            db.session.rollback()
            flash(f"Error updating user: {str(e)}", "danger")
    
    return render_template("admin_user_form.html", user=user)

@app.route("/admin/users/delete/<int:user_id>", methods=["POST"])
@login_required
def admin_delete_user(user_id):
    """Delete a user from admin panel."""
    if current_user.user_type != "admin":
        flash("Unauthorized access! Admin privileges required.", "danger")
        return redirect(url_for("home"))
    
    # Prevent deleting yourself
    if user_id == current_user.id:
        flash("You cannot delete your own account while logged in.", "danger")
        return redirect(url_for("admin_dashboard"))
    
    user = User.query.get_or_404(user_id)
    
    try:
        # Handle different user types
        if user.user_type == "admin":
            # Delete admin entry
            Admin.query.filter_by(user_id=user.id).delete()
        
        elif user.user_type == "restaurant":
            # Get restaurant
            restaurant = Restaurant.query.filter_by(user_id=user.id).first()
            
            if restaurant:
                # Delete all related data
                # First, delete all orders related to this restaurant
                orders = Order.query.filter_by(restaurant_id=restaurant.id).all()
                for order in orders:
                    # Delete order items
                    OrderHasItems.query.filter_by(order_id=order.id).delete()
                    # Delete ratings
                    Rating.query.filter_by(order_id=order.id).delete()
                    # Delete payments
                    Payment.query.filter_by(order_id=order.id).delete()
                
                # Delete the orders
                Order.query.filter_by(restaurant_id=restaurant.id).delete()
                
                # Delete menu items
                Item.query.filter_by(restaurant_id=restaurant.id).delete()
                MenuItem.query.filter_by(restaurant_id=restaurant.id).delete()
                
                # Delete categories
                Category.query.filter_by(restaurant_id=restaurant.id).delete()
                
                # Delete the restaurant
                db.session.delete(restaurant)
        
        elif user.user_type == "customer":
            # Delete customer orders
            orders = Order.query.filter_by(user_id=user.id).all()
            for order in orders:
                # Delete order items
                OrderHasItems.query.filter_by(order_id=order.id).delete()
                # Delete ratings
                Rating.query.filter_by(order_id=order.id).delete()
                # Delete payments
                Payment.query.filter_by(order_id=order.id).delete()
            
            # Delete the orders
            Order.query.filter_by(user_id=user.id).delete()
        
        # Delete the user
        db.session.delete(user)
        db.session.commit()
        
        flash(f"User '{user.first_name} {user.last_name}' and all related data have been deleted successfully!", "success")
    except Exception as e:
        db.session.rollback()
        flash(f"Error deleting user: {str(e)}", "danger")
    
    return redirect(url_for("admin_dashboard"))

@app.route("/search")
def search():
    query = request.args.get('query', '').strip()
    
    if not query:
        return redirect(url_for('home'))
    
    # First, try direct database search by city name
    restaurants = Restaurant.query.filter(
        func.lower(Restaurant.city).like(f"%{query.lower()}%")
    ).order_by(Restaurant.display_order).all()
    
    # If no results, try using OpenStreetMap Nominatim API for geocoding
    if not restaurants:
        try:
            # Call Nominatim API to get location data
            nominatim_url = "https://nominatim.openstreetmap.org/search"
            params = {
                "q": query,
                "format": "json",
                "addressdetails": 1,
                "limit": 1
            }
            headers = {
                "User-Agent": "Lieferspatz/1.0"  # Required by Nominatim ToS
            }
            
            response = requests.get(nominatim_url, params=params, headers=headers)
            
            if response.status_code == 200 and response.json():
                location_data = response.json()[0]
                
                # Extract city, state, or country from the response
                address = location_data.get("address", {})
                city = address.get("city") or address.get("town") or address.get("village")
                state = address.get("state")
                country = address.get("country")
                
                # Search for restaurants in the found location
                if city:
                    restaurants = Restaurant.query.filter(
                        func.lower(Restaurant.city).like(f"%{city.lower()}%")
                    ).order_by(Restaurant.display_order).all()
                elif state:
                    # If no city found, try state
                    restaurants = Restaurant.query.filter(
                        func.lower(Restaurant.city).like(f"%{state.lower()}%")
                    ).order_by(Restaurant.display_order).all()
                
                # Update query to show what was found
                if city:
                    query = city
                elif state:
                    query = state
                elif country:
                    query = country
        except Exception as e:
            logger.error(f"Error in OpenStreetMap API call: {str(e)}")
    
    # Get all unique cities from the database for suggestions
    cities = db.session.query(Restaurant.city).distinct().all()
    city_list = [city[0] for city in cities if city[0]]
    
    return render_template(
        "search_results.html", 
        restaurants=restaurants, 
        query=query,
        cities=city_list
    )

# ============================ 🚀 RUN APP ============================ #
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        print("✅ Database initialized")
        
        # One-time fix to synchronize all restaurant balances with user balances
        try:
            print("🔄 Checking for restaurant balance synchronization issues...")
            restaurants = Restaurant.query.all()
            sync_count = 0
            
            for restaurant in restaurants:
                user = User.query.get(restaurant.user_id)
                if user and restaurant.balance != user.balance:
                    print(f"Found mismatch: Restaurant {restaurant.id} ({restaurant.balance}) != User {user.id} ({user.balance})")
                    # Always trust the restaurant balance as the source of truth
                    user.balance = restaurant.balance
                    sync_count += 1
            
            if sync_count > 0:
                db.session.commit()
                print(f"✅ Synchronized {sync_count} restaurant balances with user balances")
            else:
                print("✅ All restaurant balances are already in sync")
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error synchronizing balances: {str(e)}")
        
        for rule in app.url_map.iter_rules():
            print(rule)
    app.run(debug=True, host="127.0.0.1", port=5000)



