from __future__ import annotations

import datetime
from enum import Enum

from src.database.mongo_connection import db


class Role(Enum):
    """Enum describing roles in HintMessage."""
    USER = 'user'
    SYSTEM = 'system'
    ASSISTANT = 'assistant'


class HintMessage(db.EmbeddedDocument):
    """A MongoEngine Model class for hint messages in our database. """
    content = db.StringField(required=True)
    hidden = db.BooleanField(default=True)
    disabled = db.BooleanField(default=False)
    message_id = db.StringField(required=True)
    role = db.EnumField(Role, default=Role.USER)
    time_created = db.DateTimeField()
    time_last_updated = db.DateTimeField()

    @staticmethod
    def from_json(json_data) -> HintMessage:
        return HintMessage(
            content=json_data.get('content'),
            hidden=json_data.get('hidden'),
            role=json_data.get('role'),
            disabled=json_data.get('disabled'),
            message_id=json_data.get('id'),
            time_created=datetime.datetime.strptime(json_data.get('time_created'), "%Y-%m-%dT%H:%M:%S.%fZ"),
            time_last_updated=datetime.datetime.strptime(json_data.get('time_last_updated'), "%Y-%m-%dT%H:%M:%S.%fZ")
        )

    def to_json(self) -> dict:
        return {
            'content': self.content,
            'hidden': self.hidden,
            'role': self.role.value,
            'disabled': self.disabled,
            'id': self.message_id,
            'time_created': self.time_created.strftime('%Y-%m-%dT%H:%M:%S.') + f'{self.time_created.microsecond // 1000:03d}Z',
            'time_last_updated': self.time_last_updated.strftime('%Y-%m-%dT%H:%M:%S.') + f'{self.time_last_updated.microsecond // 1000:03d}Z'
        }
