# Backend – PromptHive

This is the backend for **PromptHive**, a tool for managing and interacting with Google Sheets, built with Flask and MongoDB.

---

## Prerequisites

- Python 3.9 or higher
- [Poetry](https://python-poetry.org/docs/#installation)
- [MongoDB](https://www.mongodb.com/docs/manual/installation/)

---

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/mohireza/prompthive.git
   cd prompthive/backend
   ```

2. **Install dependencies**:
   ```bash
   poetry install
   ```

3. **Activate the virtual environment**:
   ```bash
   poetry shell
   ```

> If you encounter `command not found` errors, make sure your system `PATH` includes Poetry's bin directory or the folder where executables are installed.

---

## Running the Application

1. **Start MongoDB** (in a separate terminal):
   ```bash
   mongod
   ```

2. **Run the Flask app**:
   ```bash
   poetry run flask run
   ```

---

## Running Tests

Run the test suite:
```bash
poetry run pytest
```

---

## Tech Stack

### MongoDB
Document-based database for storing user and sheet data.

### MongoEngine
Python ODM to interface with MongoDB using object-like syntax.

### Flask
Backend API framework for serving and handling Google Sheets operations.

### Poetry
Python dependency manager and environment tool.

---

## 📁 Project Structure
```
backend/
├── src/                  # Flask app source
   ├── credentials.template.json  # Template for OAuth credentials (safe to commit)
 You must copy this file to `credentials.json` (create this file) and fill in your own credentials.
   ├── app.py  # Flask app source
├── token.json            # OAuth token (generated)
├── pyproject.toml        # Poetry config
```

> Add `credentials.json` and `token.json` to your `.gitignore` file to avoid accidentally committing secrets.
