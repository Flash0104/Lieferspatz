import os
from flask import Flask
from flask_migrate import Migrate
from dotenv import load_dotenv
from models import db, User, Restaurant, MenuItem, Item, Order, OrderHasItems, Category, Payment, Rating, Admin

# Load environment variables
load_dotenv()

# Create a minimal Flask app
app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize the database and migrations
db.init_app(app)
migrate = Migrate(app, db)

def setup_database():
    """Set up the PostgreSQL database schema."""
    with app.app_context():
        try:
            # Create all tables
            db.create_all()
            print("✅ Database tables created successfully!")
            
            # Check if there are any admin users
            admin_count = User.query.filter_by(user_type="admin").count()
            if admin_count == 0:
                print("⚠️ No admin users found. You should create an admin user after setup.")
            else:
                print(f"✅ Found {admin_count} existing admin users.")
                
            return True
        except Exception as e:
            print(f"❌ Error setting up database: {str(e)}")
            return False

if __name__ == "__main__":
    # Check if DATABASE_URL is set
    if not os.environ.get("DATABASE_URL"):
        print("❌ DATABASE_URL environment variable is not set!")
        print("Please set up your PostgreSQL database URL in the .env file.")
        exit(1)
        
    # Set up the database
    if setup_database():
        print("\n✅ Database setup complete!")
        print("\nNext steps:")
        print("1. Deploy your application to Vercel")
        print("2. Set up environment variables in the Vercel dashboard")
        print("3. Create an admin user through the application")
    else:
        print("\n❌ Database setup failed. Please check the error messages above.") 