import mongoengine

from src.database.mongo_connection import db
from flask_security import Security, MongoEngineUserDatastore, \
    UserMixin, RoleMixin, login_required
from mongoengine.fields import (
    BinaryField,
    BooleanField,
    DateTimeField,
    IntField,
    ListField,
    ReferenceField,
    StringField,
)


class Role(db.Document, RoleMixin):
    name = StringField(max_length=80, unique=True)
    description = StringField(max_length=255)


class User(db.Document, UserMixin):
    email = StringField(max_length=255, unique=True)
    password = StringField(max_length=255)
    active = BooleanField(default=True)
    fs_uniquifier = StringField(max_length=64, unique=True)
    confirmed_at = DateTimeField()
    roles = ListField(ReferenceField(Role), default=[], reverse_delete=mongoengine.DO_NOTHING)

    def to_dict(self):
        return {
            "email": self.email,
            "password": self.password,
            "active": self.active,
            "confirmed_at": self.confirmed_at,
            "roles": self.roles
        }

