import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Col from "react-bootstrap/Col";
import Alert from "react-bootstrap/Alert";
import appStyles from "../../App.module.css";
import { actionTypes } from "../../context/Reducer";
import { useAppContextValue } from "../../context/AppContext";

const Register = () => {
  const navigate = useNavigate();
  const [{ companyUID }, dispatch] = useAppContextValue();

  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");

  const handleCompanyNameInputChange = (event) => {
    setCompanyName(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");
    fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyName: companyName }),
    })
      .then(async (response) => {
        let res = await response.json();
        console.log(res);
        if (res.error) {
          setError(res.error);
        } else {
          setCompanyName("");
          dispatch({
            type: actionTypes.SET_COMPANYUID,
            companyUID: res.companyUID,
          });
          navigate("/location");
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <>
      <Container>
        <h1 className="display-3 text-center mt-4">Register</h1>
        <Row className="justify-content-center">
          <Col md={6}>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="companyName">
                <Form.Label className={appStyles.required}>
                  Company Name
                </Form.Label>
                <Form.Control
                  type="text"
                  name="companyName"
                  value={companyName}
                  placeholder="Enter Company Name"
                  onChange={handleCompanyNameInputChange}
                />
                <Form.Text className="text-muted">
                  Please enter your company name to register
                </Form.Text>
                <p className="text-danger">{error}</p>
              </Form.Group>

              <Form.Group className="text-center mb-3">
                <Alert.Link className={appStyles.iForgotLink} href="/signin">
                  Already have an account ? Sign In
                </Alert.Link>
              </Form.Group>
              <div className="d-grid gap-2">
                <Button variant="dark" size="lg" type="submit">
                  Register
                </Button>
              </div>
            </Form>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Register;
