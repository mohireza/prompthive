import React from "react";
import { Navbar, Nav } from "react-bootstrap";
import packageJson from "../../../package.json";

const Footer = () => {
  return (
    <Navbar
      fixed="bottom"
      variant="light"
      bg="light"
      className="py-0 d-flex alignt-items-center justify-content-between"
    >
      <Nav>
        <Nav.Link target="_blank">
          <small>&copy; PromptHive </small>
        </Nav.Link>
        <Navbar.Text>
          <small>{new Date().getFullYear()}</small>
        </Navbar.Text>
      </Nav>
      <Nav className="ms-2">
        <Navbar.Text className="me-2">
          <small>{"Version " + packageJson.version + " (beta)"}</small>
        </Navbar.Text>
      </Nav>
    </Navbar>
  );
};

export default Footer;
