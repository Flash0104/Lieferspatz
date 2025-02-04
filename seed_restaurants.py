import os
import random
from flask import Flask
from models import db, Restaurant, Item, Category

# Initialize Flask App
app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{os.path.join(os.getcwd(), 'instance', 'database.sqlite')}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db.init_app(app)

# -------------------------
# Cities with realistic addresses
# -------------------------
cities = {
    "Duisburg": [
        "Königstraße 5, Duisburg, Germany",
        "Claubergstraße 9, Duisburg, Germany",
        "Sonnenwall 35, Duisburg, Germany",
        "Friedrich-Wilhelm-Platz 3, Duisburg, Germany",
        "Mercatorstraße 15, Duisburg, Germany",
        "Dellplatz 20, Duisburg, Germany",
        "Neudorfer Str. 60, Duisburg, Germany",
        "Münzstraße 12, Duisburg, Germany"
    ],
    "Essen": [
        "Kettwiger Str. 22, Essen, Germany",
        "Limbecker Platz 1, Essen, Germany",
        "Rüttenscheider Str. 150, Essen, Germany",
        "Viehofer Str. 36, Essen, Germany",
        "Steeler Str. 45, Essen, Germany",
        "Hollestraße 28, Essen, Germany",
        "Gladbecker Str. 95, Essen, Germany",
        "Friedrich-Ebert-Straße 27, Essen, Germany"
    ],
    "Düsseldorf": [
        "Schadowstraße 50, Düsseldorf, Germany",
        "Königsallee 45, Düsseldorf, Germany",
        "Immermannstraße 18, Düsseldorf, Germany",
        "Berliner Allee 32, Düsseldorf, Germany",
        "Graf-Adolf-Straße 15, Düsseldorf, Germany",
        "Heinrich-Heine-Allee 25, Düsseldorf, Germany",
        "Kasernenstraße 48, Düsseldorf, Germany",
        "Flingernstraße 60, Düsseldorf, Germany"
    ],
    "Köln": [
        "Hohe Straße 120, Köln, Germany",
        "Breite Straße 32, Köln, Germany",
        "Schildergasse 80, Köln, Germany",
        "Hohenzollernring 21, Köln, Germany",
        "Eigelstein 15, Köln, Germany",
        "Friesenstraße 60, Köln, Germany",
        "Neumarkt 40, Köln, Germany",
        "Venloer Straße 100, Köln, Germany"
    ],
    "Bonn": [
        "Sternstraße 45, Bonn, Germany",
        "Münsterplatz 14, Bonn, Germany",
        "Markt 12, Bonn, Germany",
        "Oxfordstraße 25, Bonn, Germany",
        "Adenauerallee 100, Bonn, Germany",
        "Poppelsdorfer Allee 55, Bonn, Germany",
        "Kaiserplatz 6, Bonn, Germany",
        "Rheingasse 70, Bonn, Germany"
    ],
    "Hamburg": [
        "Mönckebergstraße 19, Hamburg, Germany",
        "Jungfernstieg 30, Hamburg, Germany",
        "Reeperbahn 50, Hamburg, Germany",
        "Große Bleichen 22, Hamburg, Germany",
        "Gänsemarkt 18, Hamburg, Germany",
        "Lange Reihe 47, Hamburg, Germany",
        "Rathausmarkt 8, Hamburg, Germany",
        "Schulterblatt 100, Hamburg, Germany"
    ],
    "München": [
        "Marienplatz 3, München, Germany",
        "Kaufingerstraße 45, München, Germany",
        "Viktualienmarkt 10, München, Germany",
        "Maximilianstraße 25, München, Germany",
        "Schwabinger Tor 60, München, Germany",
        "Theresienstraße 85, München, Germany",
        "Gärtnerplatz 20, München, Germany",
        "Leopoldstraße 40, München, Germany"
    ],
    "Berlin": [
        "Alexanderplatz 7, Berlin, Germany",
        "Friedrichstraße 50, Berlin, Germany",
        "Unter den Linden 30, Berlin, Germany",
        "Kurfürstendamm 70, Berlin, Germany",
        "Prenzlauer Allee 100, Berlin, Germany",
        "Torstraße 85, Berlin, Germany",
        "Karl-Marx-Allee 50, Berlin, Germany",
        "Potsdamer Platz 20, Berlin, Germany"
    ]
}

# -------------------------
# Cuisines and Restaurant Names
# -------------------------
cuisines = [
    "Traditional German",
    "Italian",
    "Turkish",
    "Japanese",
    "American",
    "French",
    "Vegan",
    "Seafood"
]

restaurant_names = {
    "Traditional German": [
        "Bayerischer Hof", "Zum Goldenen Löwen", "Gasthaus zur Eiche", "Zur alten Mühle", "Der Königliche Schmaus"
    ],
    "Italian": [
        "La Bella Vita", "Trattoria da Luigi", "Il Forno", "Ristorante Roma", "Osteria del Sole"
    ],
    "Turkish": [
        "Istanbul Delights", "Anatolian Feast", "Sultan's Table", "Kebap Kervan", "Bosporus Bites"
    ],
    "Japanese": [
        "Sakura Garden", "Tokyo Diner", "Samurai Sushi", "Zen Eatery", "Nippon Nook"
    ],
    "American": [
        "Liberty Grill", "Route 66 Diner", "Stars & Stripes Eatery", "The Americana", "Burger Barn"
    ],
    "French": [
        "Le Petit Café", "Bistro Belle", "Chez Amélie", "La Vie en Rose", "Café de Paris"
    ],
    "Vegan": [
        "Green Leaf", "Vegan Vitality", "Plant Power", "Herbivore Haven", "The Vegan Vibe"
    ],
    "Seafood": [
        "Ocean's Catch", "Neptun's Table", "The Fisherman's Wharf", "Blue Wave", "Maritime Morsels"
    ]
}

# -------------------------
# Menu Items per Cuisine (10 items: 5 dishes, 3 drinks, 2 sweets)
# -------------------------
menu_items = {
    "Traditional German": {
        "dishes": [
            ("Wiener Schnitzel", 14.99),
            ("Bratwurst with Sauerkraut", 9.99),
            ("Käsespätzle", 10.99),
            ("Schweinshaxe", 18.99),
            ("Currywurst", 8.99)
        ],
        "drinks": [
            ("Bavarian Beer", 4.50),
            ("Radler", 3.50),
            ("Apfelschorle", 2.99)
        ],
        "sweets": [
            ("Black Forest Cake", 5.50),
            ("Bienenstich", 4.99)
        ]
    },
    "Italian": {
        "dishes": [
            ("Pizza Margherita", 11.50),
            ("Pasta Carbonara", 12.99),
            ("Lasagna", 14.50),
            ("Risotto", 13.50),
            ("Gnocchi", 10.50)
        ],
        "drinks": [
            ("Espresso", 2.99),
            ("Chianti Wine", 6.50),
            ("Limoncello", 4.50)
        ],
        "sweets": [
            ("Tiramisu", 6.99),
            ("Gelato", 4.99)
        ]
    },
    "Turkish": {
        "dishes": [
            ("Döner Kebab", 7.99),
            ("Lahmacun", 6.50),
            ("Iskender Kebab", 12.99),
            ("Adana Kebab", 11.99),
            ("Köfte", 9.50)
        ],
        "drinks": [
            ("Turkish Tea", 2.50),
            ("Ayran", 2.50),
            ("Rakı", 5.99)
        ],
        "sweets": [
            ("Baklava", 4.99),
            ("Turkish Delight", 3.99)
        ]
    },
    "Japanese": {
        "dishes": [
            ("Sushi Platter", 15.50),
            ("Ramen Soup", 13.99),
            ("Tempura", 12.50),
            ("Teriyaki Chicken", 14.00),
            ("Yakitori", 10.99)
        ],
        "drinks": [
            ("Green Tea", 2.99),
            ("Sake", 6.50),
            ("Ramune", 3.99)
        ],
        "sweets": [
            ("Mochi", 4.50),
            ("Matcha Ice Cream", 5.50)
        ]
    },
    "American": {
        "dishes": [
            ("Cheeseburger", 9.99),
            ("BBQ Ribs", 17.50),
            ("Fried Chicken", 11.99),
            ("Steak", 18.99),
            ("Mac and Cheese", 10.50)
        ],
        "drinks": [
            ("Coke", 2.50),
            ("Milkshake", 4.50),
            ("Iced Tea", 2.99)
        ],
        "sweets": [
            ("Cheesecake", 5.99),
            ("Brownie", 4.99)
        ]
    },
    "French": {
        "dishes": [
            ("Coq au Vin", 16.99),
            ("Ratatouille", 12.50),
            ("Croque Monsieur", 8.99),
            ("Bouillabaisse", 15.99),
            ("Quiche Lorraine", 9.99)
        ],
        "drinks": [
            ("Red Wine", 5.50),
            ("Champagne", 7.99),
            ("Café au Lait", 3.50)
        ],
        "sweets": [
            ("Crème Brûlée", 7.50),
            ("Macaron", 4.50)
        ]
    },
    "Vegan": {
        "dishes": [
            ("Vegan Curry", 12.99),
            ("Tofu Stir Fry", 11.50),
            ("Veggie Burger", 9.99),
            ("Quinoa Salad", 10.99),
            ("Stuffed Peppers", 12.50)
        ],
        "drinks": [
            ("Fresh Orange Juice", 3.99),
            ("Herbal Tea", 2.99),
            ("Smoothie", 4.99)
        ],
        "sweets": [
            ("Vegan Brownie", 5.99),
            ("Fruit Salad", 4.50)
        ]
    },
    "Seafood": {
        "dishes": [
            ("Grilled Salmon", 16.99),
            ("Shrimp Scampi", 14.50),
            ("Fish & Chips", 12.99),
            ("Lobster Roll", 18.99),
            ("Seafood Paella", 17.50)
        ],
        "drinks": [
            ("White Wine", 5.50),
            ("Beer", 4.50),
            ("Iced Lemonade", 3.99)
        ],
        "sweets": [
            ("Lemon Tart", 6.99),
            ("Key Lime Pie", 5.99)
        ]
    }
}

# -------------------------
# Seed Function
# -------------------------
def seed_database():
    with app.app_context():
        db.create_all()  # Create tables if they don't exist

        # Optionally, check if data already exists
        if Restaurant.query.first():
            print("✅ Database already seeded. Exiting...")
            return

        # Loop over each city
        for city, address_list in cities.items():
            # For each city, create one restaurant per cuisine
            for i, cuisine in enumerate(cuisines):
                # Choose a random restaurant name for this cuisine
                base_name = random.choice(restaurant_names[cuisine])
                restaurant_name = f"{base_name} in {city}"
                address = address_list[i]  # Use the corresponding address
                image_url = f"/static/images/{cuisine.lower().replace(' ', '_')}.png"
                description = f"Enjoy authentic {cuisine} cuisine at {restaurant_name}, located at {address}."

                # Create and add the new restaurant
                new_restaurant = Restaurant(
                    user_id=random.randint(1, 10),
                    name=restaurant_name,
                    address=address,
                    city=city,
                    image_url=image_url,
                    description=description
                )
                db.session.add(new_restaurant)
                # Flush the session so that new_restaurant gets an id
                db.session.flush()

                # For each restaurant, create its own categories.
                # (Each restaurant gets a "Dish", "Drink", and "Sweet" category.)
                dish_category = Category(name="Dish", restaurant_id=new_restaurant.id)
                drink_category = Category(name="Drink", restaurant_id=new_restaurant.id)
                sweet_category = Category(name="Sweet", restaurant_id=new_restaurant.id)
                db.session.add(dish_category)
                db.session.add(drink_category)
                db.session.add(sweet_category)
                # Flush to get their IDs.
                db.session.flush()

                # Add 10 menu items: 5 dishes, 3 drinks, 2 sweets.
                cuisine_menu = menu_items[cuisine]
                for dish_name, price in cuisine_menu["dishes"]:
                    item = Item(
                        name=dish_name,
                        price=price,
                        restaurant_id=new_restaurant.id,
                        category_id=dish_category.id
                    )
                    db.session.add(item)
                for drink_name, price in cuisine_menu["drinks"]:
                    item = Item(
                        name=drink_name,
                        price=price,
                        restaurant_id=new_restaurant.id,
                        category_id=drink_category.id
                    )
                    db.session.add(item)
                for sweet_name, price in cuisine_menu["sweets"]:
                    item = Item(
                        name=sweet_name,
                        price=price,
                        restaurant_id=new_restaurant.id,
                        category_id=sweet_category.id
                    )
                    db.session.add(item)

        db.session.commit()
        print("✅ Data seeded successfully with 64 restaurants and 640 menu items!")

if __name__ == "__main__":
    seed_database()
