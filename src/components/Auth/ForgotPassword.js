import React, { useState } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Col from "react-bootstrap/Col";
import Alert from "react-bootstrap/Alert";
import appStyles from "../../App.module.css";

const ForgotPassword = () => {
  const [emailAddress, setEmailAddress] = useState("");
  const [response, setResponse] = useState("");

  const handleEmailAddressChange = (event) => {
    setEmailAddress(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setResponse("");
    console.log(emailAddress);
    fetch(process.env.REACT_APP_API_ENDPOINT + "/api/iforgot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ emailAddress: emailAddress }),
    })
      .then(async (response) => {
        let data = await response.json();
        console.log(data);
        if (response.ok) {
          setResponse(data.response);
        } else {
          setResponse(data.emailAddressError);
        }
        setEmailAddress("");
      })
      .catch((error) => {
        console.error(error);
      });
  };
  return (
    <>
      <Container>
        <h1 className="display-3 text-center mt-4">Forgot Password</h1>
        <Row className="justify-content-center">
          <Col md={6}>
            <Form onSubmit={handleSubmit}>
              <p className="text-danger">{response}</p>
              <Form.Group className="mb-3" controlId="emailAddress">
                <Form.Label className={appStyles.required}>
                  Email address
                </Form.Label>
                <Form.Control
                  value={emailAddress}
                  name="emailAddress"
                  onChange={handleEmailAddressChange}
                  type="email"
                  placeholder="Enter email"
                />
                <Form.Text className="text-muted">
                  Please enter your login email address
                </Form.Text>
              </Form.Group>

              <Form.Group className="text-center mb-3">
                <Alert.Link className={appStyles.iForgotLink} href="/signin">
                  Already have an account ? Sign In
                </Alert.Link>
              </Form.Group>
              <div className="d-grid gap-2">
                <Button variant="dark" size="lg" type="submit">
                  Send Password Reset Email
                </Button>
              </div>
            </Form>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default ForgotPassword;
