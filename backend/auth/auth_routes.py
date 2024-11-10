from flask import Blueprint, request, jsonify
from auth.auth_utils import hash_password, verify_password, get_user_by_username
from auth.jwt_utils import create_jwt_token, verify_jwt_token
from init_db import User, get_db_session  # Assuming get_db_session provides a new session for each request

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    with get_db_session() as session:
        if get_user_by_username(session, username):
            return jsonify({"error": "Username already taken"}), 400

        new_user = User(username=username, password=hash_password(password))
        session.add(new_user)
        session.commit()

    return jsonify({"message": "User registered successfully"}), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    with get_db_session() as session:
        user = get_user_by_username(session, username)
        if not user or not verify_password(password, user.password):
            return jsonify({"error": "Invalid credentials"}), 401

    token = create_jwt_token(user.id)
    return jsonify({"token": token}), 200

@auth_bp.route('/protected-endpoint', methods=['GET'])
def protected_endpoint():
    auth_header = request.headers.get('Authorization')
    if auth_header:
        token = auth_header.split(" ")[1]  # Extract token from "Bearer <token>"
        user_data = verify_jwt_token(token)
        if user_data:
            return jsonify({"message": "This is a protected route.", "user_id": user_data["user_id"]})
        else:
            return jsonify({"error": "Invalid or expired token"}), 401
    return jsonify({"error": "Token required"}), 403
