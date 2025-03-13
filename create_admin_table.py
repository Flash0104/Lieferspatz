import os
import sys
from flask import Flask
from models import db, Admin, User

# Create a minimal Flask app
app = Flask(__name__)
basedir = os.path.abspath(os.path.dirname(__file__))
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{os.path.join(basedir, 'instance', 'database.sqlite')}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = "your_secret_key"

# Initialize the database
db.init_app(app)

def create_admin_table():
    """Create Admin table and entries for existing admin users."""
    with app.app_context():
        try:
            # Check if the table already exists
            try:
                Admin.query.first()
                print("✅ Admin table already exists")
                
                # Check if all admin users have Admin entries
                admin_users = User.query.filter_by(user_type="admin").all()
                admin_entries = Admin.query.all()
                admin_user_ids = [admin.user_id for admin in admin_entries]
                
                # Create Admin entries for admin users that don't have one
                new_entries = 0
                for user in admin_users:
                    if user.id not in admin_user_ids:
                        admin = Admin(user_id=user.id, total_earnings=0.0)
                        db.session.add(admin)
                        new_entries += 1
                
                if new_entries > 0:
                    db.session.commit()
                    print(f"✅ Created {new_entries} new Admin entries for existing admin users")
                else:
                    print("✅ All admin users already have Admin entries")
                
                return
            except Exception:
                # Table doesn't exist, proceed with creation
                pass
            
            # Create the Admin table
            db.create_all()
            
            # Create Admin entries for existing admin users
            admin_users = User.query.filter_by(user_type="admin").all()
            for user in admin_users:
                admin = Admin(user_id=user.id, total_earnings=0.0)
                db.session.add(admin)
            
            db.session.commit()
            print(f"✅ Successfully created Admin table")
            print(f"✅ Created Admin entries for {len(admin_users)} admin users")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error creating Admin table: {str(e)}")
            sys.exit(1)

if __name__ == "__main__":
    create_admin_table() 