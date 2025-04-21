import React, { useState } from "react";
import {
  appendRowsToSheet,
  deleteRowsFromSheet,
  updateColumnsInSheet,
  fetchGoogleSheetsTitles,
  fetchGoogleSheetsData,
} from "../../services/googleSheetsService"; // Make sure to adjust the import path according to your project structure

const GoogleSheetsManager = () => {
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [sheetId, setSheetId] = useState("");
  const [range, setRange] = useState("");
  const [newRows, setNewRows] = useState([["", ""]]);
  const [updateValues, setUpdateValues] = useState([["", ""]]);
  const [startIndex, setStartIndex] = useState("");
  const [endIndex, setEndIndex] = useState("");
  const [sheetTitles, setSheetTitles] = useState([]);
  const [sheetData, setSheetData] = useState([]);

  const handleAppendRows = async () => {
    try {
      await appendRowsToSheet(spreadsheetId, range, newRows);
      alert("Rows appended successfully!");
    } catch (error) {
      console.error("Failed to append rows:", error);
      alert("Failed to append rows.");
    }
  };

  const handleDeleteRows = async () => {
    try {
      await deleteRowsFromSheet(
        spreadsheetId,
        sheetId,
        parseInt(startIndex),
        parseInt(endIndex)
      );
      alert("Rows deleted successfully!");
    } catch (error) {
      console.error("Failed to delete rows:", error);
      alert("Failed to delete rows.");
    }
  };

  const handleUpdateColumns = async () => {
    try {
      await updateColumnsInSheet(spreadsheetId, range, updateValues);
      alert("Columns updated successfully!");
    } catch (error) {
      console.error("Failed to update columns:", error);
      alert("Failed to update columns.");
    }
  };

  const handleFetchSheetTitles = async () => {
    try {
      const titles = await fetchGoogleSheetsTitles(spreadsheetId);
      setSheetTitles(titles);
    } catch (error) {
      console.error("Failed to fetch sheet titles:", error);
      alert("Failed to fetch sheet titles.");
    }
  };

  const handleFetchSheetData = async () => {
    try {
      const data = await fetchGoogleSheetsData(spreadsheetId, range);
      setSheetData(data);
    } catch (error) {
      console.error("Failed to fetch sheet data:", error);
      alert("Failed to fetch sheet data.");
    }
  };

  return (
    <div>
      <h1>Google Sheets Manager</h1>

      <div>
        <label>
          Spreadsheet ID:
          <input
            type="text"
            value={spreadsheetId}
            onChange={(e) => setSpreadsheetId(e.target.value)}
          />
        </label>
      </div>

      <div>
        <label>
          Sheet ID:
          <input
            type="text"
            value={sheetId}
            onChange={(e) => setSheetId(e.target.value)}
          />
        </label>
      </div>

      <div>
        <label>
          Range (e.g., Sheet1!A1:B2):
          <input
            type="text"
            value={range}
            onChange={(e) => setRange(e.target.value)}
          />
        </label>
      </div>

      <div>
        <label>
          New Rows (comma-separated values):
          <textarea
            value={newRows.map((row) => row.join(",")).join("\n")}
            onChange={(e) =>
              setNewRows(
                e.target.value.split("\n").map((row) => row.split(","))
              )
            }
          />
        </label>
        <button onClick={handleAppendRows}>Append Rows</button>
      </div>

      <div>
        <label>
          Start Index (row number to start deletion):
          <input
            type="number"
            value={startIndex}
            onChange={(e) => setStartIndex(e.target.value)}
          />
        </label>
        <label>
          End Index (row number to end deletion):
          <input
            type="number"
            value={endIndex}
            onChange={(e) => setEndIndex(e.target.value)}
          />
        </label>
        <button onClick={handleDeleteRows}>Delete Rows</button>
      </div>

      <div>
        <label>
          Update Values (comma-separated values):
          <textarea
            value={updateValues.map((row) => row.join(",")).join("\n")}
            onChange={(e) =>
              setUpdateValues(
                e.target.value.split("\n").map((row) => row.split(","))
              )
            }
          />
        </label>
        <button onClick={handleUpdateColumns}>Update Columns</button>
      </div>

      <div>
        <button onClick={handleFetchSheetTitles}>Fetch Sheet Titles</button>
        <ul>
          {sheetTitles.map((title, index) => (
            <li key={index}>{title}</li>
          ))}
        </ul>
      </div>

      <div>
        <button onClick={handleFetchSheetData}>Fetch Sheet Data</button>
        <pre>{JSON.stringify(sheetData, null, 2)}</pre>
      </div>
    </div>
  );
};

export default GoogleSheetsManager;
