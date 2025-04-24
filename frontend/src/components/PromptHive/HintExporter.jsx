import React, { useState, useEffect } from "react";

import {
  generateRandomString,
  getCurrentTimestamp,
} from "../../utilities/utils";
import {
  fetchGoogleSheetsData,
  fetchGoogleSheetsTitles,
  createNewSheet,
  appendRowsToSheet,
} from "../../services/googleSheetsService";
import { Button, Alert, Form } from "react-bootstrap";

const HintExporter = ({
  lessonContentAttributes,
  columnIndexMap,
  executePrompt,
  defaultSytemMessages,
  setGptResult,
  isJsonString,
  gptResult,
  gptLoading,
  insertHints,
  createMessageEntry,
  selectedSheetData,
  colHeaders,
}) => {
  const [outputSheetURL, setOutputSheetURL] = useState(
    "https://docs.google.com/spreadsheets/d/1Jbrh3WBHgiuWkuv1aXa2NMKkMVK8CpDhMjep1R8qNeA/edit?gid=1513559323#gid=1513559323"
  );
  const [exporting, setExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [outputSpreadsheetId, setOutputSpreadsheetId] = useState(
    "1Jbrh3WBHgiuWkuv1aXa2NMKkMVK8CpDhMjep1R8qNeA"
  );
  const [allHintsAndScaffolds, setAllHintsAndScaffolds] = useState([]);
  const [outputSheetName, setOutputSheetName] = useState("ExportedHints");

  // Enable the button when hints and scaffolds are generated
  useEffect(() => {
    if (allHintsAndScaffolds.length > 0) {
      console.log(
        "Hints and scaffolds are ready for export:",
        allHintsAndScaffolds
      );
    }
  }, [allHintsAndScaffolds]);

  const extractSheetIdFromUrl = (url) => {
    const regex = /\/d\/([a-zA-Z0-9-_]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleOutputSheetUrlChange = (e) => {
    const url = e.target.value;
    setOutputSheetURL(url);
    setOutputSpreadsheetId(extractSheetIdFromUrl(url) || "");
  };

  const handleOutputSheetNameChange = (e) => {
    setOutputSheetName(e.target.value);
  };

  async function clearAndReplaceRows(spreadsheetId, sheetData, sheetHeaders) {
    try {
      // Step 1: Clear each sheet
      for (const sheetName in sheetData) {
        if (sheetData.hasOwnProperty(sheetName)) {
          await clearSheetContents(spreadsheetId, sheetName);
          console.log(`Cleared existing contents in sheet '${sheetName}'`);
        }
      }

      await createAndAppendRows(spreadsheetId, sheetData, sheetHeaders);
      console.log("Data replaced successfully in all sheets.");
    } catch (error) {
      console.error("Error clearing or replacing rows in sheets:", error);
      throw new Error("Error clearing or replacing rows in sheets");
    }
  }

  async function clearSheetContents(spreadsheetId, sheetName) {
    const clearRange = `${sheetName}!A1:Z`;
    await sheets.spreadsheets.values.clear({
      spreadsheetId: spreadsheetId,
      range: clearRange,
    });
    console.log(
      `Cleared contents in range '${clearRange}' of sheet '${sheetName}'`
    );
  }

  async function createAndAppendRows(spreadsheetId, sheetData, sheetHeaders) {
    try {
      for (const sheetName in sheetData) {
        if (sheetData.hasOwnProperty(sheetName)) {
          const rows = sheetData[sheetName];
          const headers = sheetHeaders[sheetName] || [];

          await createNewSheet(spreadsheetId, sheetName);
          console.log(`Sheet '${sheetName}' created successfully.`);

          if (headers.length > 0) {
            const headerRange = `${sheetName}!A1`;
            await appendRowsToSheet(spreadsheetId, headerRange, [headers]);
            console.log(
              `Headers appended successfully to sheet '${sheetName}'.`
            );
          }

          // Ensure data starts directly after headers (row 2)
          const dataRange = `${sheetName}!A2`;
          await appendRowsToSheet(spreadsheetId, dataRange, rows);
          console.log(`Rows appended successfully to sheet '${sheetName}'.`);
        }
      }
    } catch (error) {
      console.error("Error creating sheet or appending rows:", error);
      throw new Error("Error creating sheet or appending rows");
    }
  }

  const exportToSheet = async () => {
    console.log(selectedSheetData);
    console.log(colHeaders);
    selectedSheetData = selectedSheetData.map((subarray) =>
      subarray.slice(0, 16)
    );
    colHeaders = colHeaders.splice(0, 16);
    const lessonContentAttributes = {
      problemName: "Problem Name",
      rowType: "Row Type",
      title: "Title",
      bodyText: "Body Text",
      answer: "Answer",
      answerType: "answerType",
      hintID: "HintID",
      dependency: "Dependency",
      mcChoices: "mcChoices",
      images: "Images (space delimited)",
      parent: "Parent",
      oerSrc: "OER src",
      openstaxKC: "openstax KC",
      kc: "KC",
      taxonomy: "Taxonomy",
      license: "License",
    };
    colHeaders = colHeaders.map(
      (header) => lessonContentAttributes[header] || header
    );
    if (!selectedSheetData || selectedSheetData.length === 0) {
      setErrorMessage("No hints and scaffolds available for export.");
      return;
    }

    setExporting(true);

    const sheetHeaders = {
      [outputSheetName]: colHeaders.splice(0, 16),
    };
    const sheetData = {
      [outputSheetName]: selectedSheetData,
    };

    try {
      await createAndAppendRows(outputSpreadsheetId, sheetData, sheetHeaders); // Use outputSpreadsheetId here
      setErrorMessage("Data exported successfully.");
    } catch (error) {
      setErrorMessage("Error exporting data.");
    } finally {
      setExporting(false);
    }
  };

  const isSuccessMessage = (msg) => {
    return typeof msg === "string" && msg.toLowerCase().includes("success");
  };

  return (
    <>
      <Form>
        <Form.Group className="mb-3" controlId="outputSheetURL">
          <Form.Label>Output Sheet URL</Form.Label>
          <Form.Control
            type="text"
            value={outputSheetURL}
            onChange={handleOutputSheetUrlChange}
            placeholder="Paste your Google Sheet URL here"
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="outputSheetName">
          <Form.Label>Output Sheet Name</Form.Label>
          <Form.Control
            type="text"
            value={outputSheetName}
            onChange={handleOutputSheetNameChange}
            placeholder="e.g. ExportedHints"
          />
        </Form.Group>

        <Button
          className="w-100"
          variant="primary"
          onClick={exportToSheet}
          disabled={exporting}
        >
          {exporting ? "Exporting..." : "Export to Output Sheet"}
        </Button>

        {errorMessage && (
          <Alert
            className="mt-3"
            variant={isSuccessMessage(errorMessage) ? "success" : "danger"}
            dismissible
            onClose={() => setErrorMessage(null)}
          >
            {errorMessage}
          </Alert>
        )}
      </Form>
    </>
  );
};

export default HintExporter;
