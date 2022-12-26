import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Col from "react-bootstrap/Col";
import appStyles from "../../App.module.css";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetPasswordFormErrors, setResetPasswordFormErrors] = useState({
    error: "",
    newPasswordError: "",
    confirmPasswordError: "",
  });

  let urlParam = useParams();

  const handleResetPasswordFormInputChange = (event) => {
    if (event.target.id === "newPassword") {
      setNewPassword(event.target.value);
    }
    if (event.target.id === "confirmPassword") {
      setConfirmPassword(event.target.value);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setResetPasswordFormErrors({
      error: "",
      newPasswordError: "",
      confirmPasswordError: "",
    });
    console.log(newPassword, confirmPassword);
    console.log(urlParam.resetPasswordToken);
    fetch(
      process.env.REACT_APP_API_ENDPOINT +
        "/api/resetPassword/" +
        urlParam.resetPasswordToken,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newPassword: newPassword,
          confirmPassword: confirmPassword,
        }),
      }
    ).then(async (response) => {
      let data = await response.json();
      if (response.ok) {
        console.log(data);
        navigate("/signin");
      } else {
        setResetPasswordFormErrors(data);
      }
    });
  };

  return (
    <>
      <Container>
        <h1 className="display-3 text-center mt-4">Reset Password</h1>
        <Row className="justify-content-center">
          <Col md={6}>
            <Form onSubmit={handleSubmit}>
              <p className="text-danger">{resetPasswordFormErrors.error}</p>
              <Form.Group className="mb-3" controlId="newPassword">
                <Form.Label className={appStyles.required}>
                  New Password
                </Form.Label>
                <Form.Control
                  value={newPassword}
                  name="newPassword"
                  onChange={handleResetPasswordFormInputChange}
                  type="password"
                  placeholder="Enter new password"
                />
                <p className="text-danger">
                  {resetPasswordFormErrors.newPasswordError}
                </p>
              </Form.Group>
              <Form.Group className="mb-3" controlId="confirmPassword">
                <Form.Label className={appStyles.required}>
                  Confirm Password
                </Form.Label>
                <Form.Control
                  value={confirmPassword}
                  name="confirmPassword"
                  onChange={handleResetPasswordFormInputChange}
                  type="password"
                  placeholder="Confirm new password"
                />
                <p className="text-danger">
                  {resetPasswordFormErrors.confirmPasswordError}
                </p>
                <Form.Text className="text-muted mt-2">
                  Your password cannot be one that you've previously used.
                </Form.Text>
              </Form.Group>

              <div className="d-grid gap-2">
                <Button variant="dark" size="lg" type="submit">
                  Reset Password
                </Button>
              </div>
            </Form>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default ResetPassword;
