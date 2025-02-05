from app import app
from models import db, Item, MenuItem

def migrate_items_to_menu_items():
    with app.app_context():
        items = Item.query.all()
        for item in items:
            menu_item = MenuItem(
                name=item.name,
                price=item.price,
                restaurant_id=item.restaurant_id,
                description=item.description,
                image_url=item.image_url,
                category="default"  # Adjust as needed
            )
            db.session.add(menu_item)
        db.session.commit()
        print("Migration completed successfully.")

if __name__ == "__main__":
    migrate_items_to_menu_items()   