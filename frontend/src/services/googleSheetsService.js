import apiClient from "./PromptHiveAPI";

export const fetchGoogleSheetsData = async (
  spreadsheetId,
  range,
  filterCriteria
) => {
  try {
    const encodedSpreadsheetId = encodeURIComponent(spreadsheetId);
    const encodedRange = encodeURIComponent(range);
    const response = await apiClient.get(
      `/api/google-sheets/data?spreadsheetId=${encodedSpreadsheetId}&range=${encodedRange}`
    );
    console.log(response);
    if (!response.statusText == "OK") {
      throw new Error(
        `Failed to fetch data from Google Sheets: ${response.statusText}`
      );
    }
    let data = await response.data;

    // Apply filter if filterCriteria is provided
    if (filterCriteria) {
      const columnIndex = data[0].indexOf(filterCriteria.column);
      if (columnIndex !== -1) {
        data = data.filter((row) =>
          filterCriteria.values.includes(row[columnIndex])
        );
      } else {
        throw new Error(`Column ${filterCriteria.column} not found.`);
      }
    }

    return data;
  } catch (error) {
    console.error("Error fetching data from Google Sheets:", error);
    throw error;
  }
};

// Example usage
// const spreadsheetId = "your google sheets id from the url";
// const range = "Sheet1!A1:B10"; // Example range
// fetchGoogleSheetsData(spreadsheetId, range)
//   .then((data) => {
//     console.log("Data from Google Sheets:", data);
//     // Process the data here
//   })
//   .catch((error) => {
//     // Handle errors
//   });

export const fetchGoogleSheetsTitles = async (spreadsheetId) => {
  try {
    const encodedSpreadsheetId = encodeURIComponent(spreadsheetId);
    const response = await apiClient.get(
      `/api/google-sheets/titles?spreadsheetId=${encodedSpreadsheetId}`
    );
    if (!response.statusText == "OK") {
      throw new Error(
        `Failed to fetch sheet titles from Google Sheets: ${response.statusText}`
      );
    }
    const titles = await response.data;
    return titles;
  } catch (error) {
    console.error("Error fetching sheet titles from Google Sheets:", error);
    throw error;
  }
};
export const fetchGoogleSheetsFileName = async (spreadsheetId) => {
  try {
    const encodedSpreadsheetId = encodeURIComponent(spreadsheetId);
    const response = await apiClient.get(
      `/api/google-sheets/file-name?spreadsheetId=${encodedSpreadsheetId}`
    );
    if (!response.statusText == "OK") {
      throw new Error(
        `Failed to fetch Google Sheets file name: ${response.statusText}`
      );
    }
    const fileName = await response.data;
    return fileName;
  } catch (error) {
    console.error("Error fetching Google Sheets file name:", error);
    throw error;
  }
};

export const appendRowsToSheet = async (spreadsheetId, range, values) => {
  try {
    const response = await apiClient.post(`/api/google-sheets/append`, {
      spreadsheetId,
      range,
      values,
    });
    if (!response.statusText === "OK") {
      throw new Error(
        `Failed to append rows to Google Sheets: ${response.statusText}`
      );
    }
    return response.data;
  } catch (error) {
    console.error("Error appending rows to Google Sheets:", error);
    throw error;
  }
};

export const createNewSheet = async (spreadsheetId, sheetTitle) => {
  try {
    const response = await apiClient.post(`/api/google-sheets/create`, {
      spreadsheetId,
      sheetTitle,
    });
    if (!response.statusText === "OK") {
      throw new Error(
        `Failed to create new sheet in Google Sheets: ${response.statusText}`
      );
    }
    return response.data;
  } catch (error) {
    console.error("Error creating new sheet in Google Sheets:", error);
    throw error;
  }
};

export const deleteRowsFromSheet = async (
  spreadsheetId,
  sheetName,
  startIndex,
  endIndex
) => {
  try {
    const response = await apiClient.post(`/api/google-sheets/delete-rows`, {
      spreadsheetId,
      sheetName,
      startIndex,
      endIndex,
    });
    if (!response.statusText === "OK") {
      throw new Error(
        `Failed to delete rows from Google Sheets: ${response.statusText}`
      );
    }
    return response.data;
  } catch (error) {
    console.error("Error deleting rows from Google Sheets:", error);
    throw error;
  }
};

export const updateColumnsInSheet = async (spreadsheetId, range, values) => {
  try {
    const response = await apiClient.post(`/api/google-sheets/update-columns`, {
      spreadsheetId,
      range,
      values,
    });
    if (!response.statusText === "OK") {
      throw new Error(
        `Failed to update columns in Google Sheets: ${response.statusText}`
      );
    }
    return response.data;
  } catch (error) {
    console.error("Error updating columns in Google Sheets:", error);
    throw error;
  }
};
