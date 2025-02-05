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
    balance = db.Column(db.Float, default=100.00, nullable=False)

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
    rating = db.Column(db.Integer, default=0, nullable=False)  

    user = db.relationship("User", backref="restaurant", uselist=False)

    @staticmethod
    def create_for_user(user):
        """Creates a Restaurant entry for a new restaurant user."""
        return Restaurant(
            user_id=user.id,
            name=f"{user.first_name} {user.last_name}",  # Auto-generate name
            address=user.location,
            city="Duisburg",  # Default city, should be updated later
            image_url="/static/images/default_restaurant.png",
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
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255))
    price = db.Column(db.Float, nullable=False)
    image_url = db.Column(db.String(255), default="/static/images/default_food.png")
    category = db.Column(db.String(50), nullable=False)
    restaurant_id = db.Column(db.Integer, db.ForeignKey("restaurant.id"), nullable=False)

    # ❌ Remove this line: `restaurant = db.relationship("Restaurant", back_populates="menu_items")`


# ============================ 🛒 ORDER & PAYMENT MODELS ============================ #
class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customer.id"), nullable=False)
    restaurant_id = db.Column(db.Integer, db.ForeignKey("restaurant.id"), nullable=False)
    total_price = db.Column(db.Float, default=0)
    order_status = db.Column(db.String(50), default="shopping")  # ✅ This is the correct column name
    order_date = db.Column(db.DateTime, server_default=db.func.current_timestamp())

    customer = db.relationship("Customer", backref="orders")
    restaurant = db.relationship("Restaurant", backref="orders")

class OrderHasItems(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("order.id"), nullable=False)
    item_id = db.Column(db.Integer, db.ForeignKey("item.id"), nullable=False)
    quantity = db.Column(db.Integer, default=1)

    order = db.relationship("Order", backref="order_items")
    item = db.relationship("Item", backref="order_items")

class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("order.id"), nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    transaction_status = db.Column(db.String(50), default="pending")  # paid, pending
    transaction_date = db.Column(db.DateTime, server_default=db.func.current_timestamp())

    order = db.relationship("Order", backref="payment")

# ============================ 🔧 DATABASE INITIALIZATION FUNCTION ============================ #
def init_db(app):
    db.init_app(app)
