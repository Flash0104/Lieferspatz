from flask_sqlalchemy import SQLAlchemy
import os

# Initialize SQLAlchemy instance
db = SQLAlchemy()

def get_database_url():
    """Get the database URL from environment variables or use SQLite as fallback."""
    # For production (Vercel)
    if os.environ.get('DATABASE_URL'):
        # Ensure the URL starts with postgresql:// instead of postgres://
        # (SQLAlchemy 1.4.x+ requirement)
        db_url = os.environ.get('DATABASE_URL')
        if db_url.startswith('postgres://'):
            db_url = db_url.replace('postgres://', 'postgresql://', 1)
        return db_url
    
    # For local development
    return 'sqlite:///instance/database.sqlite'

def create_tables(app):
    """Create tables using Flask-SQLAlchemy within app context."""
    with app.app_context():
        db.create_all()
        print("✅ Database and tables created successfully!")

def reset_database(app):
    """Deletes all data from database tables."""
    with app.app_context():
        db.session.execute("DELETE FROM customer")
        db.session.execute("DELETE FROM restaurant")
        db.session.execute("DELETE FROM category")
        db.session.execute("DELETE FROM item")
        db.session.execute("DELETE FROM food_order")
        db.session.execute("DELETE FROM order_has_items")
        db.session.execute("DELETE FROM payment")
        db.session.commit()
        print("✅ Database has been reset!")
