from __future__ import annotations

import datetime
from enum import Enum
from typing import Any

from mongoengine import NULLIFY

from src.database.mongo_connection import db
from src.models.hint_message import HintMessage

class ScratchpadStatus(Enum):
    """Enum describing status of a prompt_hint"""
    ARCHIVE_ADMIN = 'archive_admin'
    SANDBOX = 'sandbox'
    COMMITTED = 'committed'


class ScratchpadPromptHint(db.Document):
    """A MongoEngine Model class for prompt hints in our database. """
    scratchpad_id = db.StringField(required=True)
    user_messages = db.ListField(db.EmbeddedDocumentField(HintMessage))
    user_id = db.StringField(required=True)
    status = db.EnumField(ScratchpadStatus, default=ScratchpadStatus.SANDBOX)
    date_created = db.DateTimeField(default=datetime.datetime.utcnow)
    is_textbook_level = db.BooleanField(default=True)
    lesson_name = db.StringField()
    spreadsheet_id = db.StringField()
    lessons_tested = db.ListField(db.StringField())
    scratchpad_parent = db.ReferenceField('self', reverse_delete_rule=NULLIFY)
    scratchpad_children = db.ListField(db.ReferenceField('self', reverse_delete_rule=NULLIFY))
    committed_children = db.ListField(db.ReferenceField('PromptHint'))

    @staticmethod
    def from_json(data: dict[Any]) -> ScratchpadPromptHint:
        return ScratchpadPromptHint(
            scratchpad_id=data.get("scratchpadId"),
            user_messages=[HintMessage.from_json(user_message) for user_message in data.get('userMessages')],
            user_id=data.get('userId'),
            lesson_name=data.get('lessonName'),
            spreadsheet_id=data.get('spreadsheetId'),
            lessons_tested=data.get('lessonsTested'),
            is_textbook_level=data.get('isTextbookLevel')
        )

    def to_json(self) -> dict:
        return {
            "scratchpadId": self.scratchpad_id,
            "userMessages": [message.to_json() for message in self.user_messages],
            "userId": self.user_id,
            "lessonName": self.lesson_name,
            "spreadsheetId": self.spreadsheet_id,
            "status": self.status.value,
            "isTextbookLevel": self.is_textbook_level,
            "lessonsTested": self.lessons_tested,
            "dateCreated": self.date_created,
        }

    def visualize(self) -> dict:
        return {
            "data": {
                "id": self.scratchpad_id,
                "userMessages": [message.to_json() for message in self.user_messages],
                "userId": self.user_id,
                "dateCreated": self.date_created,
                "lessonName": self.lesson_name,
            },
            "children": [child.visualize() for child in self.scratchpad_children]
        }
