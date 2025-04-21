import React from "react";
import Navbar from "react-bootstrap/Navbar";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import { LinkContainer } from "react-router-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePen } from "@fortawesome/free-solid-svg-icons";
import Button from "react-bootstrap/Button";

export default function NavHeader() {
  return (
    <Navbar bg="light" expand="sm" sticky="top">
      <Container>
        <Navbar.Brand>
          <div className="d-flex align-items-center">
            <Button variant="light">
              <FontAwesomeIcon icon={faFilePen} /> PromptHive
            </Button>
          </div>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
      </Container>
    </Navbar>
  );
}
