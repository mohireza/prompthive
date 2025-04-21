from __future__ import annotations

import datetime
from enum import Enum
from typing import Any

from mongoengine import NULLIFY

from src.database.mongo_connection import db
from src.models.hint_message import HintMessage
from src.models.prompt_hint_scratchpad import ScratchpadPromptHint


class Status(Enum):
    """Enum describing status of a prompt_hint"""
    ARCHIVE_ADMIN = 'archive_admin'
    ACTIVE = 'active'
    ARCHIVE = 'archive'


class PromptHint(db.Document):
    """A MongoEngine Model class for prompt hints in our database. """
    user_messages = db.ListField(db.EmbeddedDocumentField(HintMessage))
    user_id = db.StringField(required=True)
    status = db.EnumField(Status, default=Status.ACTIVE)
    date_created = db.DateTimeField(default=datetime.datetime.utcnow)
    liked_users = db.ListField(db.StringField())
    is_textbook_level = db.BooleanField(default=True)
    lesson_name = db.StringField()
    spreadsheet_id = db.StringField()
    lessons_tested = db.ListField(db.StringField())
    parent = db.ReferenceField('self', reverse_delete_rule=NULLIFY)
    children = db.ListField(db.ReferenceField('self', reverse_delete_rule=NULLIFY))
    scratchpad_prompt_hint = db.ReferenceField('ScratchpadPromptHint', reverse_delete_rule=NULLIFY)

    @staticmethod
    def from_json(data: dict[Any]) -> PromptHint:
        return PromptHint(
            user_messages=[HintMessage.from_json(user_message) for user_message in data.get('userMessages')],
            user_id=data.get('userId'),
            lesson_name=data.get('lessonName'),
            spreadsheet_id=data.get('spreadsheetId'),
            lessons_tested=data.get('lessonsTested'),
            is_textbook_level=data.get('isTextbookLevel')
        )

    def to_json(self) -> dict:
        return {
            "id": str(self.pk),
            "userMessages": [message.to_json() for message in self.user_messages],
            "userId": self.user_id,
            "lessonName": self.lesson_name,
            "spreadsheetId": self.spreadsheet_id,
            "status": self.status.value,
            "isTextbookLevel": self.is_textbook_level,
            "likes": len(self.liked_users),
            "lessonsTested": self.lessons_tested,
            "dateCreated": self.date_created,
            "scratchpadId": self.scratchpad_prompt_hint.scratchpad_id if self.scratchpad_prompt_hint else "",
        }

    def visualize(self) -> dict:
        return {
            "data": {
                "id": str(self.pk),
                "userMessages": [message.to_json() for message in self.user_messages],
                "userId": self.user_id,
                "dateCreated": self.date_created,
                "lessonName": self.lesson_name,
            },
            "children": [child.visualize() for child in self.children]
        }
