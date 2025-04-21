import os

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from src.services.latex_converter_service import \
    annotate_sheet_data

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

def get_sheet_data(spreadsheet_id, range_, filter_criteria=None):
    credentials = None
    if os.path.exists("token.json"):
        credentials = Credentials.from_authorized_user_file("token.json", SCOPES)
    if not credentials or not credentials.valid:
        if credentials and credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file("backend/credentials.json", SCOPES)
            credentials = flow.run_local_server(port=62161)
        with open("token.json", "w") as token:
            token.write(credentials.to_json())

    try:
        service = build("sheets", "v4", credentials=credentials)
        sheets = service.spreadsheets()
        
        if filter_criteria:
            filter_string = ""
            for column, criteria in filter_criteria.items():
                filter_string += f"{column}='{criteria}' AND "
            filter_string = filter_string[:-5]  # Remove the last 'AND'
            range_ += f"&q={filter_string}"


        result = sheets.values().get(spreadsheetId=spreadsheet_id, range=range_).execute()
        data = result.get("values", [])
        annotate_sheet_data(sheet=data)
        return data
    except HttpError as error:
        return {"error": str(error)}

def get_sheet_titles(spreadsheet_id):
    credentials = None
    if os.path.exists("token.json"):
        credentials = Credentials.from_authorized_user_file("token.json", SCOPES)
    if not credentials or not credentials.valid:
        if credentials and credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file("backend/credentials.json", SCOPES)
            credentials = flow.run_local_server(port=62161)
        with open("token.json", "w") as token:
            token.write(credentials.to_json())

    try:
        service = build("sheets", "v4", credentials=credentials)
        sheets = service.spreadsheets()
        spreadsheet = sheets.get(spreadsheetId=spreadsheet_id, fields="sheets(properties(title))").execute()
        sheets_list = spreadsheet.get("sheets", [])
        sheet_titles = [sheet["properties"]["title"] for sheet in sheets_list]
        return sheet_titles
    except HttpError as error:
        return {"error": str(error)}
    
def get_file_name(spreadsheet_id):
    credentials = None
    if os.path.exists("token.json"):
        credentials = Credentials.from_authorized_user_file("token.json", SCOPES)
    if not credentials or not credentials.valid:
        if credentials and credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file("backend/credentials.json", SCOPES)
            credentials = flow.run_local_server(port=62161)
        with open("token.json", "w") as token:
            token.write(credentials.to_json())

    try:
        service = build("sheets", "v4", credentials=credentials)
        spreadsheet = service.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
        file_name = spreadsheet.get("properties", {}).get("title", "")
        return file_name
    except HttpError as error:
        return {"error": str(error)}
    


def append_rows(spreadsheet_id, range_, values):
    credentials = None
    if os.path.exists("token.json"):
        credentials = Credentials.from_authorized_user_file("token.json", SCOPES)
    if not credentials or not credentials.valid:
        if credentials and credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file("backend/credentials.json", SCOPES)
            credentials = flow.run_local_server(port=62161)
        with open("token.json", "w") as token:
            token.write(credentials.to_json())

    try:
        service = build("sheets", "v4", credentials=credentials)
        sheets = service.spreadsheets().values()

        body = {
            "values": values
        }
        result = sheets.append(
            spreadsheetId=spreadsheet_id,
            range=range_,
            valueInputOption="USER_ENTERED",
            insertDataOption="INSERT_ROWS",
            body=body
        ).execute()
        return result
    except HttpError as error:
        return {"error": str(error)}

def create_new_sheet(spreadsheet_id, sheet_title):
    credentials = None
    if os.path.exists("token.json"):
        credentials = Credentials.from_authorized_user_file("token.json", SCOPES)
    if not credentials or not credentials.valid:
        if credentials and credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file("backend/credentials.json", SCOPES)
            credentials = flow.run_local_server(port=62161)
        with open("token.json", "w") as token:
            token.write(credentials.to_json())

    try:
        service = build("sheets", "v4", credentials=credentials)
        sheets = service.spreadsheets()

        add_sheet_request = {
            "requests": [
                {
                    "addSheet": {
                        "properties": {
                            "title": sheet_title
                        }
                    }
                }
            ]
        }

        result = sheets.batchUpdate(
            spreadsheetId=spreadsheet_id,
            body=add_sheet_request
        ).execute()

        return result
    except HttpError as error:
        return {"error": str(error)}

def delete_rows(spreadsheet_id, sheet_name, start_index, end_index):
    sheet_id = get_sheet_id(spreadsheet_id, sheet_name)
    if sheet_id is None:
        return {"error": f"Sheet with name {sheet_name} not found."}
    
    credentials = None
    if os.path.exists("token.json"):
        credentials = Credentials.from_authorized_user_file("token.json", SCOPES)
    if not credentials or not credentials.valid:
        if credentials and credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file("backend/credentials.json", SCOPES)
            credentials = flow.run_local_server(port=62161)
        with open("token.json", "w") as token:
            token.write(credentials.to_json())

    try:
        service = build("sheets", "v4", credentials=credentials)
        sheets = service.spreadsheets()

        delete_request = {
            "requests": [
                {
                    "deleteRange": {
                        "range": {
                            "sheetId": sheet_id,
                            "startRowIndex": start_index,
                            "endRowIndex": end_index
                        },
                        "shiftDimension": "ROWS"
                    }
                }
            ]
        }

        result = sheets.batchUpdate(
            spreadsheetId=spreadsheet_id,
            body=delete_request
        ).execute()

        return result
    except HttpError as error:
        return {"error": str(error)}
    
def update_columns(spreadsheet_id, range_, values):
    credentials = None
    if os.path.exists("token.json"):
        credentials = Credentials.from_authorized_user_file("token.json", SCOPES)
    if not credentials or not credentials.valid:
        if credentials and credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file("backend/credentials.json", SCOPES)
            credentials = flow.run_local_server(port=62161)
        with open("token.json", "w") as token:
            token.write(credentials.to_json())

    try:
        service = build("sheets", "v4", credentials=credentials)
        sheets = service.spreadsheets().values()

        body = {
            "values": values
        }
        result = sheets.update(
            spreadsheetId=spreadsheet_id,
            range=range_,
            valueInputOption="USER_ENTERED",
            body=body
        ).execute()

        return result
    except HttpError as error:
        return {"error": str(error)}
    
def get_sheet_id(spreadsheet_id, sheet_name):
    credentials = None
    if os.path.exists("token.json"):
        credentials = Credentials.from_authorized_user_file("token.json", SCOPES)
    if not credentials or not credentials.valid:
        if credentials and credentials.expired and credentials.refresh_token:
            credentials.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file("backend/credentials.json", SCOPES)
            credentials = flow.run_local_server(port=62161)
        with open("token.json", "w") as token:
            token.write(credentials.to_json())

    try:
        service = build("sheets", "v4", credentials=credentials)
        spreadsheet = service.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()

        sheets = spreadsheet.get('sheets', '')
        for sheet in sheets:
            if sheet['properties']['title'] == sheet_name:
                return sheet['properties']['sheetId']

        return None  # Return None if the sheet name doesn't match any sheets
    except HttpError as error:
        return {"error": str(error)}
    

