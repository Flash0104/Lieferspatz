import sqlite3
import json

# Ensure correct file path
json_path = "static/data/restaurant.json"

try:
    # Load JSON data
    with open(json_path, "r") as file:
        restaurants = json.load(file)

    # Connect to SQLite database
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    # Clear existing data
    cursor.execute("DELETE FROM restaurants")

    # Insert new data with safe handling
    for restaurant in restaurants:
        name = restaurant.get("name", "Unknown")  # Default to "Unknown" if missing
        image = restaurant.get("image", "/static/default.png")  # Use a default image
        rating = restaurant.get("rating", 0.0)  # Default to 0.0 if missing
        reviews = restaurant.get("reviews", 0)  # Default to 0 if missing
        delivery_time = restaurant.get("delivery_time", "N/A")  # Default to "N/A" if missing

        cursor.execute(
            "INSERT INTO restaurants (name, image, rating, reviews, delivery_time) VALUES (?, ?, ?, ?, ?)",
            (name, image, rating, reviews, delivery_time),
        )

    # Commit and close
    conn.commit()
    conn.close()

    print("✅ Data successfully inserted into database.db!")

except FileNotFoundError:
    print(f"❌ ERROR: The JSON file {json_path} was not found.")
except json.JSONDecodeError:
    print(f"❌ ERROR: JSON file {json_path} is not properly formatted.")
except Exception as e:
    print(f"❌ ERROR: {e}")
