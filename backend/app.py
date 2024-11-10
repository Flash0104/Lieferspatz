from flask import Flask, jsonify, request
from flask_cors import CORS
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
from init_db import Restaurant, Order, User, MenuItem, Base  # Import required models
from schemas import RestaurantSchema, OrderSchema  # Import schemas
from marshmallow import ValidationError
from auth.auth_routes import auth_bp
from auth.jwt_utils import verify_jwt_token

app = Flask(__name__)  # Define the app instance first
CORS(app)  # Enable CORS

# Register the authentication blueprint with a prefix
app.register_blueprint(auth_bp, url_prefix="/auth")

# Connect to the SQLite database
engine = create_engine('sqlite:///../database/lieferspatz.db')
Session = sessionmaker(bind=engine)
session = Session()

# Initialize schemas
restaurant_schema = RestaurantSchema()
order_schema = OrderSchema()

@app.route('/')
def home():
    return "Welcome to Lieferspatz!"

# Define OrderHistory model
class OrderHistory(Base):
    __tablename__ = 'order_history'
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey('orders.id'))
    status = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(engine)  # Create tables if they don't exist

@app.route('/protected-endpoint', methods=['GET'])
def protected_endpoint():
    auth_header = request.headers.get('Authorization')
    if auth_header:
        token = auth_header.split(" ")[1]  # Extract token from "Bearer <token>"
        user = verify_jwt_token(token)
        if user:
            return jsonify({"message": "This is a protected route.", "user_id": user["user_id"]})
        else:
            return jsonify({"error": "Invalid or expired token"}), 401
    return jsonify({"error": "Token required"}), 403

# Error Handlers
@app.errorhandler(404)
def not_found_error(error):
    return jsonify({"error": "Resource not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "An internal server error occurred"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
