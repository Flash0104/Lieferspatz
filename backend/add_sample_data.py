# backend/add_sample_data.py
from init_db import Restaurant, engine
from sqlalchemy.orm import sessionmaker

# Connect to the database
Session = sessionmaker(bind=engine)
session = Session()

# Add sample restaurants
restaurant1 = Restaurant(name="Pizza Palace", address="123 Main St", description="Best pizza in town")
restaurant2 = Restaurant(name="Burger Haven", address="456 Elm St", description="Juicy burgers and more")

# Add to the session and commit
session.add(restaurant1)
session.add(restaurant2)
session.commit()

print("Sample data added!")
