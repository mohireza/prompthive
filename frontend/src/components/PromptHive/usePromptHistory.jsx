// usePromptHistory.jsx
import { useState } from "react";
import {
  generateRandomString,
  getCurrentTimestamp,
} from "../../utilities/utils";

const usePromptHistory = () => {
  const [promptHistory, setPromptHistory] = useState([]);

  const addPromptHistory = (data) => {
    if (!data) {
      console.error("Failed to add prompt history: No data provided.");
      return;
    }
    const newEntry = {
      promptGroupID: `promptGroupID_${generateRandomString(10)}`,
      promptVersionID: `promptVersionID_${generateRandomString(10)}`,
      timestamp: getCurrentTimestamp(),
      ...data,
    };
    setPromptHistory((prevHistory) => [...prevHistory, newEntry]);
  };

  const updatePromptHistory = (index, newData) => {
    if (index < 0 || index >= promptHistory.length) {
      console.error("Failed to update prompt history: Index out of bounds.");
      return;
    }
    setPromptHistory((prevHistory) =>
      prevHistory.map((entry, i) =>
        i === index ? { ...entry, ...newData } : entry
      )
    );
  };

  const deletePromptHistory = (index) => {
    if (index < 0 || index >= promptHistory.length) {
      console.error("Failed to delete prompt history: Index out of bounds.");
      return;
    }
    setPromptHistory((prevHistory) =>
      prevHistory.filter((_, i) => i !== index)
    );
  };

  return {
    promptHistory,
    addPromptHistory,
    updatePromptHistory,
    deletePromptHistory,
  };
};

export default usePromptHistory;
