# backend/schemas.py
from marshmallow import Schema, fields, validate, ValidationError

# Restaurant schema for validation
class RestaurantSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=1))
    address = fields.String(required=True, validate=validate.Length(min=1))
    description = fields.String()

# Order schema for validation
class OrderSchema(Schema):
    user_id = fields.Integer(required=True)
    restaurant_id = fields.Integer(required=True)
    status = fields.String(validate=validate.OneOf(["pending", "completed", "canceled"]))
