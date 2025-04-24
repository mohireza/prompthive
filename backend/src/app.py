# Import CORS at the top of your file
from __future__ import annotations

import json
import os
from typing import List, Optional
from urllib.parse import unquote

import flask_security
from flask import Flask, Response, jsonify, request
from flask_cors import CORS
from flask_mongoengine import MongoEngine
from flask_security import (
    MongoEngineUserDatastore,
    RoleMixin,
    Security,
    UserMixin,
    current_user,
    login_required,
)
from mongoengine import DoesNotExist

import src.services.chatgpt_service as chatgpt_service
from src.database.mongo_connection import db
from src.models.authentication_models.user import Role, User

from src.services.google_sheet_service import (
    get_file_name,
    get_sheet_data,
    get_sheet_titles,
    append_rows,
    create_new_sheet,
    delete_rows,
    update_columns
)
from src.services.prompt_library_service import (
    archive_all_prompts,
    archive_prompt,
    archive_with_admin,
    commit_prompt_hint,
    commit_scratchpad_prompt_hint, get_active_prompt_hints,
    get_all_active_prompts,
    toggle_like_prompt_hint,
    trace_prompt,
    update_lessons_tested_on_prompt_hint,
    visualise_scratchpad_prompt_tree, visualize_prompt_tree,
)

app = Flask(__name__)
app.config["MONGODB_SETTINGS"] = {
    "db": "documents_db",
    "host": "localhost",
    "port": 27017,
}


# Add this line after initializing your Flask app
CORS(
    app,
    origins=["http://localhost:5173", "http://127.0.0.1:5173"],
)

db.init_app(app)


# Helper function to convert objects to JSON serializable dictionaries
def to_dict(obj):
    return obj.to_mongo().to_dict() if obj else None


# Set up some variables used for security.

# Generate a nice key using secrets.token_urlsafe()
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "Not actually very secret.")
# Bcrypt is set as default SECURITY_PASSWORD_HASH, which requires a salt
# Generate a good salt using: secrets.SystemRandom().getrandbits(128)
app.config["SECURITY_PASSWORD_SALT"] = os.environ.get(
    "SECURITY_PASSWORD_SALT", "Joseph Jay Williams"
)
# Don't worry if email has findable domain
app.config["SECURITY_EMAIL_VALIDATOR_ARGS"] = {"check_deliverability": False}

user_datastore = MongoEngineUserDatastore(db, User, Role)
app.security = Security(app, user_datastore)

ADMIN_ROLE_NAME = "admin"
USER_ROLE_NAME = "user"
# # TODO: This starter data initialisation is made only for testing locally. Please don't actually push!
# adminRole = Role(name=ADMIN_ROLE_NAME, description="Administrative privileges. Can do anything.")
# userRole = Role(name=USER_ROLE_NAME, description="A general user, and all normal permissions. Usually self-crud and viewing unowned docs.")
# adminRole.save()
# userRole.save()

app.config["WTF_CSRF_ENABLED"] = False

@app.route("/chatGPT/json", methods=["POST"])
def get_json_message() -> Response:
    request_json = request.get_json()
    messages = request_json["messages"]
    response_type = request_json.get("type", "default")
    model = request_json.get("model", "gpt-4o-2024-08-06")
    temperature = request_json.get("temperature", 1)
    return chatgpt_service.get_structured_output(
        messages=messages,
        response_type=response_type,
        model=model,
        temperature=temperature,
    )


@app.route("/chatGPT/chat", methods=["POST"])
def get_chat_message() -> Response:
    """Endpoint for receiving a chat message from the chatGPT API. Sending more messages may be difficult."""
    message_json = request.get_json()
    messages = message_json["messages"]
    model = message_json.get("model", "gpt-4o")  # Default to 'gpt-4o' if not provided
    type = message_json.get("type", "text")  # Default to 'text' if not provided
    temperature = message_json.get("temperature", 1)
    chat_stream = chatgpt_service.get_chat(
        messages, model, type, temperature
    )  # returns an event stream we can iterate over.
    tab = "table" in message_json["messages"][-1]["content"]
    lst = "list" in message_json["messages"][-1]["content"]

    def stream_chat():
        for chunk in chat_stream:
            try:
                content: str = (
                    chunk.choices[0].delta.content or ""
                )  # chunk.choices[0].delta.content may be None
            except KeyError:
                content = ""
            # 'data:' and newlines format each text block as a new server sent event. See the documentation on MDN.
            yield f"data: {content}\n\n"
            # Start a new paragraph if we see a newline.
            if "\n" in content and type == "text":
                if not tab and not lst:
                    yield f"data: <br/><br/>\n\n"
                else:
                    yield f"data: \n\n"

    return app.response_class(stream_chat(), mimetype="text/event-stream")

@app.route("/user/<string:email>", methods=["DELETE"])
@app.route("/user", methods=["POST"])
def create_user(email=None):
    """Endpoint for CRUD with a user in the database. Send the user's details by HTTP**S** request, please!
    Since we're sending data as plaintext to start with, it's seriously important to use HTTPS or people can spy on our
    users without even paying us.

    Currently, requires that you pass the user's email, unhashed password, and roles to the endpoint.
    """

    data = request.get_json()
    if request.method == "POST":
        # Flask-Security doesn't actually do any normalisation on the email and password, we gotta check it ourselves...
        try:
            validated_email = flask_security.MailUtil(app).validate(email=data["email"])
            password_warnings, password_normalised = flask_security.PasswordUtil(
                app
            ).validate(data["password"], is_register=True)
            if password_warnings is not None:
                raise ValueError

        except ValueError:
            return Response(
                response="Email normalisation and validation failed, maybe an insecure email entered.",
                status=406,
            )

        # Invariant: The email and the password are now safe to use in the database.
        secure_password = flask_security.utils.hash_password(password_normalised)
        user = user_datastore.create_user(
            email=validated_email, password=secure_password
        )

        # Consider all generally created users to be just that: users.
        user_datastore.add_role_to_user(user, "user")

        return user.to_dict()

    elif request.method == "DELETE":
        user_to_deactivate = user_datastore.find_user(
            email=email
        )  # Emails are unique so this is fine.
        user_datastore.deactivate_user(user_to_deactivate)

    # TODO: consider allowing users to change their credentials. Make them log in first, though.


@app.route("/login", methods=["POST"])
def login():
    """An endpoint for logging in a user, whose email and password are provided as part of a POST request."""
    data = request.json
    # Take the user's email and password.
    plaintext_password = data["password"]
    email = data["email"]

    # Validate and normalise the input.
    validated_email = flask_security.MailUtil(app).validate(email)
    password_warnings, validated_password = flask_security.PasswordUtil(app).validate(
        plaintext_password, False
    )

    # Check if we can find a user, and if the password is correct.
    user = user_datastore.find_user(email=validated_email, case_sensitive=False)
    if user is None:
        return Response(response="The provided user could not be found.", status=240)

    password_legit = flask_security.verify_password(validated_password, user.password)

    if password_legit is False:
        return Response(
            response="The password didn't match what we had in our database.",
            status=403,
        )

    # Invariant: at this point we found a user and the password for it matches.
    flask_security.login_user(user=user, authn_via=["password"])
    return Response(response="You should be logged in now.", status=200)


@login_required
@app.route("/logout", methods=["POST"])
def logout():
    """An endpoint for logging out the current user."""
    flask_security.logout_user()

# Google Sheets integration endpoints. Added for OATutor
@app.route("/api/google-sheets/data", methods=["GET"])
def get_google_sheets_data_api():
    spreadsheet_id = request.args.get("spreadsheetId")
    range_ = request.args.get("range")
    filter_criteria = request.args.get(
        "filter_criteria"
    )  # Get filter criteria from request
    if not spreadsheet_id or not range_:
        return jsonify({"error": "Spreadsheet ID and range are required."}), 400
    if filter_criteria:
        filter_criteria = json.loads(filter_criteria)  # Convert string to dictionary
    data = get_sheet_data(
        spreadsheet_id, range_, filter_criteria=filter_criteria
    )  # Pass filter_criteria
    return jsonify(data), 200


@app.route("/api/google-sheets/titles", methods=["GET"])
def get_google_sheets_titles_api():
    spreadsheet_id = request.args.get("spreadsheetId")
    if not spreadsheet_id:
        return jsonify({"error": "Spreadsheet ID is required."}), 400
    titles = get_sheet_titles(spreadsheet_id)
    return jsonify(titles), 200


@app.route("/api/google-sheets/file-name", methods=["GET"])
def get_google_sheets_file_name_api():
    spreadsheet_id = request.args.get("spreadsheetId")
    if not spreadsheet_id:
        return jsonify({"error": "Spreadsheet ID is required."}), 400
    file_name = get_file_name(spreadsheet_id)
    return jsonify(file_name), 200

@app.route("/api/google-sheets/append", methods=["POST"])
def append_to_google_sheet_api():
    try:
        data = request.json
        spreadsheet_id = data.get("spreadsheetId")
        range_ = data.get("range")
        values = data.get("values")
        if not spreadsheet_id or not range_ or not values:
            return jsonify({"error": "Spreadsheet ID, range, and values are required."}), 400
        result = append_rows(spreadsheet_id, range_, values)
        return jsonify(result), 200
    except Exception as e:
        print(f"Error occurred: {str(e)}")  # Log the error to console
        return jsonify({"error": "An internal error occurred."}), 500


@app.route("/api/google-sheets/create", methods=["POST"])
def create_google_sheet_api():
    data = request.json
    spreadsheet_id = data.get("spreadsheetId")
    sheet_title = data.get("sheetTitle")
    if not spreadsheet_id or not sheet_title:
        return jsonify({"error": "Spreadsheet ID and sheet title are required."}), 400
    result = create_new_sheet(spreadsheet_id, sheet_title)
    return jsonify(result), 200

@app.route("/api/google-sheets/delete-rows", methods=["POST"])
def delete_google_sheet_rows_api():
    try:
        data = request.json
        spreadsheet_id = data.get("spreadsheetId")
        sheet_name = data.get("sheetName")  # This should be the name of the sheet
        start_index = data.get("startIndex")
        end_index = data.get("endIndex")
        if not spreadsheet_id or not sheet_name or start_index is None or end_index is None:
            return jsonify({"error": "Spreadsheet ID, sheet name, start index, and end index are required."}), 400
        result = delete_rows(spreadsheet_id, sheet_name, start_index, end_index)
        print(f"Delete result: {result}")  # Log the result
        return jsonify(result), 200
    except Exception as e:
        print(f"Error occurred: {str(e)}")  # Log any other exceptions
        return jsonify({"error": "An internal error occurred."}), 500

@app.route("/api/google-sheets/update-columns", methods=["POST"])
def update_google_sheet_columns_api():
    data = request.json
    spreadsheet_id = data.get("spreadsheetId")
    range_ = data.get("range")
    values = data.get("values")
    if not spreadsheet_id or not range_ or not values:
        return jsonify({"error": "Spreadsheet ID, range, and values are required."}), 400
    result = update_columns(spreadsheet_id, range_, values)
    return jsonify(result), 200


@app.route("/api/prompt-library/active", methods=["GET"])
def get_active_prompts():
    spreadsheet_id = request.args.get("spreadsheetId")
    print(spreadsheet_id)
    if not spreadsheet_id:
        return jsonify({"error": "Spreadsheet ID is required."}), 400
    lesson_name = request.args.get("lessonName")
    return jsonify(get_active_prompt_hints(spreadsheet_id, lesson_name)), 200


@app.route("/api/prompt-library/commit-prompt", methods=["POST"])
def commit_prompt_hint_to_library():
    try:
        return jsonify(commit_prompt_hint(request.json)), 201
    except ValueError as e:
        return jsonify({"message": str(e)}), 400


@app.route("/api/prompt-library/toggle-like-prompt", methods=["POST"])
def toggle_like_prompt():
    user_id, prompt_id = request.json.get("userId"), request.json.get("promptId")
    try:
        toggle_like_prompt_hint(prompt_id, user_id)
        return jsonify({"message": "successful"}), 201
    except Exception as e:
        return jsonify({"message": str(e)}), 400


@app.route("/api/prompt-library/update-lessons-tested", methods=["PUT"])
def update_lessons_tested():
    new_lessons, prompt_id = request.json.get("newLessons"), request.json.get(
        "promptId"
    )
    try:
        update_lessons_tested_on_prompt_hint(prompt_id, new_lessons)
        return jsonify({"message": "updated lessons"}), 201
    except Exception as e:
        return jsonify({"message": str(e)}), 400


@app.route("/api/prompt-library/archive-prompt", methods=["PUT"])
def archive_prompt_in_library():
    prompt_id, user_id = request.json.get("promptId"), request.json.get("userId")
    if not prompt_id:
        return jsonify({"message": "promptId not provided"}), 400
    if not user_id:
        return jsonify({"message": "userId not provided"}), 400
    try:
        return jsonify(archive_prompt(prompt_id, user_id)), 201
    except Exception as e:
        return jsonify({"message": str(e)}), 400


@app.route("/api/prompt-library/visualize-tree", methods=["GET"])
def visualize_tree():
    spreadsheet_id = request.args.get("spreadsheetId")
    try:
        return jsonify(visualize_prompt_tree(spreadsheet_id)), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400


@app.route("/api/prompt-library/trace-prompt-origin", methods=["GET"])
def trace_promot_origin():
    prompt_id = request.args.get("promptId")
    if prompt_id is None:
        return jsonify({"message": "no promptId provided"}), 400
    try:
        response_data = trace_prompt(prompt_id)
        return jsonify(response_data), 200
    except DoesNotExist as e:
        return jsonify({"message": str(e)}), 400


@app.route("/api/prompt-library/archive-all-admin-vfr567uhfr", methods=["POST"])
def archive_all_by_admin():
    spreadsheet_id = request.json.get("spreadsheetId")
    if not spreadsheet_id:
        return jsonify({"message": "no spreadsheetId provided"}), 400
    archive_all_prompts(spreadsheet_id)
    return jsonify({"message": "successfully archived all"}), 200


@app.route("/api/prompt-library/archive-admin-vfr567uhfr", methods=["POST"])
def archive_by_admin():
    prompt_id = request.json.get("promptId")
    if prompt_id is None:
        return jsonify({"message": "no promptId provided"}), 400
    archive_with_admin(prompt_id)
    return jsonify({"message": "successfully archived all"}), 200


@app.route("/api/prompt-library/fetch-all-active-vfr567uhfr", methods=["GET"])
def fetch_all_active():
    spreadsheet_id = request.args.get("spreadsheetId")
    if not spreadsheet_id:
        return jsonify({"message": "no spreadsheetId provided"}), 400
    return jsonify(get_all_active_prompts(spreadsheet_id)), 200

@app.route("/api/prompt-library/commit-scratchpad-prompt", methods=["POST"])
def commit_prompt_from_scratchpad():
    try:
        return jsonify(commit_scratchpad_prompt_hint(request.json)), 201
    except ValueError as e:
        return jsonify({"message": str(e)}), 400

@app.route("/api/prompt-library/visualize-scratchpad-tree", methods=["GET"])
def visualize_scratchpad_tree():
    spreadsheet_id = request.args.get("spreadsheetId")
    try:
        return jsonify(visualise_scratchpad_prompt_tree(spreadsheet_id)), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400

def main():
    app.run(host="0.0.0.0", port=8080, debug=True)


if __name__ == "__main__":
    main()
