import os
from flask import Flask
from models import db, Restaurant, Item

# Initialize Flask App
app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{os.path.join(os.getcwd(), 'instance', 'database.sqlite')}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db.init_app(app)

def clear_database():
    with app.app_context():
        try:
            # Delete all menu items first (to avoid foreign key constraint errors)
            num_items_deleted = db.session.query(Item).delete()
            num_restaurants_deleted = db.session.query(Restaurant).delete()
            db.session.commit()
            print(f"🗑️ Deleted {num_items_deleted} menu items and {num_restaurants_deleted} restaurants successfully.")
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error while clearing database: {e}")

if __name__ == "__main__":
    clear_database()
