from flask_sqlalchemy import SQLAlchemy
from app import app, db, User, Restaurant  # Import necessary models

# List of cities
cities = ["Duisburg", "Essen", "Düsseldorf"]

# List of sample restaurant names
restaurant_names = [
    "The Gourmet Spot", "Tasty Treats", "Flavor Fusion", "The Hungry Chef",
    "Savory Bites", "Culinary Haven", "Delightful Dishes", "Epicurean Eats"
]

# Sample restaurant types (cuisine types)
restaurant_types = ["Italian", "Vegan", "BBQ", "Sushi", "Mexican", "Burgers", "Indian", "Chinese"]

def create_restaurant_user(email, password, first_name, last_name, location, plz):
    """Creates a restaurant user and returns the user object."""
    user = User(
        email=email,
        first_name=first_name,
        last_name=last_name,
        location=location,
        plz=plz,
        user_type="restaurant"
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return user

def seed_restaurants():
    """Seeds the database with restaurant users and their corresponding restaurants."""
    db.session.query(Restaurant).delete()  # Clear existing restaurant data
    db.session.query(User).filter(User.user_type == "restaurant").delete()  # Clear existing restaurant users
    db.session.commit()

    restaurant_count_per_city = 8

    for city in cities:
        for i in range(restaurant_count_per_city):
            # Generate a unique email for the restaurant
            email = f"{city.lower()}_{i+1}@lieferspatz.com"
            password = "password123"  # Default password
            first_name = restaurant_names[i]
            last_name = "Restaurant"
            location = f"Random Street {i+1}, {city}, Germany"
            plz = f"47{i+1}00"

            # Create a restaurant user
            user = create_restaurant_user(email, password, first_name, last_name, location, plz)

            # Create a restaurant linked to the user
            restaurant = Restaurant(
                user_id=user.id,
                name=f"{restaurant_names[i]} in {city}",
                address=location,
                city=city,
                image_url=f"/static/images/{restaurant_types[i % len(restaurant_types)]}.png",
                description=f"Enjoy authentic {restaurant_types[i % len(restaurant_types)]} cuisine at {restaurant_names[i]} in {city}, located at {location}.",
                rating=0
            )

            db.session.add(restaurant)

    db.session.commit()
    print("✅ Successfully seeded restaurants!")

if __name__ == "__main__":
    with app.app_context():
        seed_restaurants()
