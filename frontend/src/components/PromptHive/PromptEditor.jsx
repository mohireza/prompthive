import React, { useEffect, useRef, useState } from "react";
import Select from "react-select";

import CheckIcon from "@mui/icons-material/Check";
import ClearIcon from "@mui/icons-material/Clear";
import {
  Alert,
  Badge,
  Button,
  ButtonGroup,
  Card,
  Dropdown,
  Form,
  ListGroup,
  ListGroupItem,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { useHorizontalScroll } from "../PromptHive/useHorizontalScroll";

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";

import {
  faCheck,
  faClone,
  faEllipsisV,
  faFloppyDisk,
  faGrip,
  faPencil,
  faPlay,
  faPlus,
  faSpinner,
  faTrashAlt,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Reorder } from "framer-motion";
import ReactTextareaAutosize from "react-textarea-autosize";
import { API_BASE_URL } from "../../config";
import "../../scss/prompteditor.scss";
import {
  areSetsEqual,
  areUnorderedListsEqual,
  generateRandomString,
  getCurrentTimestamp,
  normalizeString,
  numberToLetters,
  isString,
} from "../../utilities/utils";
import HintExporter from "./HintExporter";

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function PromptEditor({
  selectedSheetData,
  columnIndexMap,
  setSheetInfo,
  lessonContentAttributes,
  setShowSettings,
  temperature,
  model,
  showSystemMessages,
  addMessageEntry,
  messageHistory,
  deleteMessageEntry,
  sheetInfo,
  addMessageEntryAtIndex,
  updateUserMessagesAtIndex,
  activeMessageIndex,
  setActiveMessageIndex,
  commitMessageEntryToLibrary,
  libraryTabKey,
  updateLessonsTestedOnPrompt,
  updateShetInfoAtIndex,
  blankUserMessages,
  defaultSytemMessages,
  notify,
  commitMessageEntryFromScratchpad,
  sheetId,
  createMessageEntry,
}) {
  const LOCAL_STORAGE_KEYS = {
    userMessages: "promptwriter_user_messages",
    systemMessages: "promptwriter_system_messages",
    scratchpadId: "promptwriter_scratchpad_id",
    parentScratchpadId: "promptwriter_parent_scratchpad_id",
  };

  const scrollRef = useHorizontalScroll();

  useEffect(() => {
    scrollToBottom2();
  }, [addMessageEntry]);

  const [showExportPanel, setShowExportPanel] = useState(true);

  const scrollToBottom2 = () => {
    activeMessageRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadStateFromLocalStorage = (key, defaultValue) => {
    const savedState = localStorage.getItem(key);
    return savedState ? JSON.parse(savedState) : defaultValue;
  };
  const [userMessages, setUserMessages] = useState(() =>
    loadStateFromLocalStorage(
      LOCAL_STORAGE_KEYS.userMessages,
      blankUserMessages
    )
  );
  const [scratchpadId, setScratchpadId] = useState(
    () => messageHistory[activeMessageIndex].scratchpadId
  );

  const [parentScratchpadId, setParentScratchpadId] = useState(
    () => messageHistory[activeMessageIndex].parentScratchpadId
  );
  const activeMessageRef = useRef(null);
  const debouncedUserMessagesValue = useDebounce(userMessages, 300);

  useEffect(() => {
    const entry = messageHistory[activeMessageIndex];
    if (entry) {
      setUserMessages(entry.userMessages);
      setSystemMessages(entry.systemMessages);
      setScratchpadId(entry.scratchpadId);
      setParentScratchpadId(entry.parentScratchpadId);
    }
  }, [activeMessageIndex]);

  const [systemMessages, setSystemMessages] = useState(() =>
    loadStateFromLocalStorage(
      LOCAL_STORAGE_KEYS.systemMessages,
      defaultSytemMessages
    )
  );

  const messagesEndRef = useRef(null);
  const prevMessagesRef = useRef();

  const [messageDrag, setMessageDrag] = useState(false);

  const [gptResult, setGptResult] = useState({});
  const [gptProgress, setGptProgress] = useState(0);
  const [gptProgressVisible, setGptProgressVisible] = useState(false);

  useEffect(() => {
    if (gptProgress === 100) {
      const timeout = setTimeout(() => {
        setGptProgressVisible(false); // Hide progress bar after a delay
      }, 2000); // Hide after 2 seconds

      // Cleanup the timeout if the component unmounts or gptProgress changes
      return () => clearTimeout(timeout);
    }
  }, [gptProgress]);

  const [gptLoading, setGptLoading] = useState({});
  const [gptLoadingFinished, setGptLoadingFinished] = useState(true);

  const [showLLMOutput, setShowLLMOutput] = useState(false);

  useEffect(() => {
    const result = {};
    for (const key in gptLoading) {
      if (gptLoading.hasOwnProperty(key) && !gptLoading[key]) {
        // Check if the corresponding gptResult is a valid JSON string
        const resultString = gptResult[key];
        if (isJsonString(resultString)) {
          const parsedResult = JSON.parse(resultString);
          if (parsedResult.hasOwnProperty("hints")) {
            const hints = parsedResult.hints;
            // Loop through the columnIndexMap and set values in the new row
            let hintRows = [];
            for (let i = 0; i < hints.length; i++) {
              const newRow = [];
              let hint = hints[i];
              for (const colKey in columnIndexMap) {
                if (columnIndexMap.hasOwnProperty(colKey)) {
                  const index = columnIndexMap[colKey];

                  // Ensure lessonContentAttributes[colKey] is valid
                  if (lessonContentAttributes.hasOwnProperty(colKey)) {
                    const attributeKey = lessonContentAttributes[colKey];
                    newRow[index] = hint.hasOwnProperty(attributeKey)
                      ? hint[attributeKey]
                      : "";
                  } else {
                    // If colKey is not a valid key in lessonContentAttributes, set an empty string
                    newRow[index] = "";
                  }
                }
              }
              newRow[columnIndexMap.oerSrc] = "openai";
              hintRows.push(newRow);
              //console.log(newRow);
            }
            result[key] = hintRows;
          }
          let updatedSelectedSheetData = insertHints(selectedSheetData, result);

          setSheetInfo((prevState) => ({
            ...prevState,
            selectedSheetData: updatedSelectedSheetData,
          }));
        }
      }
    }
  }, [gptLoading]); // Dependency array to trigger effect on changes to gptResult or gptLoading

  useEffect(() => {
    setGptProgress(calculateProgress());
  }, [gptLoading]);

  function calculateProgress() {
    // Check if gptLoading is defined and is an object
    if (typeof gptLoading !== "object" || gptLoading === null) {
      return 0; // Return 0 progress if gptLoading is not a valid object
    }

    const totalItems = Object.keys(gptResult).length; // Get total number of properties

    if (totalItems === 0) {
      return 0; // Return 0 progress if there are no items
    }

    const trueCount = Object.values(gptLoading).filter((value) => value).length; // Count the number of true values

    // Calculate the progress as the ratio of true values to total items
    const progress = ((totalItems - trueCount) / totalItems) * 100;
    return progress;
  }

  useEffect(() => {
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.userMessages,
      JSON.stringify(userMessages)
    );
  }, [userMessages]);

  useEffect(() => {
    updateUserMessagesAtIndex(activeMessageIndex, userMessages);
  }, [debouncedUserMessagesValue]);

  useEffect(() => {
    updateShetInfoAtIndex(activeMessageIndex, sheetInfo);
  }, [sheetInfo]);

  useEffect(() => {
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.systemMessages,
      JSON.stringify(systemMessages)
    );
  }, [systemMessages]);

  useEffect(() => {
    if (
      prevMessagesRef.current &&
      userMessages.length > prevMessagesRef.current.length
    ) {
      scrollToBottom();
      console.log("message");
    }
    prevMessagesRef.current = userMessages;
  }, [userMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const createMessage = (role, content) => {
    const message = {
      id: `message_${generateRandomString(5)}`,
      role: role,
      content: content,
      time_created: getCurrentTimestamp(),
      time_last_updated: getCurrentTimestamp(),
      disabled: false,
      hidden: false,
    };
    if (role == "user") {
      setUserMessages((prev) => [...prev, message]);
    } else if (role == "system") {
      setSystemMessages((prev) => [...prev, message]);
    } else {
      console.log("unreconized role, couldn't create message");
    }
  };

  const deleteMessage = (id) => {
    setUserMessages((prev) => prev.filter((message) => message.id !== id));
    setSystemMessages((prev) => prev.filter((message) => message.id !== id));
  };

  function insertHints(selectedSheetData, result) {
    selectedSheetData = selectedSheetData.filter(
      (row) =>
        normalizeString(row[1]) !== "hint" &&
        normalizeString(row[1]) !== "scaffold"
    );

    let modifiedData = [];
    let stepNumber = 1;
    let lastProblemName = "";
    for (let i = 0; i < selectedSheetData.length; i++) {
      let row = selectedSheetData[i];
      let rowType = row[columnIndexMap.rowType];
      let problemName = row[columnIndexMap.problemName];

      modifiedData.push(row);
      if (normalizeString(rowType) === "step") {
        let key = `${problemName}_step_${stepNumber}`;
        if (result.hasOwnProperty(key)) {
          result[key].forEach((hint) => {
            modifiedData.push(hint);
          });
        }
      }
      if (problemName !== lastProblemName) {
        lastProblemName = problemName;
        stepNumber = 1;
      } else {
        stepNumber = stepNumber + 1;
      }
    }

    return modifiedData;
  }

  const updateUserMessage = (id, role, content) => {
    setUserMessages((prev) =>
      prev.map((message) =>
        message.id === id
          ? {
              ...message,
              role: role,
              content: content,
              time_last_updated: getCurrentTimestamp(),
            }
          : message
      )
    );
  };

  const updateSystemMessage = (id, role, content) => {
    setSystemMessages((prev) =>
      prev.map((message) =>
        message.id === id
          ? {
              ...message,
              role: role,
              content: content,
              time_last_updated: getCurrentTimestamp(),
            }
          : message
      )
    );
  };

  const toggleSystemMessage = (id) => {
    console.log(id);
    setSystemMessages((prev) =>
      prev.map((message) =>
        message.id === id
          ? {
              ...message,
              disabled: !message.disabled,
            }
          : message
      )
    );
  };

  const setUserMessagesFromHistory = (index) => {
    const entry = messageHistory[index];
    if (entry) {
      setUserMessages(entry.userMessages);
    }
  };

  const setSystemMessagesFromHistory = (index) => {
    const entry = messageHistory[index];
    if (entry) {
      setSystemMessages(entry.systemMessages);
    }
  };

  const setSheetInfoFromHistory = (index) => {
    const entry = messageHistory[index];
    if (entry) {
      setSheetInfo(entry.sheetInfo);
    }
  };

  const getProblemListFromSheetInfo = (sheetInfo) => {
    // Check if sheetInfo and selectedSheetData exist and are arrays
    if (!sheetInfo || !Array.isArray(sheetInfo.selectedSheetData)) {
      return new Set(); // Return an empty set if conditions are not met
    }

    const problemNamesSet = new Set();

    // Iterate through each subarray in selectedSheetData
    sheetInfo.selectedSheetData.forEach((subArray) => {
      // Check if subArray is an array and has at least one element
      if (Array.isArray(subArray) && subArray.length > 0) {
        const problemName = subArray[0];
        if (typeof problemName === "string") {
          problemNamesSet.add(problemName); // Add problemName to the set to ensure uniqueness
        }
      }
    });

    // Return the set of unique problem names
    return problemNamesSet;
  };

  const setStatesFromMessageEntry = (index) => {
    // Check if messageHistory and the entry at the given index exist
    if (!Array.isArray(messageHistory) || !messageHistory[index]) {
      console.error("Invalid index or messageHistory is not an array.");
      return;
    }

    const entry = messageHistory[index];

    // Destructure with fallback values
    const {
      sheetInfo: entrySheetInfo = {},
      userMessages,
      systemMessages,
    } = entry;
    const displayedSheetInfo = sheetInfo || {};

    const displayedProblemList =
      getProblemListFromSheetInfo(displayedSheetInfo);
    const entryProblemList = getProblemListFromSheetInfo(entrySheetInfo);

    const displayedTitleIndexes =
      displayedSheetInfo.selectedSheetTitleIndexes || [];
    const entryTitleIndexes = entrySheetInfo.selectedSheetTitleIndexes || [];

    const sameProblems = areSetsEqual(entryProblemList, displayedProblemList);
    const sameLessons = areUnorderedListsEqual(
      entryTitleIndexes,
      displayedTitleIndexes
    );

    console.log("Same Problems:", sameProblems);
    if (!sameProblems) {
      console.log(entry);
      console.log(entryProblemList);
      console.log(displayedSheetInfo);
      console.log(displayedProblemList);
    }
    console.log("Same Lessons:", sameLessons);

    // Safely set user and system messages if they exist
    if (userMessages) {
      setUserMessages(userMessages);
    } else {
      console.warn("userMessages not found in entry.");
    }

    if (systemMessages) {
      setSystemMessages(systemMessages);
    } else {
      console.warn("systemMessages not found in entry.");
    }

    // Update sheetInfo only if the problems and lessons are the same
    if (sameProblems && sameLessons) {
      setSheetInfo(entrySheetInfo);
    } else {
      console.warn("Problems or lessons do not match; sheetInfo not updated.");
    }
  };

  function replaceVariables(str, variables, values) {
    if (variables.length !== values.length) {
      throw new Error("Variables and values arrays must have the same length");
    }

    let result = str;

    for (let i = 0; i < variables.length; i++) {
      const variable = variables[i].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // Escape special characters
      const value = values[i];

      const regex = new RegExp(variable, "g");
      result = result.replace(regex, value);
    }

    return result;
  }

  /**
   * Splits a string of image URLs into an array of individual URLs.
   *
   * @param {string} imageStr - A string containing image URLs, separated by a single space.
   * @returns {string[]} An array of individual image URLs. Returns an empty array if the input string is empty or consists solely of whitespace.
   */
  function splitImageStr(imageStr) {
    const trimmed = imageStr.trim();
    if (!trimmed) {
      return [];
    }
    return trimmed.split(" ").filter(Boolean);
  }

  /**
   * Appends a vision prompt to the list of messages being sent to a language model.
   *
   * @param {object[]} messages - The list of messages to which the vision prompt will be added.
   * @param {string[]} imageUrls - An array of image URLs to be included in the vision prompt.
   * @param {string} description - A description to be included along with the image URLs.
   */
  function appendVisionPrompt(messages, imageUrls, description) {
    if (imageUrls.length === 0) {
      return;
    }
    const content = [
      {
        type: "text",
        text: description,
      },
    ];
    for (const url of imageUrls) {
      content.push({
        type: "image_url",
        image_url: {
          url: url,
        },
      });
    }
    const visionPrompt = {
      role: "user",
      content: content,
    };
    messages.push(visionPrompt);
  }

  const executePrompt = async (messages, sheetData, batchSize) => {
    console.log("Begin executing prompt...");
    let rowIndex = 0;
    let problems = [];

    // Extract problems from sheetData
    while (rowIndex < sheetData.length) {
      let currentRow = sheetData[rowIndex];
      if (normalizeString(currentRow[columnIndexMap.rowType]) === "problem") {
        let variableToValue = { problemSteps: [] };
        variableToValue.problemName = currentRow[columnIndexMap.problemName];
        variableToValue.problemTitle = currentRow[columnIndexMap.title];
        variableToValue.problemBodyText = currentRow[columnIndexMap.bodyText];
        variableToValue.problemImages = currentRow[columnIndexMap.images];
        rowIndex++;
        while (rowIndex < sheetData.length) {
          currentRow = sheetData[rowIndex];
          if (
            normalizeString(currentRow[columnIndexMap.rowType]) === "problem"
          ) {
            break;
          }
          if (normalizeString(currentRow[columnIndexMap.rowType]) === "step") {
            variableToValue.problemSteps.push({
              stepTitle: currentRow[columnIndexMap.title],
              stepBodyText: currentRow[columnIndexMap.bodyText],
              stepAnswer: currentRow[columnIndexMap.answer],
              stepAnswerType: currentRow[columnIndexMap.answer],
              stepMcChoices: currentRow[columnIndexMap.mcChoices],
              stepImages: currentRow[columnIndexMap.images],
            });
          }
          rowIndex++;
        }
        problems.push(variableToValue);
      } else {
        rowIndex++;
      }
    }

    const processProblem = async (problem) => {
      for (let i = 0; i < problem.problemSteps.length; i++) {
        const step = problem.problemSteps[i];
        const variabalizedMessage = [];
        for (let message of messages) {
          let variables = [
            "{{problemName}}",
            "{{problemTitle}}",
            "{{problemBodyText}}",
            "{{problemImages}}",
            "{{stepTitle}}",
            "{{stepBodyText}}",
            "{{stepAnswer}}",
            "{{stepAnswerType}}",
            "{{stepMcChoices}}",
            "{{stepImages}}",
          ];
          let values = [
            problem.problemName,
            problem.problemTitle,
            problem.problemBodyText,
            problem.problemImages,
            step.stepTitle,
            step.stepBodyText,
            step.stepAnswer,
            step.stepAnswerType,
            step.stepMcChoices,
            step.stepImages,
          ];
          variabalizedMessage.push({
            role: message.role,
            content: replaceVariables(message.content, variables, values),
          });
        }
        if (isString(problem.problemImages)) {
          appendVisionPrompt(
            variabalizedMessage,
            splitImageStr(problem.problemImages),
            "The following images are included in the problem description. Please analyze them carefully, as they are essential for your problem-solving process."
          );
        }
        if (isString(step.stepImages)) {
          appendVisionPrompt(
            variabalizedMessage,
            splitImageStr(step.stepImages),
            "The following images are relevant to this step in solving the problem. Please take the time to analyze them carefully, as they play a crucial role in your problem-solving process."
          );
        }
        problem.problemSteps[i].stepMessages = variabalizedMessage;
      }

      for (let i = 0; i < problem.problemSteps.length; i++) {
        let step = problem.problemSteps[i];
        await getChatResponse(
          `${problem.problemName}_step_${i + 1}`,
          step.stepMessages
        );
      }
    };

    if (batchSize) {
      for (let i = 0; i < problems.length; i += batchSize) {
        const batch = problems.slice(i, i + batchSize);
        await Promise.all(batch.map(processProblem));
      }
    } else {
      await Promise.all(problems.map(processProblem));
    }

    console.log("End executing prompt...");
  };

  const getChatResponse = async (resultKey, messages) => {
    setGptLoadingFinished(false);
    let result = "";
    setGptResult((prevState) => ({
      ...prevState,
      [resultKey]: "",
    }));
    setGptLoading((prevState) => ({
      ...prevState,
      [resultKey]: true,
    }));
    try {
      const response = await fetch(`${API_BASE_URL}/chatGPT/json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messages,
          model: model,
          temperature: temperature,
          type: "oatutor_hints",
        }),
      });
      const text = await response.text();
      setGptLoading((prevState) => ({
        ...prevState,
        [resultKey]: false,
      }));
      setGptResult((prevState) => ({
        ...prevState,
        [resultKey]: text,
      }));
    } catch (error) {
      console.error("Something went wrong!", error);
    } finally {
      setGptLoadingFinished(true);
      return result;
    }
    //   await fetchEventSource("http://127.0.0.1:8080/chatGPT/json", {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     openWhenHidden: true,
    //     body: JSON.stringify({
    //       messages: messages,
    //       model: model,
    //       temperature: temperature,
    //       type: "json_object",
    //     }),
    //     onmessage(message) {
    //       // console.log(message.data);
    //       setGptResult((prevState) => ({
    //         ...prevState,
    //         [resultKey]: prevState[resultKey]
    //           ? prevState[resultKey] + message.data
    //           : message.data,
    //       }));
    //       setGptLoading((prevState) => ({
    //         ...prevState,
    //         [resultKey]: true,
    //       }));
    //     },
    //     onclose() {
    //       setGptLoading((prevState) => ({
    //         ...prevState,
    //         [resultKey]: false,
    //       }));
    //     },
    //   });
    // } catch (error) {
    //   console.error("Something went wrong!", error);
    // } finally {
    //   setGptLoadingFinished(true);
    //   return result;
    // }
  };

  const resetLocalStorage = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.userMessages);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.systemMessages);
    setSystemMessages(defaultSytemMessages);
    setUserMessages([]);
  };
  // Function to check if a string is a valid JSON string
  const isJsonString = (str) => {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  };

  // Function to render values, including nested objects and arrays
  const renderValue = (value, keyPrefix) => {
    if (isJsonString(value)) {
      const parsedValue = JSON.parse(value);
      return renderObject(parsedValue, keyPrefix);
    }
    if (typeof value === "object" && value !== null) {
      return renderObject(value, keyPrefix);
    }
    return value ? <span>{value}</span> : null;
  };

  const renderObject = (obj, keyPrefix = "") => {
    if (typeof obj === "object" && obj !== null) {
      if (Array.isArray(obj)) {
        return (
          <List>
            {obj.map((item, index) => (
              <ListItem key={`${keyPrefix}-${index}`}>
                {renderValue(item, `${keyPrefix}-${index}`)}
              </ListItem>
            ))}
          </List>
        );
      } else {
        return (
          <List>
            {Object.entries(obj)
              .filter(
                ([key, value]) =>
                  value !== "" && value !== null && value !== undefined
              )
              .map(([key, value], index) => (
                <ListItem key={`${keyPrefix}-${key}`}>
                  <ListItemText
                    primary={key}
                    secondary={renderValue(value, `${keyPrefix}-${key}`)}
                  />
                </ListItem>
              ))}
          </List>
        );
      }
    }
    return obj ? <span>{obj}</span> : null;
  };

  const MessageHistoryViewer = ({ messageHistory }) => (
    <>
      <ListGroup horizontal ref={scrollRef}>
        {messageHistory.map((entry, index) => (
          <>
            <ListGroup.Item
              disabled={gptProgressVisible}
              action
              active={activeMessageIndex == index}
              className="p-0 d-flex align-items-center justify-content-around rounded-0"
              style={{ width: "fit-content" }}
            >
              <span
                className={
                  messageHistory.length > 1 ? "p-1 px-2 ps-3" : "p-1 px-4 pe-4"
                }
                onClick={() => {
                  setActiveMessageIndex(index);
                  setStatesFromMessageEntry(index);
                }}
                // onMouseEnter={() => {
                //   setActiveMessageIndex(index);
                //   setStatesFromMessageEntry(index);
                // }}
                // onMouseLeave={() => {
                //   setStatesFromMessageEntry(activeMessageIndex);
                // }}
              >
                <strong>{numberToLetters(index)}</strong>
              </span>

              {messageHistory.length > 1 ? (
                <Button
                  className="rounded-circle square-md me-1"
                  size="sm"
                  variant={index == activeMessageIndex ? "primary" : "outline"}
                  onClick={() => {
                    deleteMessageEntry(index);
                  }}
                >
                  <FontAwesomeIcon icon={faXmark} size="xs" fixedWidth />
                </Button>
              ) : (
                <></>
              )}
            </ListGroup.Item>
          </>
        ))}
      </ListGroup>
    </>
  );
  return (
    <>
      <Card className="border-top border-bottom border-0 rounded-0 prompt-writing-card">
        <Card.Header className="p-0 pt-1 ps-2">
          <strong>Prompt Scratch Pad</strong>
          <div className="border-0  d-flex ms-2 align-items-center">
            <div className="flex-grow-1 d-flex  message-history-container">
              <div className="align-self-end message-history-listgroup">
                <MessageHistoryViewer messageHistory={messageHistory} />
              </div>

              <div className="d-flex">
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Create New Blank Prompt</Tooltip>}
                  delay={{ show: 600, hide: 0 }}
                >
                  <Button
                    className="ms-1 text-nowrap new-button"
                    disabled={gptProgressVisible}
                    size="sm"
                    variant="light"
                    onClick={() => {
                      setActiveMessageIndex(messageHistory.length);
                      addMessageEntry(
                        systemMessages,
                        blankUserMessages,
                        sheetInfo
                      );
                    }}
                  >
                    <FontAwesomeIcon icon={faPlus} fixedWidth /> NEW
                  </Button>
                </OverlayTrigger>

                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Clone Selected Prompt</Tooltip>}
                  delay={{ show: 600, hide: 0 }}
                >
                  <Button
                    className="text-nowrap"
                    disabled={activeMessageIndex == null || gptProgressVisible}
                    size="sm"
                    variant="light"
                    onClick={() => {
                      addMessageEntryAtIndex(
                        systemMessages,
                        userMessages,
                        sheetInfo,
                        activeMessageIndex,
                        scratchpadId
                      );
                      setActiveMessageIndex((prevState) => prevState + 1);
                    }}
                  >
                    <FontAwesomeIcon icon={faClone} fixedWidth /> CLONE
                  </Button>
                </OverlayTrigger>
                <OverlayTrigger
                  placement="top"
                  overlay={
                    <Tooltip>
                      Save Prompt to{" "}
                      {libraryTabKey == "textbook"
                        ? "Textbook-Level "
                        : "Lesson-Level "}
                      Shared Library
                    </Tooltip>
                  }
                  delay={{ show: 600, hide: 0 }}
                >
                  <Button
                    className="text-nowrap"
                    size="sm"
                    variant="light"
                    onClick={() => {
                      commitMessageEntryToLibrary(activeMessageIndex);
                    }}
                    disabled={
                      gptProgressVisible ||
                      activeMessageIndex == null ||
                      (sheetInfo.selectedSheetTitleIndexes.length !== 1 &&
                        libraryTabKey != "textbook")
                    }
                  >
                    <FontAwesomeIcon icon={faFloppyDisk} fixedWidth /> SAVE
                  </Button>
                </OverlayTrigger>
              </div>
            </div>

            <div className="d-flex align-items-center">
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>Run Prompt</Tooltip>}
                delay={{ show: 600, hide: 0 }}
              >
                <Button
                  className="text-nowrap"
                  size="sm"
                  variant="light"
                  onClick={() => {
                    setGptProgressVisible(true);
                    executePrompt(
                      Array.prototype.concat(userMessages, systemMessages),
                      selectedSheetData
                    );
                    commitMessageEntryFromScratchpad(activeMessageIndex);
                    //updateLessonsTestedOnPrompt(activeMessageIndex);
                  }}
                >
                  <FontAwesomeIcon icon={faPlay} fixedWidth /> RUN
                </Button>
              </OverlayTrigger>
              <Dropdown>
                <Dropdown.Toggle variant="light" id="scratchpad-dropdown ">
                  <FontAwesomeIcon icon={faEllipsisV} fixedWidth />
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Item
                    onClick={() => {
                      setShowLLMOutput((prev) => !prev);
                    }}
                  >
                    {showLLMOutput ? "Hide" : "Inspect"} LLM Output
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => {
                      setShowExportPanel((prev) => !prev);
                    }}
                  >
                    Export Prompt Output
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>
        </Card.Header>
        <Card.Body className="prompt-writing-card-body p-0">
          {gptProgressVisible ? (
            <LinearProgress
              variant={gptProgress > 0 ? "determinate" : "indeterminate"}
              value={gptProgress}
              color={gptProgress == 100 ? "success" : "primary"}
            />
          ) : (
            <></>
          )}
          <PanelGroup autoSaveId="oatutor-prompt-panels" direction="horizontal">
            <Panel>
              <Card className="panel-card rounded-0">
                <Card.Body className="panel-card-body p-0">
                  {showSystemMessages ? (
                    <>
                      <p className="text-center divider mt-2">
                        <small>System Messages</small>
                      </p>
                      <Alert variant={"danger"} className="m-2">
                        Take caution when modifying system messages. Incorrect
                        changes could lead to unintended effects and prevent
                        hints from being properly formatted.
                      </Alert>
                      <ListGroup>
                        <Reorder.Group
                          axis="y"
                          values={systemMessages}
                          onReorder={setSystemMessages}
                          className="reorder-group"
                          layoutScroll
                        >
                          {systemMessages.map((message) => (
                            <Reorder.Item
                              key={`item_${message.id}`}
                              value={message}
                              dragListener={messageDrag}
                              className="reorder-item"
                            >
                              <ListGroupItem
                                key={`listgroupitem_${message.id}`}
                                className="rounded-3 m-2 p-0"
                              >
                                <div className="d-flex">
                                  <div className="d-flex flex-column content-panel p-0">
                                    {/* <Form.Select
                                  key={`role_${message.id}`}
                                  className="rounded-bottom-0 border border-light"
                                  size="sm"
                                  value={message.role}
                                  aria-label="Select user role"
                                  onChange={(e) => {
                                    updateSystemMessage(
                                      message.id,
                                      e.target.value,
                                      message.content
                                    );
                                  }}
                                >
                                  {Object.keys(roles).map((key) => (
                                    <option key={key} value={roles[key]}>
                                      {roles[key]}
                                    </option>
                                  ))}
                                </Form.Select> */}
                                    <ReactTextareaAutosize
                                      maxRows={10}
                                      className="p-2 m-0 rounded-2 rounded-top-0 border border-light"
                                      style={{
                                        resize: "none",
                                        width: "100%",
                                      }}
                                      disabled={message.disabled}
                                      value={message.content}
                                      placeholder="Enter message..."
                                      minRows={4}
                                      onChange={(e) =>
                                        updateSystemMessage(
                                          message.id,
                                          message.role,
                                          e.target.value
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="d-flex flex-column justify-content-between side-panel">
                                    <Button
                                      disabled={message.disabled}
                                      className="p-0"
                                      size="sm"
                                      variant="light"
                                    >
                                      <div
                                        className="reorder-handle text-end"
                                        onPointerEnter={(e) => {
                                          setMessageDrag(true);
                                        }}
                                        onPointerLeave={(e) => {
                                          setMessageDrag(false);
                                        }}
                                      >
                                        <FontAwesomeIcon icon={faGrip} />
                                      </div>
                                    </Button>

                                    <ButtonGroup vertical>
                                      <Button
                                        size="sm"
                                        variant="light"
                                        onClick={() => {
                                          toggleSystemMessage(message.id);
                                        }}
                                      >
                                        {message.disabled ? (
                                          <FontAwesomeIcon icon={faPencil} />
                                        ) : (
                                          <FontAwesomeIcon icon={faCheck} />
                                        )}
                                      </Button>
                                      <Button
                                        size="sm"
                                        disabled={systemMessages.length === 1}
                                        variant="light"
                                        onClick={() => {
                                          deleteMessage(message.id);
                                        }}
                                      >
                                        <FontAwesomeIcon icon={faTrashAlt} />
                                      </Button>
                                    </ButtonGroup>
                                  </div>
                                </div>

                                <div ref={messagesEndRef} />
                              </ListGroupItem>
                            </Reorder.Item>
                          ))}
                        </Reorder.Group>
                      </ListGroup>
                      <div className="d-grid gap-2">
                        <Button
                          className="m-1"
                          size="sm"
                          variant="light"
                          onClick={() => {
                            createMessage("system", "");
                          }}
                        >
                          Add System Message <FontAwesomeIcon icon={faPlus} />
                        </Button>
                      </div>
                      <p className="text-center divider mt-2">
                        <small>User Messages</small>
                      </p>
                      <ListGroup>
                        <Reorder.Group
                          axis="y"
                          values={userMessages}
                          onReorder={setUserMessages}
                          className="reorder-group"
                          layoutScroll
                        >
                          {userMessages.map((message) => (
                            <Reorder.Item
                              key={`item_${message.id}`}
                              value={message}
                              dragListener={messageDrag}
                              className="reorder-item"
                            >
                              <ListGroupItem
                                key={`listgroupitem_${message.id}`}
                                className="rounded-3 m-2 p-0"
                              >
                                <div className="d-flex">
                                  <div className="d-flex flex-column content-panel p-0">
                                    {/* <Form.Select
                                  key={`role_${message.id}`}
                                  className="rounded-bottom-0 border border-light"
                                  size="sm"
                                  value={message.role}
                                  aria-label="Select user role"
                                  onChange={(e) => {
                                    updateUserMessage(
                                      message.id,
                                      e.target.value,
                                      message.content
                                    );
                                  }}
                                >
                                  {Object.keys(roles).map((key) => (
                                    <option key={key} value={roles[key]}>
                                      {roles[key]}
                                    </option>
                                  ))}
                                </Form.Select> */}
                                    <ReactTextareaAutosize
                                      maxRows={10}
                                      className="p-2 m-0 rounded-2 rounded-top-0 border border-light"
                                      style={{ resize: "none", width: "100%" }}
                                      value={message.content}
                                      placeholder="Enter message..."
                                      minRows={3}
                                      onChange={(e) =>
                                        updateUserMessage(
                                          message.id,
                                          message.role,
                                          e.target.value
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="d-flex flex-column justify-content-between side-panel">
                                    <div
                                      className="reorder-handle text-end"
                                      onPointerEnter={(e) => {
                                        setMessageDrag(true);
                                      }}
                                      onPointerLeave={(e) => {
                                        setMessageDrag(false);
                                      }}
                                    >
                                      <FontAwesomeIcon icon={faGrip} />
                                    </div>
                                    <Button
                                      size="sm"
                                      disabled={userMessages.length === 1}
                                      variant="light"
                                      className="m-1"
                                      onClick={() => {
                                        deleteMessage(message.id);
                                      }}
                                    >
                                      <FontAwesomeIcon icon={faTrashAlt} />
                                    </Button>
                                  </div>
                                </div>

                                <div ref={messagesEndRef} />
                              </ListGroupItem>
                            </Reorder.Item>
                          ))}
                        </Reorder.Group>{" "}
                      </ListGroup>
                      <div className="d-grid gap-2">
                        <Button
                          className="m-1"
                          size="sm"
                          variant="light"
                          onClick={() => {
                            createMessage("user", "");
                          }}
                        >
                          Add User Message <FontAwesomeIcon icon={faPlus} />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {userMessages.length > 0 ? (
                        <>
                          <Form
                            style={{
                              width: "100%",
                              height: "100%",
                            }}
                          >
                            <Form.Control
                              className="rounded-0"
                              as="textarea"
                              value={userMessages[0].content}
                              onChange={(e) =>
                                updateUserMessage(
                                  userMessages[0].id,
                                  userMessages[0].role,
                                  e.target.value
                                )
                              }
                              placeholder={`Enter a ${
                                libraryTabKey == "textbook"
                                  ? "textbook-level"
                                  : "lesson-level"
                              } prompt for generating helpful hints and scaffolds...`}
                              style={{
                                width: "100%",
                                height: "100%",
                                resize: "none",
                              }}
                            />
                          </Form>
                        </>
                      ) : (
                        <></>
                      )}
                    </>
                  )}
                </Card.Body>
              </Card>
            </Panel>
            <PanelResizeHandle />
            <Panel>
              {showLLMOutput ? (
                <>
                  <Card className="panel-card rounded-0">
                    <Card.Header>
                      <div className="d-flex align-items-center justify-content-between">
                        <div>
                          <strong className="me-2">LLM OUTPUT</strong>
                          <Badge>{model}</Badge>
                        </div>
                        <Button
                          size="sm"
                          className="p-0"
                          variant="light"
                          onClick={() => {
                            setGptResult({});
                            setShowLLMOutput(false);
                          }}
                        >
                          <FontAwesomeIcon icon={faXmark} fixedWidth />
                        </Button>
                      </div>
                    </Card.Header>
                    <Card.Body className="panel-card-body">
                      {Object.entries(gptResult).length > 0 ? (
                        <>
                          {Object.entries(gptResult).map(
                            ([key, value], index) => (
                              <Accordion key={index}>
                                <AccordionSummary
                                  expandIcon={<ExpandMoreIcon />}
                                >
                                  <Typography
                                    sx={{ width: "60%", flexShrink: 0 }}
                                  >
                                    {key}
                                  </Typography>
                                  <Typography sx={{ color: "text.secondary" }}>
                                    {isJsonString(value) ? (
                                      <Chip
                                        icon={<CheckIcon />}
                                        label="Valid JSON"
                                        variant="outlined"
                                        size="small"
                                      />
                                    ) : gptLoading[key] ? (
                                      <FontAwesomeIcon icon={faSpinner} spin />
                                    ) : (
                                      <Chip
                                        icon={<ClearIcon />}
                                        label="Invalid JSON"
                                        variant="outlined"
                                        size="small"
                                      />
                                    )}
                                  </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                  {renderValue(value, key)}
                                </AccordionDetails>
                              </Accordion>
                            )
                          )}
                        </>
                      ) : (
                        <>
                          <h1 className="display-1 text-muted text-center mt-3">
                            <FontAwesomeIcon icon={faPlay} />
                          </h1>
                          <p className="lead text-center p-2">
                            Run the prompt to inspect its output.
                          </p>
                        </>
                      )}
                    </Card.Body>
                  </Card>
                </>
              ) : (
                <></>
              )}
            </Panel>
            <PanelResizeHandle />
            <Panel>
              {showExportPanel ? (
                <>
                  <Card className="panel-card rounded-0">
                    <Card.Header>
                      <div className="d-flex align-items-center justify-content-between">
                        <div>
                          <strong className="me-2">EXPORT WIZARD</strong>
                          <Badge>{model}</Badge>
                        </div>
                        <Button
                          size="sm"
                          className="p-0"
                          variant="light"
                          onClick={() => {
                            setShowExportPanel(false);
                          }}
                        >
                          <FontAwesomeIcon icon={faXmark} fixedWidth />
                        </Button>
                      </div>
                    </Card.Header>
                    <Card.Body className="panel-card-body">
                    <HintExporter
  spreadsheetId={sheetId}
  lessonContentAttributes={lessonContentAttributes}
  columnIndexMap={columnIndexMap}
  setSheetInfo={setSheetInfo}
  sheetInfo={sheetInfo}
  setGptResult={setGptResult}
  insertHints={insertHints}
  executePrompt={executePrompt}
  gptResult={gptResult}
  gptLoading={gptLoading}
  isJsonString={isJsonString}
  defaultSytemMessages={defaultSytemMessages}
  createMessageEntry={createMessageEntry}
  selectedSheetData={selectedSheetData}
  colHeaders={Object.keys(columnIndexMap)}
/>
                    </Card.Body>
                  </Card>
                </>
              ) : (
                <></>
              )}
            </Panel>
          </PanelGroup>
        </Card.Body>
      </Card>
    </>
  );
}
