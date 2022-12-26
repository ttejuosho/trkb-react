import React, { useState, useContext } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Col from "react-bootstrap/Col";
import Alert from "react-bootstrap/Alert";
import appStyles from "../../App.module.css";
import { UserContext } from "../../context/UserContext";

const SignIn = () => {
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { onLogin } = useContext(UserContext);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    await onLogin(emailAddress, password);
  };

  const handleLoginFormChange = (event) => {
    if (event.target.id === "emailAddress") {
      setEmailAddress(event.target.value);
    }
    if (event.target.id === "password") {
      setPassword(event.target.value);
    }
  };

  return (
    <>
      <Container>
        <h1 className="display-3 text-center mt-4">Sign In</h1>
        <Row className="justify-content-center">
          <Col md={6}>
            <Form onSubmit={handleSubmit}>
              <p className="text-danger">{error}</p>
              <Form.Group className="mb-3" controlId="emailAddress">
                <Form.Label className={appStyles.required}>
                  Email address
                </Form.Label>
                <Form.Control
                  value={emailAddress}
                  onChange={handleLoginFormChange}
                  type="email"
                  placeholder="Enter email"
                />
                <Form.Text className="text-muted">
                  We'll never share your email with anyone else.
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3" controlId="password">
                <Form.Label className={appStyles.required}>Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={handleLoginFormChange}
                />
              </Form.Group>
              <Form.Group className="text-center mb-3">
                <Alert.Link className={appStyles.iForgotLink} href="/iforgot">
                  iForgot
                </Alert.Link>
              </Form.Group>
              <div className="d-grid gap-2">
                <Button variant="dark" size="lg" type="submit">
                  Submit
                </Button>
              </div>
            </Form>
          </Col>
        </Row>
      </Container>
    </>
  );
};
export default SignIn;
