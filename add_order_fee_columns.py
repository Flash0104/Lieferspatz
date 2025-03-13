import os
import sys
from flask import Flask
from models import db, Order

# Create a minimal Flask app
app = Flask(__name__)
basedir = os.path.abspath(os.path.dirname(__file__))
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{os.path.join(basedir, 'instance', 'database.sqlite')}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = "your_secret_key"

# Initialize the database
db.init_app(app)

def add_order_fee_columns():
    """Add service_fee and original_fee columns to Order table."""
    with app.app_context():
        try:
            # Check if the columns already exist
            try:
                # Try to query using the columns
                Order.query.filter(Order.service_fee > 0).first()
                print("✅ Fee columns already exist")
                return
            except Exception:
                # Columns don't exist, proceed with migration
                pass
            
            # Execute raw SQL to add the columns
            db.session.execute(db.text("ALTER TABLE 'order' ADD COLUMN service_fee FLOAT DEFAULT 0"))
            db.session.execute(db.text("ALTER TABLE 'order' ADD COLUMN original_fee FLOAT DEFAULT 0"))
            
            # Update existing orders to set the fees based on total_price
            # Service fee is 15% of the original fee (which is 85% of total)
            # Original fee is 85% of total
            orders = Order.query.all()
            for order in orders:
                if order.total_price > 0:
                    # Calculate fees
                    order.original_fee = order.total_price * 0.85
                    order.service_fee = order.total_price * 0.15
            
            db.session.commit()
            print(f"✅ Successfully added fee columns to Order table")
            print(f"✅ Updated fee values for {len(orders)} orders")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error adding fee columns: {str(e)}")
            sys.exit(1)

if __name__ == "__main__":
    add_order_fee_columns() 