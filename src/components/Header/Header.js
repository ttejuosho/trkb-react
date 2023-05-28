import React, { useContext } from "react";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { UserContext } from "../../context/UserContext";

const Header = () => {
  const { token, onLogout } = useContext(UserContext);
  return (
    <>
      <Navbar bg="dark" variant="dark">
        <Container>
          <Navbar.Brand href="/">ToroKobo</Navbar.Brand>
          <Nav className="justify-content-end">
            {!token ? (
              <>
                <Nav.Item>
                  <Nav.Link href="/signup">
                    <i className="fas fa-user-plus"></i> Sign Up
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link href="/register">
                    <i className="fas fa-user-plus"></i> Register
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link href="/signin">
                    <i className="fas fa-user"></i> Log In
                  </Nav.Link>
                </Nav.Item>
              </>
            ) : (
              <Nav.Item>
                <Nav.Link onClick={onLogout}>Log Out</Nav.Link>
              </Nav.Item>
            )}
          </Nav>
        </Container>
      </Navbar>
    </>
  );
};

export default Header;
