"""This file handles the CRUD operations for the PromptHint objects in the database, as they are defined in models.prompt_hint.py."""
from __future__ import annotations

from mongoengine import DoesNotExist

from src.models.prompt_hint import PromptHint, Status
from src.models.prompt_hint_scratchpad import ScratchpadPromptHint


def commit_prompt_hint(json: dict) -> dict:
    prompt_hint = PromptHint.from_json(json)
    if not prompt_hint.user_messages:
        raise ValueError("please provide non empty user messages")
    if not prompt_hint.user_id:
        raise ValueError("no user-id provided")
    if not prompt_hint.is_textbook_level and not prompt_hint.lesson_name:
        raise ValueError("lesson name not specified for lesson-level prompt")
    if prompt_hint.is_textbook_level and prompt_hint.lesson_name:
        raise ValueError("textbook-level prompt cannot have lesson name")
    previous_prompt_hint: PromptHint = PromptHint.objects(user_id=prompt_hint.user_id,
                                                          lesson_name=prompt_hint.lesson_name,
                                                          status=Status.ACTIVE,
                                                          spreadsheet_id=prompt_hint.spreadsheet_id).first()
    if previous_prompt_hint:
        previous_prompt_hint.status = Status.ARCHIVE
        previous_prompt_hint.save()
    parent_id = json.get("parentId")
    if parent_id is not None:
        try:
            parent_prompt: PromptHint = PromptHint.objects(id=parent_id).get()
            parent_prompt.children.append(prompt_hint)
            prompt_hint.parent = parent_prompt
            prompt_hint.save()
            parent_prompt.save()
        except DoesNotExist as e:
            raise ValueError(str(e))
    scratchpad_id = json.get("parentScratchpadId")
    print(scratchpad_id)
    if scratchpad_id is not None:
        try:
            scratchpad_prompt_hint: ScratchpadPromptHint = ScratchpadPromptHint.objects(scratchpad_id=scratchpad_id).get()
            scratchpad_prompt_hint.committed_children.append(prompt_hint)
            prompt_hint.scratchpad_prompt_hint = scratchpad_prompt_hint
            print(scratchpad_id, scratchpad_prompt_hint.to_json())
            prompt_hint.save()
            scratchpad_prompt_hint.save()
            return prompt_hint.to_json()
        except DoesNotExist as e:
            raise ValueError(str(e))
    prompt_hint.save()
    return prompt_hint.to_json()

def get_active_prompt_hints(spreadsheet_id: str, lesson_name: str) -> list[PromptHint]:
    if not lesson_name:
        lesson_name = None
    prompt_hints = PromptHint.objects(spreadsheet_id=spreadsheet_id,
                                      status=Status.ACTIVE,
                                      lesson_name=lesson_name).all()
    result = [prompt_hint.to_json() for prompt_hint in prompt_hints]
    return result

def toggle_like_prompt_hint(prompt_id: int, user_id: str) -> None:
    prompt_hint: PromptHint = PromptHint.objects(id=prompt_id).get()
    if user_id in prompt_hint.liked_users:
        prompt_hint.liked_users.remove(user_id)
    else:
        prompt_hint.liked_users.append(user_id)
    prompt_hint.save()

def update_lessons_tested_on_prompt_hint(prompt_id: int, new_lessons_tested: list[str]) -> None:
    prompt_hint: PromptHint = PromptHint.objects(id=prompt_id).get()
    prompt_hint.update(add_to_set__lessons_tested=new_lessons_tested)

def visualize_prompt_tree(spreadsheet_id: str):
    root_prompt_hints: list[PromptHint] = PromptHint.objects(spreadsheet_id=spreadsheet_id, parent=None).all()
    return [prompt_hint.visualize() for prompt_hint in root_prompt_hints]

def trace_prompt(prompt_id: str) -> list[dict]:
    prompt_hint: PromptHint = PromptHint.objects(id=prompt_id).get()
    trace_origin_list: list[dict] = []
    while prompt_hint is not None:
        trace_origin_list.append(prompt_hint.to_json())
        prompt_hint = prompt_hint.parent
    return trace_origin_list[::-1]

def archive_prompt(prompt_id: str, user_id: str):
    prompt_hint: PromptHint = PromptHint.objects(id=prompt_id).get()
    if prompt_hint.user_id != user_id:
        raise Exception("prompt does not belong to user")
    prompt_hint.status = Status.ARCHIVE
    prompt_hint.save()
    return {"message": "successfully archived prompt"}

def archive_all_prompts(spreadsheet_id: str):
    print(spreadsheet_id)
    PromptHint.objects(spreadsheet_id=spreadsheet_id).update(set__status=Status.ARCHIVE_ADMIN)

def archive_with_admin(prompt_id: str):
    PromptHint.objects(id=prompt_id).update(set__status=Status.ARCHIVE_ADMIN)

def get_all_active_prompts(spreadsheet_id: str):
    prompt_hints = PromptHint.objects(spreadsheet_id=spreadsheet_id,
                                            status=Status.ACTIVE).all()
    result = [prompt_hint.to_json() for prompt_hint in prompt_hints]
    return result

def commit_scratchpad_prompt_hint(json: dict) -> dict:
    prompt_hint_scratchpad = ScratchpadPromptHint.from_json(json)
    if not prompt_hint_scratchpad.user_messages:
        raise ValueError("please provide non empty user messages")
    if not prompt_hint_scratchpad.user_id:
        raise ValueError("no user-id provided")
    if not prompt_hint_scratchpad.is_textbook_level and not prompt_hint_scratchpad.lesson_name:
        raise ValueError("lesson name not specified for lesson-level prompt")
    if prompt_hint_scratchpad.is_textbook_level and prompt_hint_scratchpad.lesson_name:
        raise ValueError("textbook-level prompt cannot have lesson name")
    parent_scratchpad_id = json.get("parentScratchpadId")
    if parent_scratchpad_id is not None:
        try:
            scratchpad_parent_prompt: ScratchpadPromptHint = ScratchpadPromptHint.objects(scratchpad_id=parent_scratchpad_id,
                                                                                          spreadsheet_id=prompt_hint_scratchpad.spreadsheet_id).get()
            scratchpad_parent_prompt.scratchpad_children.append(prompt_hint_scratchpad)
            prompt_hint_scratchpad.scratchpad_parent = scratchpad_parent_prompt
            prompt_hint_scratchpad.save()
            scratchpad_parent_prompt.save()
            return prompt_hint_scratchpad.to_json()
        except DoesNotExist as e:
            raise ValueError(str(e))
    prompt_hint_scratchpad.save()
    return prompt_hint_scratchpad.to_json()

def visualise_scratchpad_prompt_tree(spreadsheet_id):
    root_scratchpad_prompt_hints: list[ScratchpadPromptHint] = ScratchpadPromptHint.objects(spreadsheet_id=spreadsheet_id,
                                                                                  scratchpad_parent=None).all()
    return [prompt_hint.visualize() for prompt_hint in root_scratchpad_prompt_hints]
