import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  ButtonGroup,
  Nav,
  ListGroup,
  Tab,
  Tabs,
  ListGroupItem,
  OverlayTrigger,
  Tooltip,
  Alert,
  ProgressBar,
} from "react-bootstrap";
import {
  Avatar,
  Box,
  Checkbox,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

import {
  generateRandomString,
  getCurrentTimestamp,
  generateAvatarFromSeed,
  generateNameFromSeed,
  getFormattedTimestamp,
} from "../../utilities/utils";

import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBook,
  faClock,
  faClone,
  faCog,
  faDeleteLeft,
  faDice,
  faFileImport,
  faGripLines,
  faGripLinesVertical,
  faLink,
  faMagicWandSparkles,
  faMinus,
  faPlus,
  faRefresh,
  faSpinner,
  faTimes,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import _, { random } from "underscore";
import {
  fetchGoogleSheetsTitles,
  fetchGoogleSheetsData,
  fetchGoogleSheetsFileName,
} from "../../services/googleSheetsService";
import "../../scss/hintviewer.scss";
import SheetContent from "./SheetContent";
import Footer from "../Footer/Footer";
import NavHeader from "../Header/NavHeader";
import PromptEditor from "./PromptEditor";
import HintSettings from "./HintSettings";
import { faThumbsUp } from "@fortawesome/free-regular-svg-icons";
import { promptHintLibraryService } from "../../services/promptHintLibraryService";
import { auto } from "@popperjs/core";

// Define column indices
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
  validatorCheck: "Validator Check",
  timeLastChecked: "Time Last Checked",
  debugLink: "Debug Link",
  problemID: "Problem ID",
  lessonID: "Lesson ID",
  imageChecksum: "Image Checksum",

  // backend/latex_converter_service: attributes for rendered formulas
  titleRendered: "Title Rendered",
  titleRenderedForTutoring: "Title Tutoring",
  bodyTextRendered: "Body Text Rendered",
  bodyTextRenderedForTutoring: "Body Text Tutoring",
  answerRendered: "Answer Rendered",
  answerRenderedForTutoring: "Answer Rendered Tutoring",
  answerTypeRendered: "answerType Rendered",
  answerTypeRenderedForTutoring: "answerType Tutoring",
  answerRenderedForMC: "answerMCR",
  mcChoicesRendered: "mcChoicesMCR",
};

const roles = { system: "system", user: "user" };

const exampleJson = {
  hints: [
    {
      "Problem Name": "{{problemName}}",
      "Row Type": "<hint or scaffold>",
      Title: "<title of the hint>",
      "Body Text": "<body text of the hint>",
      Answer: "<answer if the Row Type is scaffold, blank if Row Type is hint>",
      answerType: "<numeric or algebra or mc>",
      HintID: "<hX where x is the unique hint number.>",
      Dependency:
        "<id of hint on which this hint depends on, keep blank if no dependency>",
      mcChoices:
        "<answer choices if answerType is mc, blank otherwise. Seperate answer choices with |>",
    },
  ],
};

const LOCAL_STORAGE_KEYS = {
  sheetLink: "hintviewer_sheetLink",
  sheetInfo: "hintviewer_sheetInfo",
  sheetId: "hintviewer_sheetId",
  showSettings: "hintviewer_show_settings",
  temperature: "hintviewer_temperature",
  model: "hintviewer_model",
  showSystemMessages: "hintviewer_show_system_messages",
  messageHistory: "hintviewer_message_history",
  userId: "hintviewer_user_id",
  activeMessageIndex: "hintviewer_active_message_index",
  showHumanHints: "hintviewer_show_human_hints",
};

function useInterval(callback, delay) {
  useEffect(() => {
    const intervalId = setInterval(() => {
      callback();
    }, delay);

    // Cleanup the interval on component unmount
    return () => clearInterval(intervalId);
  }, [callback, delay]);
}

export default function HintViewer() {
  const loadStateFromLocalStorage = (key, defaultValue) => {
    const savedState = localStorage.getItem(key);
    return savedState ? JSON.parse(savedState) : defaultValue;
  };

  const [sheetLink, setSheetLink] = useState(() =>
    loadStateFromLocalStorage(LOCAL_STORAGE_KEYS.sheetLink, "")
  );

  const [userId, setUserId] = useState(() =>
    loadStateFromLocalStorage(
      LOCAL_STORAGE_KEYS.userId,
      `user_${generateRandomString(5)}`
    )
  );

  const [showSettings, setShowSettings] = useState(
    loadStateFromLocalStorage(LOCAL_STORAGE_KEYS.showSettings, false)
  );

  const MIN_PROBLEM_COUNT = 1; // maximum value for problemCount
  const MAX_PROBLEM_COUNT = 6; // minimum value for problemCount
  const [problemCount, setProblemCount] = React.useState(4);
  const [loadSheetInfo, setLoadSheetInfo] = React.useState(false);

  const [sheetId, setSheetId] = useState(() =>
    loadStateFromLocalStorage(LOCAL_STORAGE_KEYS.sheetId, "")
  );

  const handleProblemCountChange = (event) => {
    const newCount = Math.max(1, Number(event.target.value));
    setProblemCount(newCount);
  };

  const defaultSheetInfo = {
    fileName: "",
    sheetTitles: [],
    selectedSheetTitleIndexes: [],
    colHeaders: [],
    problemNames: [],
    selectedSheetData: null,
    loading: false,
    error: null,
    columnIndexMap: {},
  };

  const [sheetInfo, setSheetInfo] = useState(() =>
    loadStateFromLocalStorage(LOCAL_STORAGE_KEYS.sheetInfo, defaultSheetInfo)
  );
  const [libraryTabKey, setLibraryTabKey] = useState("textbook");
  const [lessonLibraryPromptList, setLessonLibraryPromptList] = useState([]);
  const [textbookLibraryPromptList, setTextbookLibraryPromptList] = useState(
    []
  );

  const [sortOption, setSortOption] = useState("time"); // 'time' or 'likes'

  const sortedTextbookLibraryPromptList = textbookLibraryPromptList.sort(
    (a, b) => {
      if (sortOption === "time") {
        return new Date(b.dateCreated) - new Date(a.dateCreated);
      } else if (sortOption === "likes") {
        return b.likes - a.likes;
      }
      return 0;
    }
  );

  const sortedLessonLibraryPromptList = lessonLibraryPromptList.sort((a, b) => {
    if (sortOption === "time") {
      return new Date(b.dateCreated) - new Date(a.dateCreated);
    } else if (sortOption === "likes") {
      return b.likes - a.likes;
    }
    return 0;
  });

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  const models = {
    gpt_4o: "gpt-4o",
    gpt_4_turbo: "gpt-4-turbo",
    gpt_3_5_turbo: "gpt-3.5-turbo-0125",
  };

  const [activeMessageIndex, setActiveMessageIndex] = useState(
    loadStateFromLocalStorage(LOCAL_STORAGE_KEYS.activeMessageIndex, 0)
  );

  useEffect(() => {
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.activeMessageIndex,
      JSON.stringify(activeMessageIndex)
    );
  }, [activeMessageIndex]);

  useEffect(() => {
    refreshLibrary();

    // Set interval to run the function every 30 seconds
    const intervalId = setInterval(refreshLibrary, 10000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [libraryTabKey, sheetId, sheetInfo]);

  useEffect(() => {
    console.log(sheetInfo);
  }, [sheetInfo]);

  const createMessageEntry = (
    systemMessages,
    userMessages,
    sheetInfo,
    parentScratchpadId
  ) => ({
    userId: userId,
    likes: 0,
    timestamp: getCurrentTimestamp(),
    systemMessages,
    userMessages,
    sheetInfo,
    parentScratchpadId: parentScratchpadId,
    scratchpadId: generateRandomString(16),
  });
  const roles = { system: "system", user: "user" };
  const blankUserMessages = [
    {
      id: `message_${generateRandomString(5)}`,
      role: roles.user,
      content: ``,
      time_created: getCurrentTimestamp(),
      time_last_updated: getCurrentTimestamp(),
      disabled: false,
      hidden: true,
    },
  ];
  const defaultSytemMessages = [
    {
      id: `message_${generateRandomString(5)}`,
      role: roles.system,
      content: `The output should always be valid JSON.`,
      time_created: getCurrentTimestamp(),
      time_last_updated: getCurrentTimestamp(),
      disabled: true,
      hidden: true,
    },
    {
      id: `message_${generateRandomString(5)}`,
      role: roles.system,
      content: `The data schema should be like this example:
      ${JSON.stringify(exampleJson)}
      `,
      time_created: getCurrentTimestamp(),
      time_last_updated: getCurrentTimestamp(),
      disabled: true,
      hidden: true,
    },
    {
      id: `message_${generateRandomString(5)}`,
      role: roles.system,
      content: `The problem is as follows:
      
      Problem Name: {{problemName}} //do not change this
      Problem Title: {{problemTitle}}
      Problem Body Text: {{problemBodyText}}

      Step Title: {{stepTitle}}
      Step Body Text: {{stepBodyText}}
      Step Answer: {{stepAnswer}} //applicable if Row Type is step or scaffold
      Step Answer Type: {{stepAnswerType}} //can be numeric, algebra, or mc (multiple choice)
      Step Mc Choices: {{stepMcChoices}} //only applicable if Step Answer Type is mc        
      `,
      time_created: getCurrentTimestamp(),
      time_last_updated: getCurrentTimestamp(),
      disabled: true,
      hidden: true,
    },
    {
      id: `message_${generateRandomString(5)}`,
      role: roles.system,
      content:
        'You must ensure that all mathematical expressions in your output adhere to a specific inline formula format referred to as OpenStax. You must NOT wrap the formulas in any delimiters. It is essential that every math formula you produce aligns with the detailed operations and their respective syntax outlined below:\n\n### Formatting Rules\n\n1. **Spacing:**  \n   - **Rule:** Leave no spaces between operations or values in equations.\n   - **Example:**  \n     - Wrong: `x + y`  \n     - Correct: `x+y`\n\n2. **Parentheses:**  \n   - **Rule:** Only use `(` and `)` and employ them multiple times in a row if necessary.\n\n3. **Addition:**  \n   - **Expression:** `"x plus y"`  \n   - **Syntax:** `x+y`\n\n4. **Subtraction:**  \n   - **Expression:** `"x minus y"`  \n   - **Syntax:** `x-y`\n\n5. **Multiplication:**  \n   - **Expression:** `"x times y"`  \n   - **Syntax:** `x*y`\n\n6. **Division/Fraction:**  \n   - **Expression:** `"x divided by y"` or `"x over y"`  \n   - **Syntax:** `x/y`\n\n7. **Exponent:**  \n   - **Expression:** `"x to the power of y"`  \n   - **Syntax:** `x**y`\n\n8. **Square Root:**  \n   - **Expression:** `"square root of x"`  \n   - **Syntax:** `sqrt(x)`\n\n9. **nth Root:**  \n   - **Expression:** `"yth root of x"`  \n   - **Syntax:** `sqrt(y,x)`\n\n10. **Addition and/or Subtraction:**  \n    - **Expression:** `"x plus/minus y"`  \n    - **Syntax:** `x~y`\n\n11. **Absolute Value:**  \n    - **Expression:** `"absolute value of x"`  \n    - **Syntax:** `abs(x)`\n\n12. **Infinity:**  \n    - **Expression:** `"infinity"`  \n    - **Syntax:** `inf`\n\n13. **Comparison:**  \n    - **Expression:** `"x less than y, x greater than y"`  \n    - **Syntax:** `x<y , x>y`\n\n14. **Pipe:**  \n    - **Expression:** `"x given x greater than 1"`  \n    - **Syntax:** `x\\pipe x>1`\n\n15. **Matrix:**  \n    - **Example:** `Row 1 = 1 2, Row 2 = 3 4`  \n    - **Syntax:** `/mat{(1,2),(3,4)}`\n\n16. **Logarithm:**  \n    - **Expression:** `log base 9 of 5`  \n    - **Syntax:** `log{9}{5}`\n\n17. **Subscript:**  \n    - **Expression:** `x base y`  \n    - **Syntax:** `x_y`\n\n18. **Summation:**  \n    - **Description:** `first group is lower bound (with = written as \\=), second group is upper bound, and third group is the expression to be summed`  \n    - **Syntax:** `sum{i\\=1}{100}{i**2}`\n\n19. **Limit:**  \n    - **Description:** `limit of c, as a approaches b`  \n    - **Syntax:** `/lim{a,b,c}`\n\n20. **Definite Integral:**  \n    - **Description:** `the integral of f with respect to x (over the domain of a to b)`  \n    - **Syntax:** `/int{f,a,b,x}`\n\n21. **Indefinite Integral:**  \n    - **Description:** `the integral of f with respect to x`  \n    - **Syntax:** `/int{f,x}`\n\n### Important Note\nEnsure that you **do not leave spaces in equations**:\n- **Wrong:** `x + y`\n- **Correct:** `x+y`\n\nIf you intend for the expression `ab\u00b2`, please write it as `a*b**2`, not `ab**2`, as the latter will be interpreted as `(ab)\u00b2`.\n\n---\n\nThis prompt should help the model understand the required formatting for generating mathematical expressions with the OpenStax inline formula format.',
      time_created: getCurrentTimestamp(),
      time_last_updated: getCurrentTimestamp(),
      disabled: true,
      hidden: true,
    },
  ];
  const [messageHistory, setMessageHistory] = useState(() =>
    loadStateFromLocalStorage(LOCAL_STORAGE_KEYS.messageHistory, [
      createMessageEntry(defaultSytemMessages, blankUserMessages, sheetInfo),
    ])
  );

  const addMessageEntry = (
    systemMessages,
    userMessages,
    sheetInfo,
    parentScratchpadId
  ) => {
    const newEntry = createMessageEntry(
      systemMessages,
      userMessages,
      sheetInfo,
      parentScratchpadId
    );
    setMessageHistory([...messageHistory, newEntry]);
  };

  const commitMessageEntryToLibrary = async (messageIndex) => {
    const messageEntry = messageHistory[messageIndex];
    const selectedSheetIndex = sheetInfo.selectedSheetTitleIndexes[0];
    const selectedSheetTitle = sheetInfo.sheetTitles[selectedSheetIndex];
    const response = await promptHintLibraryService.commitPromptToSharedLibrary(
      userId,
      messageEntry,
      libraryTabKey == "textbook" ? null : selectedSheetTitle,
      sheetId,
      messageEntry.lessonsTested ?? []
    );
    if (response.status === 201) {
      console.log("hello there", libraryTabKey, response.status);
      setMessageHistory(
        messageHistory.map((message, index) => {
          if (index === messageIndex) {
            message.parentId = response.data.id;
            message.id = response.data.id;
            message.userId = response.data.userId;
          }
          return message;
        })
      );

      if (libraryTabKey == "textbook") {
        console.log("hello there", libraryTabKey);
        console.log("ping");
        notify("Committed to text-book level shared prompt library");
        getTextbookLevelPromptList(sheetId);
      } else {
        notify("Committed to lesson-book level shared prompt library");
        getLessonLevelPromptList(
          sheetId,
          sheetInfo.sheetTitles[sheetInfo.selectedSheetTitleIndexes[0]]
        );
      }
    }
  };

  const getEntryPreview = (entry) => {
    const content = entry.userMessages[0].content;
    if (content === "") {
      return "Blank entry...";
    }
    if (entry.userMessages && entry.userMessages.length > 0) {
      return entry.userMessages[0].content;
    }
    return "No preview available";
  };

  const upvoteMessageEntry = async (index) => {
    console.log("upvoting message");
    if (libraryTabKey == "textbook") {
      const response = await promptHintLibraryService.toggleLikePrompt(
        textbookLibraryPromptList[index].id,
        userId
      );
      if (response.status == 201) {
        console.log("ping 1");
        getTextbookLevelPromptList(sheetId);
      } else {
        console.log("error liking textbook level prompt", response.status);
      }
    } else {
      const response = await promptHintLibraryService.toggleLikePrompt(
        lessonLibraryPromptList[index].id,
        userId
      );
      if (response.status == 201) {
        getLessonLevelPromptList(
          sheetId,
          sheetInfo.sheetTitles[sheetInfo.selectedSheetTitleIndexes[0]]
        );
      } else {
        console.log("error liking lesson level prompt", response.status);
      }
    }
  };

  const archivePrompt = async (entry) => {
    const response = await promptHintLibraryService.archivePrompt(
      entry.id,
      userId
    );
    if (response.status === 201) {
      if (libraryTabKey === "textbook") {
        await getTextbookLevelPromptList(sheetId);
      } else {
        await getLessonLevelPromptList(
          sheetId,
          sheetInfo.sheetTitles[sheetInfo.selectedSheetTitleIndexes[0]]
        );
      }
    }
  };

  const importMessageEntryFromLibrary = (entry) => {
    setActiveMessageIndex(messageHistory.length);
    const newEntry = { ...entry };
    newEntry.parentId = entry.id;
    newEntry.parentScratchpadId = entry.scratchpadId;
    newEntry.scratchpadId = generateRandomString(16);
    setMessageHistory([...messageHistory, newEntry]);
  };

  const addMessageEntryAtIndex = (
    systemMessages,
    userMessages,
    sheetInfo,
    index,
    parentScratchpadId
  ) => {
    const newEntry = createMessageEntry(
      systemMessages,
      userMessages,
      sheetInfo,
      parentScratchpadId
    );
    setMessageHistory((prevMessageHistory) => {
      const updatedMessageHistory = [
        ...prevMessageHistory.slice(0, index),
        newEntry,
        ...prevMessageHistory.slice(index),
      ];
      return updatedMessageHistory;
    });
  };

  const updateMessageEntry = (index, updatedEntry) => {
    const newMessageHistory = messageHistory.map((entry, i) =>
      i === index ? { ...entry, ...updatedEntry } : entry
    );
    setMessageHistory(newMessageHistory);
  };

  const updateUserMessagesAtIndex = (index, newUserMessages) => {
    setMessageHistory((prevMessageHistory) =>
      prevMessageHistory.map((entry, i) =>
        i === index ? { ...entry, userMessages: newUserMessages } : entry
      )
    );
  };

  const updateShetInfoAtIndex = (index, newSheetInfo) => {
    setMessageHistory((prevMessageHistory) =>
      prevMessageHistory.map((entry, i) =>
        i === index ? { ...entry, sheetInfo: newSheetInfo } : entry
      )
    );
  };

  const updateUserMessageContentAtIndexAndId = (
    index,
    newContent,
    messageId
  ) => {
    setMessageHistory((prevMessageHistory) =>
      prevMessageHistory.map((entry, i) => {
        if (i === index) {
          return {
            ...entry,
            userMessages: entry.userMessages.map((message) =>
              message.id === messageId
                ? {
                    ...message,
                    content: newContent,
                    time_last_updated: getCurrentTimestamp(),
                  }
                : message
            ),
          };
        }
        return entry;
      })
    );
  };

  // const updateUserMessageContentAtIndexAndId = (
  //   index,
  //   messageId,
  //   newContent
  // ) => {
  //   setMessageHistory((prevMessageHistory) =>
  //     prevMessageHistory.map((entry, i) => {
  //       if (i === index) {
  //         let messageFound = false;
  //         const updatedMessages = entry.userMessages.map((message) => {
  //           if (!messageFound && message.id === messageId) {
  //             messageFound = true;
  //             return {
  //               ...message,
  //               content: newContent,
  //               time_last_updated: getCurrentTimestamp(),
  //             };
  //           }
  //           return message;
  //         });

  //         return { ...entry, userMessages: updatedMessages };
  //       }
  //       return entry;
  //     })
  //   );
  // };

  const updateSheetInfoAtIndex = (index, newSheetInfo) => {
    setMessageHistory((prevMessageHistory) =>
      prevMessageHistory.map((entry, i) =>
        i === index ? { ...entry, sheetInfo: newSheetInfo } : entry
      )
    );
  };

  const deleteMessageEntry = (index) => {
    const newMessageHistory = messageHistory.filter((_, i) => i !== index);
    if (newMessageHistory.length >= 1) {
      setMessageHistory(newMessageHistory);
      setActiveMessageIndex((prevIndex) => {
        // Ensure the new index is within the valid range (e.g., non-negative)
        if (prevIndex >= newMessageHistory.length) {
          return newMessageHistory.length - 1;
        } else {
          // If already at the first message, return the current index
          return prevIndex;
        }
      });
    }
  };

  const [temperature, setTemperature] = useState(() =>
    loadStateFromLocalStorage(LOCAL_STORAGE_KEYS.temperature, 1)
  );
  const [model, setModel] = useState(() =>
    loadStateFromLocalStorage(LOCAL_STORAGE_KEYS.model, models.gpt_4o)
  );

  const [showSystemMessages, setShowSystemMessages] = useState(
    loadStateFromLocalStorage(LOCAL_STORAGE_KEYS.showSystemMessages, false)
  );

  const [showHumanHints, setShowHumanHints] = useState(
    loadStateFromLocalStorage(LOCAL_STORAGE_KEYS.showHumanHints, false)
  );

  useEffect(() => {
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.showHumanHints,
      JSON.stringify(showHumanHints)
    );
  }, [showHumanHints]);

  useEffect(() => {
    console.log("ping 2");
    getTextbookLevelPromptList(sheetId);
    console.log(textbookLibraryPromptList);
  }, []);

  useEffect(() => {
    if (
      sheetInfo.selectedSheetTitleIndexes &&
      sheetInfo.selectedSheetTitleIndexes.length == 1
    ) {
      getLessonLevelPromptList(
        sheetId,
        sheetInfo.sheetTitles[sheetInfo.selectedSheetTitleIndexes[0]]
      );
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.temperature,
      JSON.stringify(temperature)
    );
  }, [temperature]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.userId, JSON.stringify(userId));
  }, [userId]);

  useEffect(() => {
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.messageHistory,
      JSON.stringify(messageHistory)
    );
  }, [messageHistory]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.model, JSON.stringify(model));
  }, [model]);

  useEffect(() => {
    if (
      sheetInfo.sheetTitles.length > 0 &&
      sheetInfo.selectedSheetTitleIndexes.length > 0 &&
      loadSheetInfo
    ) {
      console.log("Trying to load sheet info");
      handleSheetClick();
      setLoadSheetInfo(false);
    }
  }, [sheetInfo.selectedSheetTitleIndexes, loadSheetInfo]);

  // useEffect(() => {
  //   handleSheetClick(sheetInfo.selectedSheetTitle);
  // }, [problemCount]);

  useEffect(() => {
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.sheetLink,
      JSON.stringify(sheetLink)
    );
  }, [sheetLink]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.sheetId, JSON.stringify(sheetId));
  }, [sheetId]);

  useEffect(() => {
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.sheetInfo,
      JSON.stringify(sheetInfo)
    );
    updateSheetInfoAtIndex(activeMessageIndex, sheetInfo);
  }, [sheetInfo.selectedSheetTitleIndexes]);

  useEffect(() => {
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.showSettings,
      JSON.stringify(showSettings)
    );
  }, [showSettings]);

  useEffect(() => {
    const sheetIdFromLink = extractSheetIdFromLink(sheetLink);
    if (sheetIdFromLink) {
      setSheetId(sheetIdFromLink);
      getTextbookLevelPromptList(sheetIdFromLink);
    }
  }, [sheetLink]);

  useEffect(() => {
    if (sheetId) {
      Promise.all([
        fetchGoogleSheetsTitles(sheetId),
        fetchGoogleSheetsFileName(sheetId),
      ])
        .then(([sheetTitles, fileName]) => {
          setSheetInfo((prevState) => ({
            ...prevState,
            sheetTitles,
            fileName,
            error: null,
          }));
        })
        .catch((error) =>
          setSheetInfo((prevState) => ({
            ...prevState,
            error,
          }))
        )
        .finally(() => {
          setSheetInfo((prevState) => ({ ...prevState, loading: false }));
          setLoadSheetInfo(true);
        });
    } else {
      // setSheetInfo(defaultSheetInfo);
    }
  }, [sheetId, problemCount]);

  useEffect(() => {
    if (sheetInfo.colHeaders.length > 0) {
      const columnIndexMap = {};
      Object.keys(lessonContentAttributes).forEach((key) => {
        columnIndexMap[key] = sheetInfo.colHeaders.indexOf(
          lessonContentAttributes[key]
        );
      });
      setSheetInfo((prevState) => ({
        ...prevState,
        columnIndexMap,
      }));
    }
  }, [sheetInfo.colHeaders]);

  const getTextbookLevelPromptList = async (spreadsheetId) => {
    try {
      const defaultPromtList =
        await promptHintLibraryService.getTextbookLibraryPromptList(
          spreadsheetId
        );
      //promptHintLibraryService.getTextbookLibraryPromptList(spreadsheetLink)
      defaultPromtList.forEach((messageEntry) => {
        messageEntry.systemMessages = defaultSytemMessages;
        messageEntry.sheetInfo = sheetInfo;
      });
      setTextbookLibraryPromptList(defaultPromtList);
      console.log(textbookLibraryPromptList);
    } catch (err) {
      console.log("error getting textbook level prompts", err);
    }
  };

  const getLessonLevelPromptList = async (spreadsheetId, lessonName) => {
    try {
      const defaultPromtList =
        await promptHintLibraryService.getLessonLibraryPromptList(
          spreadsheetId,
          lessonName
        );
      //promptHintLibraryService.getTextbookLibraryPromptList(spreadsheetLink)
      defaultPromtList.forEach((messageEntry) => {
        messageEntry.systemMessages = defaultSytemMessages;
        messageEntry.sheetInfo = sheetInfo;
      });
      setLessonLibraryPromptList(defaultPromtList);
    } catch (err) {
      console.log("error getting lesson level prompts", err);
    }
  };

  function refreshLibrary() {
    if (libraryTabKey === "textbook") {
      getTextbookLevelPromptList(sheetId);
    } else {
      getLessonLevelPromptList(
        sheetId,
        sheetInfo.sheetTitles[sheetInfo.selectedSheetTitleIndexes[0]]
      );
    }
  }

  const commitMessageEntryFromScratchpad = async (messageIndex) => {
    const testedLessons = sheetInfo.selectedSheetTitleIndexes.map(
      (index) => sheetInfo.sheetTitles[index]
    );
    setMessageHistory(
      messageHistory.map((messageEntry, i) => {
        if (i === messageIndex) {
          messageEntry.lessonsTested = testedLessons;
          if (!messageEntry.scratchpadId) {
            messageEntry.scratchpadId = generateRandomString(16);
          }
          console.log(messageEntry.lessonsTested);
        }
        return messageEntry;
      })
    );
    const selectedSheetIndex = sheetInfo.selectedSheetTitleIndexes[0];
    const selectedSheetTitle = sheetInfo.sheetTitles[selectedSheetIndex];
    const response = await promptHintLibraryService.commitPromptFromScratchpad(
      userId,
      messageHistory[messageIndex],
      libraryTabKey == "textbook" ? null : selectedSheetTitle,
      sheetId,
      testedLessons
    );
    if (response.status === 201) {
      setMessageHistory(
        messageHistory.map((messageEntry, i) => {
          if (i === messageIndex) {
            messageEntry.parentScratchpadId = messageEntry.scratchpadId;
            messageEntry.scratchpadId = generateRandomString(16);
            console.log(messageEntry.scratchpadId);
          }
          return messageEntry;
        })
      );
    }
  };

  const updateLessonsTestedOnPrompt = async (messageIndex) => {
    const testedLessons = sheetInfo.selectedSheetTitleIndexes.map(
      (index) => sheetInfo.sheetTitles[index]
    );
    console.log("bi");
    setMessageHistory(
      messageHistory.map((messageEntry, i) => {
        if (i === messageIndex) {
          if (!messageEntry.lessonsTested) {
            messageEntry.lessonsTested = [];
          }
          const prevTested = messageEntry.lessonsTested;
          messageEntry.lessonsTested = [...prevTested, ...testedLessons];
          console.log(messageEntry.lessonsTested);
        }
        return messageEntry;
      })
    );
    if (messageHistory[messageIndex].id) {
      const response = await promptHintLibraryService.updateLessonsTested(
        messageHistory[messageIndex].id,
        testedLessons
      );
      if (response.status === 201) {
        console.log("ping 4");
        await getTextbookLevelPromptList(sheetId);
        if (sheetInfo.selectedSheetTitleIndexes.length == 1) {
          await getLessonLevelPromptList(
            sheetId,
            sheetInfo.sheetTitles[sheetInfo.selectedSheetTitleIndexes[0]]
          );
        }
      }
    }
  };

  const handleLessonClick = (titleIndex) => () => {
    const currentIndex =
      sheetInfo.selectedSheetTitleIndexes.indexOf(titleIndex);
    let newChecked = [...sheetInfo.selectedSheetTitleIndexes];

    if (currentIndex === -1) {
      if (libraryTabKey == "textbook") {
        newChecked.push(titleIndex);
      } else {
        newChecked = [titleIndex];
      }
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setLoadSheetInfo(true);
    setSheetInfo((prevState) => ({
      ...prevState,
      selectedSheetTitleIndexes: newChecked,
    }));

    if (newChecked.length == 1) {
      getLessonLevelPromptList(sheetId, sheetInfo.sheetTitles[newChecked[0]]);
    } else {
      setLibraryTabKey("textbook");
      setLessonLibraryPromptList([]);
    }
  };

  const extractSheetIdFromLink = (link) => {
    const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    const match = link.match(regex);
    return match ? match[1] : null;
  };

  const sheetInfoLoaded = () => {
    return (
      !sheetInfo.error &&
      !sheetInfo.fileName.error &&
      !sheetInfo.fileName == "" &&
      sheetInfo.selectedSheetData
    );
  };
  const handleSheetClick = async () => {
    try {
      setSheetInfo((prevState) => ({
        ...prevState,
        error: null,
        loading: true,
      }));

      let allHeaders = [];
      let allUniqueProblemNames = [];
      let allData = [];

      for (const [
        index,
        titleIndex,
      ] of sheetInfo.selectedSheetTitleIndexes.entries()) {
        const title = sheetInfo.sheetTitles[titleIndex];

        const problemCountPerLesson = Math.floor(
          problemCount / sheetInfo.selectedSheetTitleIndexes.length
        );
        const finalLesson =
          sheetInfo.selectedSheetTitleIndexes.length - 1 == index;

        const finalLessonCount =
          problemCount -
          problemCountPerLesson * sheetInfo.selectedSheetTitleIndexes.length;

        const firstRowRange = `${title}!1:1`;
        const headers = await fetchGoogleSheetsData(sheetId, firstRowRange);
        if (headers && Array.isArray(headers)) {
          allHeaders.push(...headers.flat());
        }

        const firstColumnRange = `${title}!A2:A`;
        const problemNames = await fetchGoogleSheetsData(
          sheetId,
          firstColumnRange
        );
        if (Array.isArray(problemNames)) {
          const uniqueProblemNames = [...new Set(problemNames.flat())];
          allUniqueProblemNames.push(...uniqueProblemNames);
          const filterCriteria = {
            column: lessonContentAttributes.problemName,
            values: _.sample(uniqueProblemNames, problemCount),
          };

          const data = await fetchGoogleSheetsData(
            sheetId,
            title,
            filterCriteria
          );
          allData.push(...data);
        }
      }
      setSheetInfo((prevState) => ({
        ...prevState,
        colHeaders: allHeaders,
        problemNames: [...new Set(allUniqueProblemNames)],
        selectedSheetData: allData,
      }));
    } catch (error) {
      console.error("Error fetching sheet data:", error);
      setSheetInfo((prevState) => ({ ...prevState, error }));
    } finally {
      setSheetInfo((prevState) => ({ ...prevState, loading: false }));
    }
  };

  const resetLocalStorage = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.sheetLink);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.sheetId);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.sheetInfo);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.model);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.temperature);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.showSystemMessages);
    setSheetLink("");
    setSheetId("");
    setSheetInfo(defaultSheetInfo);

    setModel(models.gpt_4_turbo);
    setTemperature(1);
    setShowSystemMessages(false);
  };
  const notify = (message) =>
    toast.success(message, {
      position: "top-right",
      autoClose: 2001,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    });

  const [user, setUser] = useState("hello");
  return (
    <Container fluid className="p-0">
      {/* <Form>
        <Form.Control value={user} onChange={(e) => setUser(e.target.value)} />
      </Form>
      <Button onClick={() => {}}>{generateNameFromSeed(user)}</Button>{" "} */}
      <div>
        <ToastContainer
          position="top-right"
          autoClose={2001}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
      <HintSettings
        show={showSettings}
        onHide={() => setShowSettings(false)}
        model={model}
        models={models}
        temperature={temperature}
        showSystemMessages={showSystemMessages}
        resetLocalStorage={resetLocalStorage}
        resetHintViwerLocalStorage={resetLocalStorage}
        setModel={setModel}
        setTemperature={setTemperature}
        setShowSystemMessages={setShowSystemMessages}
        showHumanHints={showHumanHints}
        setShowHumanHints={setShowHumanHints}
      />
      <NavHeader />
      <Row>
        <PanelGroup
          autoSaveId="oatutor-hintviewer-panel"
          direction="horizontal"
        >
          <Panel defaultSize={25}>
            <Card className="rounded-0 border-end-0">
              <Card.Header className="sheet-header d-flex align-items-center justify-content-between">
                <div className="text-truncate">
                  {sheetInfo.fileName.error
                    ? ""
                    : sheetInfo.fileName.toString()}
                </div>

                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Load 4 random lessons</Tooltip>}
                  delay={{ show: 600, hide: 0 }}
                >
                  <Button
                    size="sm"
                    className="ms-2 p-2"
                    variant="light"
                    onClick={() => {
                      const indices = _.range(sheetInfo.sheetTitles.length);
                      const randomIndices = _.sample(indices, 4);
                      console.log(randomIndices);
                      setSheetInfo((prevState) => ({
                        ...prevState,
                        selectedSheetTitleIndexes: randomIndices,
                      }));
                      setLoadSheetInfo(true);
                    }}
                  >
                    <FontAwesomeIcon icon={faDice} />
                  </Button>
                </OverlayTrigger>
              </Card.Header>
              <Card.Body className="sheet-list p-0">
                <List>
                  {Array.isArray(sheetInfo?.sheetTitles) ? (
                    sheetInfo.sheetTitles.map((title, index) => {
                      const labelId = `checkbox-list-secondary-label-${index}`;
                      return (
                        <ListItem key={index} disablePadding>
                          <ListItemButton onClick={handleLessonClick(index)}>
                            <ListItemText>{title}</ListItemText>
                            {libraryTabKey == "textbook" ? (
                              <Checkbox
                                className="p-0"
                                checked={
                                  sheetInfo.selectedSheetTitleIndexes &&
                                  sheetInfo.selectedSheetTitleIndexes.indexOf(
                                    index
                                  ) !== -1
                                }
                                tabIndex={-1}
                                disableRipple
                                inputProps={{ "aria-labelledby": labelId }}
                              />
                            ) : (
                              <Checkbox
                                className="p-0"
                                style={{ opacity: 0 }}
                                disabled
                                checked={
                                  sheetInfo.selectedSheetTitleIndexes &&
                                  sheetInfo.selectedSheetTitleIndexes.indexOf(
                                    index
                                  ) !== -1
                                }
                                tabIndex={-1}
                                disableRipple
                                inputProps={{ "aria-labelledby": labelId }}
                              />
                            )}
                          </ListItemButton>
                        </ListItem>
                      );
                    })
                  ) : (
                    <ListItemButton disabled>
                      {sheetInfo.error && sheetInfo.error.message
                        ? `Error fetching titles: ${sheetInfo.error.message}`
                        : "No titles available"}
                    </ListItemButton>
                  )}
                </List>
              </Card.Body>
            </Card>
          </Panel>
          <PanelResizeHandle className="d-flex flex-column align-items-center justify-content-center border-start border-end">
            <FontAwesomeIcon
              icon={faGripLinesVertical}
              size="xs"
              className="p-2"
            />
          </PanelResizeHandle>
          <Panel>
            <Card className="problems-card rounded-0 border-start-0 border-end-0 border-bottom-0">
              <Card.Header className="d-flex problems-card-header align-items-center">
                <InputGroup>
                  <Form.Control
                    className="text-truncate me-2"
                    placeholder="Paste OATutor Google Sheet link here..."
                    aria-label="Paste OATutor Google Sheet link here..."
                    defaultValue={sheetLink}
                    style={{ width: '600px' }}
                    onChange={(e) => setSheetLink(e.target.value)}
                  />
                  <Form.Control
                    type="number"
                    defaultValue={problemCount}
                    onChange={handleProblemCountChange}
                    min={1}
                    className="ms-2"
                    aria-label="Number of problems"
                  />
                </InputGroup>
                <OverlayTrigger
                  placement="top"
                  delay={{ show: 600, hide: 0 }}
                  overlay={<Tooltip>Your username</Tooltip>}
                >
                  <Chip
                    label={<strong>{generateNameFromSeed(userId)}</strong>}
                    avatar={
                      <Avatar
                        alt={generateNameFromSeed(userId)}
                        src={generateAvatarFromSeed(userId)}
                      />
                    }
                    variant="outlined"
                  />
                </OverlayTrigger>
                <OverlayTrigger
                  placement="top"
                  delay={{ show: 600, hide: 0 }}
                  overlay={<Tooltip>Settings</Tooltip>}
                >
                  <Button
                    variant="light"
                    className="ms-1"
                    onClick={() => {
                      setShowSettings((prev) => !prev);
                    }}
                  >
                    <FontAwesomeIcon icon={faCog} />
                  </Button>
                </OverlayTrigger>
              </Card.Header>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <div className="lesson-chips">
                    {sheetInfoLoaded() &&
                    sheetInfo?.selectedSheetTitleIndexes?.length > 1 ? (
                      <>
                        {sheetInfo.selectedSheetTitleIndexes.map(
                          (titleIndex) => (
                            <>
                              {libraryTabKey == "textbook" ? (
                                <>
                                  <Chip
                                    label={sheetInfo.sheetTitles[titleIndex]}
                                    variant={"outlined"}
                                    onDelete={handleLessonClick(titleIndex)}
                                    className="me-1 mt-1"
                                  />
                                </>
                              ) : (
                                <>
                                  <Chip
                                    label={sheetInfo.sheetTitles[titleIndex]}
                                    variant={"fill"}
                                    color="default"
                                    onClick={() => {
                                      setSheetInfo((prevState) => ({
                                        ...prevState,
                                        selectedSheetTitleIndexes: [titleIndex],
                                      }));
                                    }}
                                    onDelete={handleLessonClick(titleIndex)}
                                    className="me-1 mt-1"
                                  />
                                </>
                              )}
                            </>
                          )
                        )}
                      </>
                    ) : (
                      <>
                        {sheetInfoLoaded() &&
                        sheetInfo?.selectedSheetTitleIndexes?.length == 1 ? (
                          <>
                            <Chip
                              label={
                                sheetInfo?.selectedSheetTitleIndexes
                                  ? sheetInfo?.sheetTitles[
                                      sheetInfo?.selectedSheetTitleIndexes[0]
                                    ]
                                  : ""
                              }
                              variant={"outlined"}
                              className="me-1 mt-1"
                            />
                          </>
                        ) : (
                          <></>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <ButtonGroup size="sm">
                  {/* <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Reduce problem count</Tooltip>}
                  delay={{ show: 600, hide: 0 }}
                >
                  <Button
                    aria-label="reduce"
                    variant="light"
                    onClick={() => {
                      if (problemCount > MIN_PROBLEM_COUNT) {
                        setProblemCount(
                          Math.max(problemCount - 1, MIN_PROBLEM_COUNT)
                        );
                      }
                    }}
                  >
                    <FontAwesomeIcon icon={faMinus} />
                  </Button>
                </OverlayTrigger>
                <Card className="rounded-0 border-0 bg-light">
                  <span className="p-1 problem-counter">{problemCount}</span>
                </Card>
                <OverlayTrigger
                  placement="top"
                  delay={{ show: 600, hide: 0 }}
                  overlay={<Tooltip>Increase problem count</Tooltip>}
                >
                  <Button
                    variant="light"
                    aria-label="increase"
                    // disabled={problemCount == MAX_PROBLEM_COUNT}
                    onClick={() => {
                      if (problemCount < MAX_PROBLEM_COUNT) {
                        setProblemCount(
                          Math.min(problemCount + 1, MAX_PROBLEM_COUNT)
                        );
                      }
                    }}
                  >
                    <FontAwesomeIcon icon={faPlus} />{" "}
                  </Button>
                </OverlayTrigger> */}
                  <OverlayTrigger
                    placement="top"
                    overlay={
                      <Tooltip>Load {problemCount} random problems</Tooltip>
                    }
                    delay={{ show: 600, hide: 0 }}
                  >
                    <Button variant="light" onClick={() => handleSheetClick()}>
                      <FontAwesomeIcon icon={faDice} />
                    </Button>
                  </OverlayTrigger>
                </ButtonGroup>
              </Card.Header>
              <PanelGroup
                autoSaveId="oatutor-prompt-panel"
                direction="vertical"
              >
                <Panel defaultSize={70} className="problems-card-panel">
                  <PanelGroup
                    autoSaveId="oatutor-library-panel"
                    direction="horizontal"
                  >
                    <Panel>
                      <Card.Body className="problems-card-body">
                        {sheetInfo.fileName.error ? (
                          <Card.Body className="d-flex flex-column align-items-center justify-content-center loading-div">
                            <h1 className="display-1 text-muted">
                              <FontAwesomeIcon icon={faLink} />
                            </h1>
                            <p className="lead text-center p-2">
                              Invalid OATutor Google Sheet link.
                            </p>
                          </Card.Body>
                        ) : sheetInfo.fileName == "" ? (
                          <Card.Body className="d-flex flex-column align-items-center justify-content-center loading-div">
                            <h1 className="display-1 text-muted">
                              <FontAwesomeIcon icon={faLink} />
                            </h1>
                            <p className="lead text-center p-2">
                              Enter an OATutor Google Sheet link.
                            </p>
                          </Card.Body>
                        ) : sheetInfo?.selectedSheetTitleIndexes?.length <=
                          0 ? (
                          <>
                            {" "}
                            <Card.Body className="d-flex flex-column align-items-center justify-content-center loading-div">
                              <h1 className="display-1 text-muted">
                                <FontAwesomeIcon icon={faBook} />
                              </h1>
                              <p className="lead text-center p-2">
                                Select a lesson.
                              </p>
                            </Card.Body>
                          </>
                        ) : (
                          <>
                            <SheetContent
                              sheetInfo={sheetInfo}
                              showHumanHints={showHumanHints}
                            />
                          </>
                        )}
                      </Card.Body>
                    </Panel>
                    <PanelResizeHandle className="d-flex flex-column align-items-center justify-content-center border-start border-end">
                      <FontAwesomeIcon
                        icon={faGripLinesVertical}
                        size="xs"
                        className="p-2"
                      />
                    </PanelResizeHandle>
                    <Panel defaultSize={30}>
                      {sheetInfoLoaded() ? (
                        <Tab.Container
                          id="prompt-library-tabs"
                          activeKey={libraryTabKey}
                          onSelect={(k) => setLibraryTabKey(k)}
                        >
                          <Card.Header className="border-0 pb-0 d-flex align-items-stretch justify-content-between">
                            <strong className="text-truncate">
                              Shared Prompt Library
                            </strong>
                            <div>
                              <ButtonGroup size="sm" className="p-0">
                                <OverlayTrigger
                                  position="top"
                                  overlay={<Tooltip>Sort by time</Tooltip>}
                                >
                                  <Button
                                    variant={
                                      sortOption === "time"
                                        ? "primary"
                                        : "light"
                                    }
                                    onClick={() => setSortOption("time")}
                                  >
                                    <FontAwesomeIcon icon={faClock} />
                                  </Button>
                                </OverlayTrigger>
                                <OverlayTrigger
                                  position="top"
                                  overlay={<Tooltip>Sort by upvotes</Tooltip>}
                                >
                                  <Button
                                    variant={
                                      sortOption === "likes"
                                        ? "primary"
                                        : "light"
                                    }
                                    onClick={() => setSortOption("likes")}
                                  >
                                    <FontAwesomeIcon icon={faThumbsUp} />
                                  </Button>
                                </OverlayTrigger>
                                <OverlayTrigger
                                  position="top"
                                  overlay={
                                    <Tooltip>Get latest prompts</Tooltip>
                                  }
                                >
                                  <Button
                                    variant={"light"}
                                    onClick={() => {
                                      refreshLibrary();
                                    }}
                                  >
                                    <FontAwesomeIcon icon={faRefresh} />
                                  </Button>
                                </OverlayTrigger>
                              </ButtonGroup>
                            </div>
                          </Card.Header>
                          <Card.Header className="tab-header border-0 pt-1">
                            <Nav className="flex-row " variant="tabs">
                              <Nav.Item>
                                <Nav.Link eventKey="textbook">
                                  Textbook-Level
                                </Nav.Link>
                              </Nav.Item>
                              <Nav.Item>
                                <Nav.Link eventKey="lesson">
                                  Lesson-Level
                                </Nav.Link>
                              </Nav.Item>
                            </Nav>
                          </Card.Header>
                          <Card className="border-0 shared-prompt-list">
                            <Card.Body className="p-0">
                              <Tab.Content>
                                <Tab.Pane eventKey="textbook">
                                  <ListGroup>
                                    {sortedTextbookLibraryPromptList.map(
                                      (entry, index) => {
                                        return (
                                          <>
                                            <ListGroupItem className="p-2">
                                              <div className="d-flex list-item">
                                                <div className="d-flex flex-column content-panel justify-content-between">
                                                  <div className="p-2 text-truncate">
                                                    {getEntryPreview(entry)}
                                                  </div>
                                                  <div className="d-flex align-items center p-1">
                                                    <Avatar
                                                      sx={{
                                                        width: 20,
                                                        height: 20,
                                                      }}
                                                      alt={generateNameFromSeed(
                                                        entry.userId
                                                      )}
                                                      src={generateAvatarFromSeed(
                                                        entry.userId
                                                      )}
                                                    />
                                                    <small className="ms-1 text-muted fw-light fst-italic">
                                                      {generateNameFromSeed(
                                                        entry.userId
                                                      )}{" "}
                                                      {getFormattedTimestamp(
                                                        entry.dateCreated
                                                      )}
                                                    </small>
                                                  </div>
                                                </div>
                                                <div className="d-flex flex-column justify-content-between side-panel">
                                                  <OverlayTrigger
                                                    direction="top"
                                                    overlay={
                                                      <Tooltip>Upvote</Tooltip>
                                                    }
                                                  >
                                                    <Button
                                                      variant="light"
                                                      size="sm"
                                                      onClick={() => {
                                                        upvoteMessageEntry(
                                                          index
                                                        );
                                                      }}
                                                    >
                                                      <div className="text-nowrap">
                                                        <FontAwesomeIcon
                                                          icon={faThumbsUp}
                                                        />{" "}
                                                        {entry.likes}
                                                      </div>
                                                    </Button>
                                                  </OverlayTrigger>
                                                  <ButtonGroup
                                                    size="sm"
                                                    vertical
                                                  >
                                                    {entry.userId === userId ? (
                                                      <OverlayTrigger
                                                        direction="top"
                                                        overlay={
                                                          <Tooltip>
                                                            Delete
                                                          </Tooltip>
                                                        }
                                                      >
                                                        <Button
                                                          variant="light"
                                                          size="sm"
                                                          onClick={() => {
                                                            archivePrompt(
                                                              entry
                                                            );
                                                          }}
                                                        >
                                                          <FontAwesomeIcon
                                                            icon={faTrash}
                                                          />{" "}
                                                        </Button>
                                                      </OverlayTrigger>
                                                    ) : (
                                                      ""
                                                    )}

                                                    <OverlayTrigger
                                                      direction="top"
                                                      overlay={
                                                        <Tooltip>
                                                          Clone into scratchpad
                                                        </Tooltip>
                                                      }
                                                    >
                                                      <Button
                                                        variant="light"
                                                        size="sm"
                                                        onClick={() => {
                                                          importMessageEntryFromLibrary(
                                                            entry
                                                          );
                                                          console.log(entry);
                                                        }}
                                                      >
                                                        <FontAwesomeIcon
                                                          icon={faClone}
                                                        />
                                                      </Button>
                                                    </OverlayTrigger>
                                                  </ButtonGroup>
                                                </div>
                                              </div>
                                            </ListGroupItem>
                                          </>
                                        );
                                      }
                                    )}
                                  </ListGroup>
                                </Tab.Pane>
                                <Tab.Pane eventKey="lesson">
                                  {sheetInfo.selectedSheetTitleIndexes &&
                                  sheetInfo.selectedSheetTitleIndexes.length ==
                                    1 ? (
                                    <>
                                      <ListGroup>
                                        {sortedLessonLibraryPromptList.map(
                                          (entry, index) => {
                                            return (
                                              <>
                                                <ListGroupItem className="p-2">
                                                  <div className="text-truncate p-2">
                                                    {getEntryPreview(entry)}
                                                  </div>

                                                  <div className="d-flex justify-content-between align-items-end">
                                                    <div className="d-flex align-items center p-1">
                                                      <Avatar
                                                        sx={{
                                                          width: 20,
                                                          height: 20,
                                                        }}
                                                        alt={generateNameFromSeed(
                                                          entry.userId
                                                        )}
                                                        src={generateAvatarFromSeed(
                                                          entry.userId
                                                        )}
                                                      />
                                                      <small className="ms-1 text-muted">
                                                        {generateNameFromSeed(
                                                          userId
                                                        )}{" "}
                                                        {getFormattedTimestamp(
                                                          entry.dateCreated
                                                        )}
                                                      </small>
                                                    </div>
                                                    <ButtonGroup size="sm">
                                                      {entry.userId ===
                                                      userId ? (
                                                        <OverlayTrigger
                                                          direction="top"
                                                          overlay={
                                                            <Tooltip>
                                                              Delete
                                                            </Tooltip>
                                                          }
                                                        >
                                                          <Button
                                                            variant="light"
                                                            size="sm"
                                                            onClick={() => {
                                                              archivePrompt(
                                                                entry
                                                              );
                                                            }}
                                                          >
                                                            <FontAwesomeIcon
                                                              icon={faTrash}
                                                            />{" "}
                                                          </Button>
                                                        </OverlayTrigger>
                                                      ) : (
                                                        ""
                                                      )}
                                                      <OverlayTrigger
                                                        direction="top"
                                                        overlay={
                                                          <Tooltip>
                                                            Upvote
                                                          </Tooltip>
                                                        }
                                                      >
                                                        <Button
                                                          variant="light"
                                                          size="sm"
                                                          onClick={() => {
                                                            upvoteMessageEntry(
                                                              index
                                                            );
                                                          }}
                                                        >
                                                          <FontAwesomeIcon
                                                            icon={faThumbsUp}
                                                          />{" "}
                                                          {entry.likes}
                                                        </Button>
                                                      </OverlayTrigger>

                                                      <OverlayTrigger
                                                        direction="top"
                                                        overlay={
                                                          <Tooltip>
                                                            Clone into
                                                            scratchpad
                                                          </Tooltip>
                                                        }
                                                      >
                                                        <Button
                                                          variant="light"
                                                          size="sm"
                                                          onClick={() => {
                                                            importMessageEntryFromLibrary(
                                                              entry
                                                            );
                                                            console.log(entry);
                                                          }}
                                                        >
                                                          <FontAwesomeIcon
                                                            icon={faClone}
                                                          />
                                                        </Button>
                                                      </OverlayTrigger>
                                                    </ButtonGroup>
                                                  </div>
                                                </ListGroupItem>
                                              </>
                                            );
                                          }
                                        )}
                                      </ListGroup>
                                    </>
                                  ) : (
                                    <>
                                      <Alert
                                        key={"lesson-warning"}
                                        variant={"warning"}
                                      >
                                        You need to select a single lesson
                                        before you can view or commit
                                        lesson-level prompts.
                                      </Alert>
                                    </>
                                  )}
                                </Tab.Pane>
                              </Tab.Content>
                            </Card.Body>
                          </Card>
                        </Tab.Container>
                      ) : (
                        <></>
                      )}
                    </Panel>
                  </PanelGroup>
                </Panel>
                <PanelResizeHandle>
                  <p className="border-top text-center m-0 p-0">
                    <FontAwesomeIcon icon={faGripLines} size="xs" />
                  </p>
                </PanelResizeHandle>

                <Panel defaultSize={10}>
                  {sheetInfoLoaded() ? (
                    <>
                      <PromptEditor
                        libraryTabKey={libraryTabKey}
                        checkedTitleIndexes={
                          sheetInfo.selectedSheetTitleIndexes
                        }
                        selectedSheetData={sheetInfo.selectedSheetData}
                        columnIndexMap={sheetInfo.columnIndexMap}
                        setSheetInfo={setSheetInfo}
                        sheetInfo={sheetInfo}
                        lessonContentAttributes={lessonContentAttributes}
                        resetHintViwerLocalStorage={resetLocalStorage}
                        showSettings={showSettings}
                        setShowSettings={setShowSettings}
                        showSystemMessages={showSystemMessages}
                        addMessageEntry={addMessageEntry}
                        addMessageEntryAtIndex={addMessageEntryAtIndex}
                        messageHistory={messageHistory}
                        deleteMessageEntry={deleteMessageEntry}
                        updateMessageEntry={updateMessageEntry}
                        updateUserMessagesAtIndex={updateUserMessagesAtIndex}
                        updateSheetInfoAtIndex={updateSheetInfoAtIndex}
                        activeMessageIndex={activeMessageIndex}
                        setActiveMessageIndex={setActiveMessageIndex}
                        commitMessageEntryToLibrary={
                          commitMessageEntryToLibrary
                        }
                        updateLessonsTestedOnPrompt={
                          updateLessonsTestedOnPrompt
                        }
                        commitMessageEntryFromScratchpad={
                          commitMessageEntryFromScratchpad
                        }
                        updateUserMessageContentAtIndexAndId={
                          updateUserMessageContentAtIndexAndId
                        }
                        updateShetInfoAtIndex={updateShetInfoAtIndex}
                        defaultSytemMessages={defaultSytemMessages}
                        blankUserMessages={blankUserMessages}
                        notify={notify}
                        model={model}
                        sheetId={sheetId}
                        createMessageEntry={createMessageEntry}
                      />
                    </>
                  ) : (
                    <></>
                  )}
                </Panel>
              </PanelGroup>
            </Card>
          </Panel>
        </PanelGroup>
      </Row>
      <Footer />
    </Container>
  );
}