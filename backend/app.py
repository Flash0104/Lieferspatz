from flask import Flask, jsonify, request
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
from init_db import Restaurant, Order, User, MenuItem, Base  # Import required models
from schemas import RestaurantSchema, OrderSchema  # Import schemas
from marshmallow import ValidationError

app = Flask(__name__)

# Connect to the SQLite database
engine = create_engine('sqlite:///../database/lieferspatz.db')
Session = sessionmaker(bind=engine)
session = Session()

# Initialize schemas
restaurant_schema = RestaurantSchema()
order_schema = OrderSchema()

@app.route("/")
def home():
    return jsonify({"message": "Welcome to Lieferspatz API"})

# Define OrderHistory model
class OrderHistory(Base):
    __tablename__ = 'order_history'
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey('orders.id'))
    status = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(engine)  # Create tables if they don't exist

# User Management Endpoints
@app.route("/user", methods=["POST"])
def create_user():
    data = request.get_json()
    name = data.get("name")
    address = data.get("address")

    if not name or not address:
        return jsonify({"error": "Name and address are required"}), 400

    new_user = User(name=name, address=address)
    session.add(new_user)
    session.commit()
    return jsonify({"message": "User created successfully!", "user_id": new_user.id})

@app.route("/user/<int:user_id>", methods=["PUT"])
def update_user(user_id):
    user = session.query(User).get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()
    user.name = data.get("name", user.name)
    user.address = data.get("address", user.address)
    session.commit()
    return jsonify({"message": "User updated successfully", "user_id": user.id})

@app.route("/user/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    user = session.query(User).get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    session.delete(user)
    session.commit()
    return jsonify({"message": "User deleted successfully", "user_id": user_id})

# Menu Item Management Endpoints
@app.route("/restaurant/<int:restaurant_id>/menu_item", methods=["POST"])
def create_menu_item(restaurant_id):
    data = request.get_json()
    name = data.get("name")
    description = data.get("description")
    price = data.get("price")

    if not name or not price:
        return jsonify({"error": "Name and price are required"}), 400

    new_menu_item = MenuItem(name=name, description=description, price=price, restaurant_id=restaurant_id)
    session.add(new_menu_item)
    session.commit()
    return jsonify({"message": "Menu item created successfully!", "menu_item_id": new_menu_item.id})

@app.route("/restaurant/<int:restaurant_id>/menu_items", methods=["GET"])
def get_menu_items(restaurant_id):
    menu_items = session.query(MenuItem).filter_by(restaurant_id=restaurant_id).all()
    menu_item_list = [{"id": item.id, "name": item.name, "description": item.description, "price": item.price} for item in menu_items]
    return jsonify(menu_item_list)

# Restaurant Management Endpoint
@app.route("/restaurant", methods=["POST"])
def create_restaurant():
    try:
        data = restaurant_schema.load(request.get_json())
        new_restaurant = Restaurant(**data)
        session.add(new_restaurant)
        session.commit()
        return jsonify({"message": "Restaurant created successfully!", "restaurant_id": new_restaurant.id})
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

# Order Management Endpoints
@app.route("/order", methods=["POST"])
def create_order():
    try:
        data = order_schema.load(request.get_json())
        new_order = Order(**data)
        session.add(new_order)
        session.commit()
        return jsonify({"message": "Order created successfully!", "order_id": new_order.id}), 201
    except ValidationError as err:
        return jsonify({"errors": err.messages}), 400

@app.route("/order/<int:order_id>/history", methods=["GET"])
def get_order_history(order_id):
    history = session.query(OrderHistory).filter_by(order_id=order_id).all()
    history_list = [{"status": h.status, "timestamp": h.timestamp} for h in history]
    return jsonify(history_list)

@app.route("/order/<int:order_id>", methods=["PUT"])
def update_order_status(order_id):
    data = request.get_json()
    new_status = data.get("status")

    if not new_status:
        return jsonify({"error": "Status is required"}), 400

    order = session.query(Order).get(order_id)
    if not order:
        return jsonify({"error": "Order not found"}), 404

    order.status = new_status
    session.commit()

    # Record order status in history
    new_history = OrderHistory(order_id=order.id, status=new_status)
    session.add(new_history)
    session.commit()

    return jsonify({"message": "Order status updated successfully", "order_id": order.id})

@app.route("/order/<int:order_id>", methods=["DELETE"])
def delete_order(order_id):
    order = session.query(Order).get(order_id)
    if not order:
        return jsonify({"error": "Order not found"}), 404

    session.delete(order)
    session.commit()
    return jsonify({"message": "Order deleted successfully", "order_id": order_id})

# Error Handlers
@app.errorhandler(404)
def not_found_error(error):
    return jsonify({"error": "Resource not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "An internal server error occurred"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
