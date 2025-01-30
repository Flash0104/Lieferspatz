import sqlite3

# Connect to SQLite database
DATABASE_NAME = "database.db"

def connect_db():
    """Connect to SQLite database and return connection."""
    return sqlite3.connect(DATABASE_NAME, check_same_thread=False)


def create_tables():
    """Create tables for the database based on the concept paper."""
    conn = connect_db()
    cursor = conn.cursor()

    # Create Customers Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS customer (
            customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            address TEXT,
            postal_code TEXT
        )
    """)

    # Create Restaurants Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS restaurant (
            restaurant_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            address TEXT NOT NULL,
            image_url TEXT,
            description TEXT
        )
    """)

    # Create Menu Categories Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS category (
            category_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            restaurant_id INTEGER NOT NULL,
            FOREIGN KEY (restaurant_id) REFERENCES restaurant (restaurant_id) ON DELETE CASCADE
        )
    """)

    # Create Menu Items Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS item (
            item_id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            image_url TEXT,
            FOREIGN KEY (category_id) REFERENCES category (category_id) ON DELETE CASCADE
        )
    """)

    # Create Orders Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS food_order (
            order_id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            restaurant_id INTEGER NOT NULL,
            total_price REAL DEFAULT 0,
            order_status TEXT DEFAULT 'shopping',  -- ['shopping', 'pending', 'preparing', 'cancelled', 'delivered']
            order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customer (customer_id),
            FOREIGN KEY (restaurant_id) REFERENCES restaurant (restaurant_id)
        )
    """)

    # Create Order Items Table (Mapping table for orders and menu items)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS order_has_items (
            order_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            item_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            FOREIGN KEY (order_id) REFERENCES food_order (order_id) ON DELETE CASCADE,
            FOREIGN KEY (item_id) REFERENCES item (item_id) ON DELETE CASCADE
        )
    """)

    # Create Payments Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS payment (
            payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            total_price REAL NOT NULL,
            transaction_status TEXT DEFAULT 'pending', -- ['pending', 'paid']
            transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES food_order (order_id) ON DELETE CASCADE
        )
    """)

    conn.commit()
    conn.close()
    print("✅ Database and tables created successfully!")


def reset_database():
    """Deletes all data from database tables."""
    conn = connect_db()
    cursor = conn.cursor()

    cursor.executescript("""
        DELETE FROM customer;
        DELETE FROM restaurant;
        DELETE FROM category;
        DELETE FROM item;
        DELETE FROM food_order;
        DELETE FROM order_has_items;
        DELETE FROM payment;
        VACUUM;  -- Optimize database size
    """)

    conn.commit()
    conn.close()
    print("✅ Database has been reset!")


if __name__ == "__main__":
    create_tables()
