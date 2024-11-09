# backend/init_db.py
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

# Define the SQLite database
engine = create_engine('sqlite:///../database/lieferspatz.db')
Base = declarative_base()

# Define models
class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    name = Column(String)
    address = Column(String)
    orders = relationship("Order", back_populates="user")  # Link to orders

class Restaurant(Base):
    __tablename__ = 'restaurants'
    id = Column(Integer, primary_key=True)
    name = Column(String)
    address = Column(String)
    description = Column(String)
    menu_items = relationship("MenuItem", order_by="MenuItem.id", back_populates="restaurant")
    orders = relationship("Order", back_populates="restaurant")  # Link to orders

class MenuItem(Base):
    __tablename__ = 'menu_items'
    id = Column(Integer, primary_key=True)
    name = Column(String)
    description = Column(String)
    price = Column(Float)
    restaurant_id = Column(Integer, ForeignKey('restaurants.id'))
    restaurant = relationship("Restaurant", back_populates="menu_items")

class Order(Base):
    __tablename__ = 'orders'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    restaurant_id = Column(Integer, ForeignKey('restaurants.id'))
    status = Column(String)
    user = relationship("User", back_populates="orders")
    restaurant = relationship("Restaurant", back_populates="orders")

# Create tables
Base.metadata.create_all(engine)
