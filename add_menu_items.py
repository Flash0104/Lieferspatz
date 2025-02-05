from app import app, db
from models import User, Restaurant, Item, Category

def add_menu_items():
    with app.app_context():
        # Create or get a user
        user = User.query.filter_by(email="restaurant@example.com").first()
        if not user:
            user = User(
                email="restaurant@example.com",
                first_name="Gourmet",
                last_name="Spot",
                location="Random Street 1, Duisburg",
                plz="12345",
                user_type="restaurant"
            )
            user.set_password("password")  # Set a password
            db.session.add(user)
            db.session.commit()

        # Get the correct restaurant
        restaurant = Restaurant.query.filter_by(name="The Gourmet Spot").first()
        if not restaurant:
            restaurant = Restaurant(
                user_id=user.id,
                name="The Gourmet Spot",
                address="Random Street 1, Duisburg",
                city="Duisburg"
            )
            db.session.add(restaurant)
            db.session.commit()

        # Example categories
        main_dishes_category = Category.query.filter_by(name="Main Dishes", restaurant_id=restaurant.id).first()
        if not main_dishes_category:
            main_dishes_category = Category(name="Main Dishes", restaurant_id=restaurant.id)
            db.session.add(main_dishes_category)
            db.session.commit()

        drinks_category = Category.query.filter_by(name="Drinks", restaurant_id=restaurant.id).first()
        if not drinks_category:
            drinks_category = Category(name="Drinks", restaurant_id=restaurant.id)
            db.session.add(drinks_category)
            db.session.commit()

        # Add menu items
        items = [
            # Main Dishes
            Item(name="Grilled Chicken", description="Juicy grilled chicken with herbs", price=12.99, category_id=main_dishes_category.id, restaurant_id=restaurant.id),
            Item(name="Pasta Primavera", description="Pasta with fresh vegetables", price=10.99, category_id=main_dishes_category.id, restaurant_id=restaurant.id),
            Item(name="Caesar Salad", description="Crisp romaine lettuce with Caesar dressing", price=8.99, category_id=main_dishes_category.id, restaurant_id=restaurant.id),
            # Drinks
            Item(name="Lemonade", description="Refreshing homemade lemonade", price=3.99, category_id=drinks_category.id, restaurant_id=restaurant.id),
            Item(name="Iced Tea", description="Chilled iced tea with lemon", price=3.49, category_id=drinks_category.id, restaurant_id=restaurant.id)
        ]

        db.session.bulk_save_objects(items)
        db.session.commit()
        print("Menu items added successfully!")

if __name__ == "__main__":
    add_menu_items() 