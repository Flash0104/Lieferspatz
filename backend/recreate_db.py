# recreate_db.py
from sqlalchemy import create_engine
from init_db import Base, User, Restaurant, Order, MenuItem  # Ensure all models are imported

# Define the database connection
engine = create_engine('sqlite:///../database/lieferspatz.db')

# Drop all existing tables (optional: only if you want to start fresh)
Base.metadata.drop_all(engine)

# Recreate all tables
Base.metadata.create_all(engine)

print("Tables have been recreated successfully.")
