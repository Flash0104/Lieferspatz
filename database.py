from flask_sqlalchemy import SQLAlchemy

# Initialize SQLAlchemy instance
db = SQLAlchemy()

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
