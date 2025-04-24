import React from "react";
import {
  Row,
  Col,
  Card,
  Badge,
  ListGroup,
  Container,
  Spinner,
} from "react-bootstrap";
import "katex/dist/katex.min.css";
import { default as ReactLatex } from "react-latex-next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBook,
  faCog,
  faDice,
  faPerson,
  faRobot,
  faWandSparkles,
  faWarning,
} from "@fortawesome/free-solid-svg-icons";
import { convertToLatex, normalizeString } from "../../utilities/utils"; // Import the normalization utility

const Delimiters = [
  { left: "$$", right: "$$", display: false },
  { left: "$", right: "$", display: false },
];
function Latex({ children }) {
  return <ReactLatex delimiters={Delimiters}>{children}</ReactLatex>;
}

export default function SheetContent({ sheetInfo, showHumanHints }) {
  return (
    <Container className="problems-container">
      {sheetInfo.loading ? (
        <div className="d-flex justify-content-center align-items-center loading-div">
          <Spinner animation="border" role="status" />
        </div>
      ) : sheetInfo.error ? (
        <Card.Body className="d-flex flex-column align-items-center justify-content-center loading-div">
          <h1 className="display-1 text-muted">
            <FontAwesomeIcon icon={faWarning} />
          </h1>
          <h4>Unable to load lesson problems.</h4>
          <div className="text-muted">Error: {sheetInfo.error.message}</div>

          <p className="lead p-2">
            <ul>
              <li>
                <strong>Check the Spreadsheet Format:</strong> Ensure that your
                sheet is using the correct OATutor format, with the standard
                column headers and rows.
              </li>
              <li>
                <strong>Click on a Different Lesson:</strong> If the format of a
                particular sheet is incorrect, try loading problems from a
                different sheet by clicking on lesson on the left-hand panel.
              </li>
              <li>
                <strong>Reload Problems:</strong> If the format looks good, try
                reloading the problems by clicking on{" "}
                <FontAwesomeIcon icon={faDice} /> button in the
                top-right-hand-corner.
              </li>
              <li>
                <strong>Reset Local Storage (Use with Caution):</strong>
                If the issue persists, you can reset the local storage by going
                to <strong>Settings</strong> <FontAwesomeIcon icon={faCog} />.
                <span className="text-danger">
                  {" "}
                  <strong>Warning:</strong> Only reset local storage as a last
                  resort, after trying the above steps. Resetting will erase
                  data stored locally on your device.
                </span>
              </li>
            </ul>
          </p>
        </Card.Body>
      ) : sheetInfo.selectedSheetData ? (
        <Row xs={2} md={1} className="g-4">
          {sheetInfo.problemNames
            .filter((problemName) => {
              const problemNameIndex = sheetInfo.columnIndexMap.problemName;
              return sheetInfo.selectedSheetData.some(
                (row) => row[problemNameIndex] === problemName
              );
            })
            .map((problemName, index) => {
              const problemNameIndex = sheetInfo.columnIndexMap.problemName;
              const rowTypeIndex = sheetInfo.columnIndexMap.rowType;
              const oerSrcIndex = sheetInfo.columnIndexMap.oerSrc;

              const rowsForProblemName = sheetInfo.selectedSheetData.filter(
                (row) => row[problemNameIndex] === problemName
              );
              const problemRow = rowsForProblemName.find(
                (row) => normalizeString(row[rowTypeIndex]) === "problem" // Using normalizeString for comparison
              );

              const titleIndex = sheetInfo.columnIndexMap.title;
              const title = problemRow ? problemRow[titleIndex] : "Untitled";

              return (
                <Col key={index}>
                  <Card className="problem-card">
                    <Card.Header className="problem-header d-flex align-items-center justify-content-between">
                      <strong>{title}</strong>
                      <Badge bg="dark" text="light">
                        {problemName}
                      </Badge>
                    </Card.Header>
                    <Card.Body className="problem-body p-0">
                      {problemRow &&
                        problemRow[sheetInfo.columnIndexMap.bodyText] && (
                          <div className="p-3 bg-light border-bottom">
                            <Latex>
                              {
                                problemRow[
                                sheetInfo.columnIndexMap.bodyTextRendered
                                ]
                              }
                            </Latex>
                          </div>
                        )}

                      {problemRow &&
                        problemRow[sheetInfo.columnIndexMap.images] && (
                          <div className="p-3 border-bottom text-center">
                            {problemRow[sheetInfo.columnIndexMap.images]
                              .split(" ")
                              .map((src) => {
                                return (
                                  <img
                                    key={`problem_image_${index}`}
                                    src={src}
                                    style={{ height: "100%", width: "100%" }}
                                  />
                                );
                              })}
                          </div>
                        )}

                      <ListGroup variant="flush" className="problem-details">
                        {rowsForProblemName.map((row, rowIndex) => {
                          const isProblemType = ["problem"].includes(
                            normalizeString(row[rowTypeIndex])
                          );
                          const isOpenAIHint = row[oerSrcIndex] === "openai";
                          const isHumanHintVisible =
                            showHumanHints || isOpenAIHint;
                          const isHintOrScaffold = [
                            "hint",
                            "scaffold",
                          ].includes(normalizeString(row[rowTypeIndex]));

                          const shouldRenderRow =
                            !isProblemType &&
                            (isHumanHintVisible || !isHintOrScaffold);

                          return (
                            shouldRenderRow && (
                              <ListGroup.Item
                                key={rowIndex}
                                variant={isOpenAIHint ? "success" : ""}
                                onClick={() => {
                                  console.log("I was clicked");
                                  console.log(problemName);
                                }}
                              >
                                {/* Display for different types of rows */}

                                {displayRow(row, sheetInfo, isOpenAIHint)}
                              </ListGroup.Item>
                            )
                          );
                        })}
                      </ListGroup>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
        </Row>
      ) : (
        <Card.Body className="d-flex flex-column align-items-center justify-content-center loading-div">
          <h1 className="display-1 text-muted">
            <FontAwesomeIcon icon={faBook} />
          </h1>
          <p className="lead text-center p-2">
            Select a lesson to get started.
          </p>
        </Card.Body>
      )}
    </Container>
  );
}

function displayRow(row, sheetInfo, isOpenAIHint) {
  // Here we can handle how to display different types of rows based on the rowType
  const rowType = normalizeString(row[sheetInfo.columnIndexMap.rowType]); // Normalize once
  const title = row[sheetInfo.columnIndexMap.title];
  const bodyText = row[sheetInfo.columnIndexMap.bodyText];
  const answer = row[sheetInfo.columnIndexMap.answer];
  const answerType = row[sheetInfo.columnIndexMap.answerType];
  /**
   * @type {string[]} mcChoices
   */
  const mcChoices = row[sheetInfo.columnIndexMap.mcChoices]?.split("|");
  const hintID = row[sheetInfo.columnIndexMap.hintID]; // Normalize once
  const dependency = row[sheetInfo.columnIndexMap.dependency];

  const titleRendered =
    row[sheetInfo.columnIndexMap.titleRendered] || convertToLatex(title);
  const bodyTextRendered =
    row[sheetInfo.columnIndexMap.bodyTextRendered] || convertToLatex(bodyText);
  const answerRendered =
    answerType === "mc"
      ? row[sheetInfo.columnIndexMap.answerRenderedForMC]
      : row[sheetInfo.columnIndexMap.answerRendered] || convertToLatex(answer);
  const answerTypeRendered =
    row[sheetInfo.columnIndexMap.answerTypeRendered] ||
    convertToLatex(answerType);
  const mcChoicesRendered =
    row[sheetInfo.columnIndexMap.mcChoicesRendered]?.split("<separator_eba4b31e>") ||
    mcChoices.map((formula) => convertToLatex(formula));

  const images = (() => {
    /**
     * @type {string}
     */
    const imageStr = row[sheetInfo.columnIndexMap.images];
    if (!imageStr) {
      return [];
    }
    console.log(`Images: ${imageStr}`);
    return imageStr.split(' ');
  })();

  switch (rowType) {
    case "step":
      return (
        <>
          {images.length > 0 ? (
            <div className="p-3 text-center">
              {images.map((src, index) => {
                return <img key={`step_image_${index}`} src={src} />;
              })}
            </div>
          ) : (
            <></>
          )}

          <div className="d-flex align-items-center justify-content-between">
            <Latex>{titleRendered}</Latex>
            <Badge bg="primary">{rowType}</Badge>
          </div>
          <div className="py-3 d-flex align-items-center justify-content-between">
            <div>
              Answer:
              <span className="p-2 m-1 border rounded-2">
                <Latex>{answerRendered}</Latex>
              </span>
            </div>
            <Badge bg="info">{answerType}</Badge>
          </div>
          {answerType.trim().toLowerCase() === "mc" && (
            <>
              Options:
              {mcChoicesRendered.map((choice, index) => (
                <span key={index} className="p-1 m-1 border rounded-2">
                  <Latex>{choice}</Latex>
                </span>
              ))}
            </>
          )}
        </>
      );
    case "hint":
      return (
        <>
          <div className="d-flex align-items-center justify-content-between">
            <span className="d-flex align-items-center">
              <strong>HINT: {<Latex>{title}</Latex>}</strong>
              <Badge bg="light" text="dark" className="ms-2">
                {isOpenAIHint ? "AI Generated" : "Human Generated"}
              </Badge>
            </span>
            <Badge bg="secondary">
              {dependency
                ? `id: ${hintID}, dependency: ${dependency}`
                : `id: ${hintID}`}
            </Badge>
          </div>

          <div>
            <p>
              <Latex>{bodyTextRendered}</Latex>
            </p>
          </div>
        </>
      );
    case "scaffold":
      return (
        <>
          <div className="py-3 d-flex align-items-center justify-content-between">
            <span className="d-flex align-items-center">
              <strong>SCAFFOLD: {<Latex>{titleRendered}</Latex>}</strong>
              <Badge bg="light" text="dark" className="ms-2">
                {isOpenAIHint ? "AI Generated" : "Human Generated"}
              </Badge>
            </span>

            {/* <Badge>{rowType}</Badge> */}
            <Badge bg="secondary">
              {dependency
                ? `id: ${hintID}, dependency: ${dependency}`
                : `id: ${hintID}`}{" "}
            </Badge>
          </div>
          {images.length > 0 ? (
            <div className="p-3 text-center">
              {images.map((src, index) => {
                return <img key={`scaffold_image_${index}`} src={src} />;
              })}
            </div>
          ) : (
            <></>
          )}
          <Latex>{bodyTextRendered}</Latex>
          <div className="d-flex align-items-center justify-content-between">
            <div>
              Answer:
              <span className="p-1 m-1 border rounded-2 bg-light m-2">
                <Latex>{answerRendered}</Latex>
              </span>
            </div>
            <Badge bg="info">{answerTypeRendered}</Badge>
          </div>
          <div className="pt-2">
            {answerType.trim().toLowerCase() === "mc" && (
              <>
                Options:
                {mcChoicesRendered.map((choice, index) => (
                  <span
                    key={index}
                    className="p-1 m-1 border rounded-2 bg-light"
                  >
                    <Latex>{choice}</Latex>
                  </span>
                ))}
              </>
            )}
          </div>
        </>
      );
    default:
      return (
        <>
          ???
          <div className="py-3 d-flex align-items-center justify-content-between">
            <strong>{title}</strong>
            <Badge>{rowType}</Badge>
          </div>
        </>
      );
  }
}
