from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from flask_bcrypt import generate_password_hash, check_password_hash

# Initialize SQLAlchemy
db = SQLAlchemy()

# ============================ 🛠️ USER MODELS ============================ #
class User(db.Model, UserMixin):
    """User model for authentication."""
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    user_type = db.Column(db.String(50), nullable=False, default="customer")  # "customer" or "restaurant"

    # Additional Fields
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(255), nullable=False)
    plz = db.Column(db.String(10), nullable=False)
    
    # Balance Field
    balance = db.Column(db.Float, default=0.0)

    def set_password(self, password):
        """Hashes the password and stores it."""
        self.password_hash = generate_password_hash(password).decode("utf-8")

    def check_password(self, password):
        """Verifies the password hash."""
        return check_password_hash(self.password_hash, password)


# ============================ 🛠️ CUSTOMER MODEL ============================ #
class Customer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, unique=True)
    address = db.Column(db.String(255))
    postal_code = db.Column(db.String(20))
    
    user = db.relationship("User", backref="customer", uselist=False)  # One-to-One relationship

# ============================ 🏢 RESTAURANT MODEL ============================ #
class Restaurant(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, unique=True)
    name = db.Column(db.String(150), nullable=False)
    address = db.Column(db.String(255), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    image_url = db.Column(db.String(255))
    description = db.Column(db.Text)
    rating = db.Column(db.Float, default=0.0, nullable=False)  
    balance = db.Column(db.Float, default=0.0)
    is_open = db.Column(db.Boolean, default=False)
    display_order = db.Column(db.Integer, default=0)  # New field for ordering restaurants
    menu_items = db.relationship('MenuItem', backref='restaurant', lazy=True)

    user = db.relationship("User", backref="restaurant", uselist=False)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "address": self.address,
            "city": self.city,
            "image_url": self.image_url or "/static/images/default_restaurant.png",
            "description": self.description,
            "rating": self.rating,
            "is_open": self.is_open
        }

    @staticmethod
    def create_for_user(user):
        """Creates a Restaurant entry for a new restaurant user."""
        return Restaurant(
            user_id=user.id,
            name=f"{user.first_name} {user.last_name}",  # Auto-generate name
            address=user.location,
            city="Duisburg",  # Default city, should be updated later
            image_url="/static/images/default_restaurant.png",
            is_open=False,
        )



# ============================ 📖 MENU & CATEGORY MODELS ============================ #
class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    restaurant_id = db.Column(db.Integer, db.ForeignKey("restaurant.id"), nullable=False)

    restaurant = db.relationship("Restaurant", backref="categories")
    items = db.relationship("Item", backref="category")

class Item(db.Model):  # ✅ Keep this as the main item model
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255), nullable=True)
    price = db.Column(db.Float, nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurant.id'), nullable=False)
    image_url = db.Column(db.String(255), nullable=True, default="/static/images/default_food.png")


class Menu(db.Model):
    __tablename__ = 'menu'  # ✅ Ensure the table name is correct
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurant.id'), nullable=False)


class MenuItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    price = db.Column(db.Float, nullable=False)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurant.id'), nullable=False)
    description = db.Column(db.String(255))
    image_url = db.Column(db.String(255), default="/static/images/default_food.png")
    category = db.Column(db.String(50), nullable=False)

    # ❌ Remove this line: `restaurant = db.relationship("Restaurant", back_populates="menu_items")`


# ============================ 🛒 ORDER & PAYMENT MODELS ============================ #
class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customer.id"), nullable=False)
    restaurant_id = db.Column(db.Integer, db.ForeignKey("restaurant.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    total_price = db.Column(db.Float, default=0)
    original_fee = db.Column(db.Float, default=0)  # Original fee for restaurant
    service_fee = db.Column(db.Float, default=0)   # Service fee for admin
    order_status = db.Column(db.String(50), default="shopping")
    order_date = db.Column(db.DateTime, server_default=db.func.current_timestamp())
    status = db.Column(db.String(50), default='pending')
    cashback_applied = db.Column(db.Boolean, default=False)
    items = db.relationship('OrderHasItems', backref='order_items', lazy=True, overlaps="order_items")

    customer = db.relationship("Customer", backref="orders")
    restaurant = db.relationship("Restaurant", backref="orders")

class OrderHasItems(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("order.id"), nullable=False)
    item_id = db.Column(db.Integer, db.ForeignKey("item.id"), nullable=False)
    quantity = db.Column(db.Integer, default=1)

    order = db.relationship("Order", backref="order_items", overlaps="items")
    item = db.relationship("Item", backref="order_items")

class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("order.id"), nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    transaction_status = db.Column(db.String(50), default="pending")  # paid, pending
    transaction_date = db.Column(db.DateTime, server_default=db.func.current_timestamp())

    order = db.relationship("Order", backref="payment")

# ============================ ⭐ RATING MODEL ============================ #
class Rating(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    restaurant_id = db.Column(db.Integer, db.ForeignKey("restaurant.id"), nullable=False)
    order_id = db.Column(db.Integer, db.ForeignKey("order.id"), nullable=False, unique=True)
    rating = db.Column(db.Float, nullable=False)  # Rating from 0 to 5, with 0.5 increments
    created_at = db.Column(db.DateTime, server_default=db.func.current_timestamp())
    
    # Relationships
    user = db.relationship("User", backref="ratings")
    restaurant = db.relationship("Restaurant", backref="ratings")
    order = db.relationship("Order", backref="rating", uselist=False)

# ============================ 👑 ADMIN MODEL ============================ #
class Admin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, unique=True)
    total_earnings = db.Column(db.Float, default=0.0)  # Total earnings from service fees
    
    user = db.relationship("User", backref="admin", uselist=False)
    
    @staticmethod
    def create_for_user(user):
        """Creates an Admin entry for a new admin user."""
        return Admin(
            user_id=user.id,
            total_earnings=0.0
        )

# ============================ 🔧 DATABASE INITIALIZATION FUNCTION ============================ #
def init_db(app):
    db.init_app(app)
