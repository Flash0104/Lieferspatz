from app import app
from models import db, Restaurant

def add_credit_to_restaurants():
    with app.app_context():
        restaurants = Restaurant.query.all()
        for restaurant in restaurants:
            if restaurant.balance is None:
                restaurant.balance = 0  # Initialize balance if None
            restaurant.balance += 100  # Add 100 credit
        db.session.commit()
        print("Added 100 credit to each restaurant.")

if __name__ == "__main__":
    add_credit_to_restaurants()