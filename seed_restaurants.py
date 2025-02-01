import os
from flask import Flask
from models import db, Restaurant, User

# Initialize Flask App (Temporary)
app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{os.path.join(os.getcwd(), 'instance', 'database.sqlite')}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)

# Cities and sample restaurants
cities = [
    "Duisburg", "Essen", "Düsseldorf", "Köln", "Bonn", "Hamburg", "München", "Berlin"
]

sample_restaurants = [
    {"name": "McDonald's", "image_url": "/static/images/mcdonalds.png"},
    {"name": "Sushi Paradise", "image_url": "/static/images/sushi.png"},
    {"name": "Pizza Palace", "image_url": "/static/images/pizza.png"},
    {"name": "Steak Haven", "image_url": "/static/images/steak.png"},
    {"name": "Bakery Bliss", "image_url": "/static/images/bakery.png"},
    {"name": "Vegan Delights", "image_url": "/static/images/vegan.png"},
    {"name": "Noodle Nook", "image_url": "/static/images/noodle.png"},
    {"name": "Seafood Corner", "image_url": "/static/images/seafood.png"},
]

def seed_database():
    with app.app_context():
        db.create_all()  # Ensure tables exist
        
        # Check if restaurants exist
        if Restaurant.query.first():
            print("✅ Restaurants already exist. No need to seed again.")
            return
        
        # Add restaurants
        for city in cities:
            for restaurant in sample_restaurants:
                new_restaurant = Restaurant(
                    user_id=1,  # Assuming a default restaurant user (update if necessary)
                    name=f"{restaurant['name']} ({city})",
                    address=f"123 Main St, {city}, Germany",
                    city=city,
                    image_url=restaurant["image_url"],
                    description=f"Delicious {restaurant['name']} in {city}!"
                )
                db.session.add(new_restaurant)

        db.session.commit()
        print("✅ Restaurant data seeded successfully!")

if __name__ == "__main__":
    seed_database()
