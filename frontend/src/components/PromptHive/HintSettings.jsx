import { Alert, Slider } from "@mui/material";
import React from "react";
import { Button, Form, Modal } from "react-bootstrap";

export default function HintSettings({
  model,
  models,
  temperature,
  showSystemMessages,
  resetLocalStorage,
  setModel,
  setShowSystemMessages,
  setTemperature,
  showHumanHints,
  setShowHumanHints,
  ...props
}) {
  return (
    <Modal
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      animation={true}
      centered
      {...props}
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">Settings</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Model</Form.Label>
            <Form.Select
              aria-label="Model select"
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
              }}
            >
              {Object.keys(models).map((key) => (
                <option key={key} value={models[key]}>
                  {models[key]}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Temperature</Form.Label>
            <Slider
              size="small"
              value={temperature}
              aria-label="Small"
              valueLabelDisplay="auto"
              onChange={(e) => {
                setTemperature(e.target.value);
              }}
              min={0}
              max={2}
              step={0.1}
            />
            <small className="text-muted">
              Sampling temperature ranges between 0 and 2. Higher values like
              0.8 will make the output more random, while lower values like 0.2
              will make it more focused and deterministic.
            </small>
          </Form.Group>
          <Form.Switch
            id="system-message-switch"
            label="Enable advanced prompt-writing (system and multi-message view)"
            checked={showSystemMessages}
            onChange={() => {
              setShowSystemMessages((prevState) => !prevState);
            }}
          />

          <Form.Switch
            id="human-hints-switch"
            label="Show human-written hints and scaffolds from spreadsheet"
            checked={showHumanHints}
            onChange={() => {
              setShowHumanHints((prevState) => !prevState);
            }}
          />
          <Form.Group className="my-3">
            {/* <Form.Label>Reset Local Storage</Form.Label> */}

            <div>
              <Button
                size="sm"
                variant="danger"
                onClick={resetLocalStorage}
                className="me-2 mb-2"
              >
                Reset Local Storage
              </Button>{" "}
              <strong>
                Warning: Resetting will delete application data stored in your
                browser.
              </strong>
            </div>
          </Form.Group>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
