import os
import requests
import json
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, session, make_response
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user, AnonymousUserMixin
from flask_cors import CORS
from models import db, init_db, User, Customer, Restaurant, Category, Item, Order, OrderHasItems, Payment, MenuItem, Menu   # Import models

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
@login_required
def home():
    city = request.args.get("city", "Duisburg")
    user = current_user if current_user.is_authenticated else None
    restaurants = Restaurant.query.filter_by(city=city).all()
    user_balance = current_user.balance if current_user.is_authenticated else 0.0
    return render_template("index.html", restaurants=restaurants, city=city, user=user, user_balance=user_balance)

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
    return jsonify({"logged_in": "user_id" in session})



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

        # 🔥 If user is a restaurant, create a restaurant entry
        if user_type == "restaurant":
            new_restaurant = Restaurant.create_for_user(new_user)
            db.session.add(new_restaurant)
            db.session.commit()

        flash("Registration successful! You can now login.", "success")
        return redirect(url_for("login"))

    return render_template("register.html")





@app.route("/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    session.clear()
    return jsonify({"message": "Logged out successfully!"}), 200






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

    if request.method == "POST":
        name = request.form.get("name")
        description = request.form.get("description")
        price = request.form.get("price")
        image_url = request.form.get("image_url") or "/static/images/default_food.png"
        category_name = request.form.get("category_name").strip()

        # 🛑 Prevent duplicate categories by checking if it already exists
        existing_category = Category.query.filter_by(name=category_name).first()
        if existing_category:
            category_id = existing_category.id
        else:
            new_category = Category(name=category_name)
            db.session.add(new_category)
            db.session.commit()
            category_id = new_category.id

        new_item = Item(
            name=name,
            description=description,
            price=float(price),
            image_url=image_url,
            category_id=category_id,
            restaurant_id=current_user.id
        )

        db.session.add(new_item)
        db.session.commit()
        flash("Menu item added successfully!", "success")
        return redirect(url_for("restaurant_menu", restaurant_id=current_user.id))

    categories = Category.query.distinct(Category.name).all()  # Fetch distinct categories
    return render_template("add_menu_item.html", categories=categories)



# ============================ 🆕 ORDER MANAGEMENT ROUTES ============================ #
@app.route("/restaurant/orders")
@login_required
def restaurant_orders():
    """Displays current and completed orders for a restaurant."""
    if current_user.user_type != "restaurant":
        flash("Unauthorized access!", "danger")
        return redirect(url_for("home"))

    current_orders = Order.query.filter_by(restaurant_id=current_user.id, order_status="pending").all()
    completed_orders = Order.query.filter_by(restaurant_id=current_user.id, order_status="completed").all()


    return render_template("order.html", current_orders=current_orders, completed_orders=completed_orders)


@app.route("/restaurant/orders/<int:order_id>/accept", methods=["POST"])
@login_required
def accept_order(order_id):
    """Allows restaurant to accept an order."""
    if current_user.user_type != "restaurant":
        flash("Unauthorized action!", "danger")
        return redirect(url_for("home"))

    order = Order.query.get_or_404(order_id)
    order.status = "accepted"
    db.session.commit()
    flash("Order accepted!", "success")
    return redirect(url_for("restaurant_orders"))


@app.route("/restaurant/orders/<int:order_id>/cancel", methods=["POST"])
@login_required
def cancel_order(order_id):
    """Allows restaurant to cancel an order."""
    if current_user.user_type != "restaurant":
        flash("Unauthorized action!", "danger")
        return redirect(url_for("home"))

    order = Order.query.get_or_404(order_id)
    order.status = "canceled"
    db.session.commit()
    flash("Order canceled.", "warning")
    return redirect(url_for("restaurant_orders"))


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
    menu_items = MenuItem.query.filter_by(restaurant_id=restaurant_id).all()
    categories = {}
    
    for item in menu_items:
        category_name = item.category if item.category else "Uncategorized"
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


@app.route("/api/cart", methods=["GET"])
@login_required
def api_view_cart():
    cart = session.get("cart", {})
    total_price = sum(item["price"] * item["quantity"] for item in cart.values())

    return jsonify({
        "items": [{"id": key, **value} for key, value in cart.items()],
        "total": total_price
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
@login_required
def checkout():
    if current_user.user_type != 'customer':
        flash("Unauthorized action!", "danger")
        return redirect(url_for('home'))

    cart = session.get("cart", {})
    print("Cart at Checkout:", cart)  # Debugging line

    if request.method == "POST":
        if not cart:
            flash("Your cart is empty.", "warning")
            return redirect(url_for("view_cart"))

        total_fee = sum(item["price"] * item["quantity"] for item in cart.values())
        order = Order(user_id=current_user.id, total_price=total_fee, status='pending')
        db.session.add(order)
        db.session.commit()

        for item_id, item in cart.items():
            order_item = OrderHasItems(order_id=order.id, item_id=int(item_id), quantity=item["quantity"])
            db.session.add(order_item)

        db.session.commit()

        session.pop("cart", None)
        print("Order Created:", order.id)  # Debugging line
        flash("Order placed successfully!", "success")
        return redirect(url_for("order_history"))

    return render_template("checkout.html", cart=cart)



@app.route("/order_history")
@login_required
def order_history():
    current_order = None  # Fetch current order if applicable
    previous_orders = []  # Fetch previous orders if applicable
    cart_items = session.get("cart", {}).values()
    user_balance = current_user.balance  # Retrieve balance from the user model
    return render_template("order_history.html", current_order=current_order, previous_orders=previous_orders, cart_items=cart_items, user_balance=user_balance)

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
def add_to_cart(item_id, quantity):
    item = MenuItem.query.get(item_id)
    if item:
        cart = session.get("cart", {})
        cart[item_id] = {
            'name': item.name,
            'price': item.price,
            'quantity': quantity,
            'restaurant_id': item.restaurant_id
        }
        session["cart"] = cart
        print(cart)  # Debugging: Check cart contents
        return jsonify({'success': True, 'message': 'Item added to cart'})
    return jsonify({'success': False, 'message': 'Item not found'}), 404

@app.context_processor
def inject_cart_count():
    cart = session.get("cart", {})
    cart_count = sum(item["quantity"] for item in cart.values()) if cart else 0
    return dict(cart_count=cart_count)

@app.route('/submit_order', methods=['POST'])
@login_required
def submit_order():
    user = current_user
    cart = session.get("cart", {})
    cart_total = calculate_cart_total(cart)
    restaurant = get_restaurant_from_cart(cart)

    if not restaurant:
        return jsonify({'success': False, 'message': 'Restaurant not found'}), 400

    if user.balance >= cart_total:
        user.balance -= cart_total
        restaurant.balance += cart_total
        db.session.commit()
        return jsonify({'success': True, 'message': 'Order submitted successfully!'})
    else:
        return jsonify({'success': False, 'message': 'Insufficient balance'}), 400

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
    item = MenuItem.query.get(item_id)
    if item:
        cart[item_id] = {
            'name': item.name,
            'price': item.price,
            'quantity': quantity,
            'restaurant_id': item.restaurant_id  # Ensure this is included
        }

# ============================ 🚀 RUN APP ============================ #
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        print("✅ Database initialized")
        for rule in app.url_map.iter_rules():
            print(rule)
    app.run(debug=True, host="127.0.0.1", port=5000)



