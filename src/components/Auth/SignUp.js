import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Col from "react-bootstrap/Col";
import Alert from "react-bootstrap/Alert";
import appStyles from "../../App.module.css";
import LocationOption from "../LocationOption";
import { UserContext } from "../../context/UserContext";
import { useAppContextValue } from "../../context/AppContext";
import { actionTypes } from "../../context/Reducer";

const SignUp = () => {
  const navigate = useNavigate();
  const [
    { companyUIDInputDisabled, companyUID },
    dispatch,
  ] = useAppContextValue();
  let companyUIDFromContext = companyUID;
  const [locationData, setLocationData] = useState([]);
  const [signUpFormErrors, setSignUpFormErrors] = useState({
    error: "",
    companyUIDError: "",
    locationUIDError: "",
    nameError: "",
    emailAddressError: "",
    phoneNumberError: "",
    passwordError: "",
    confirmPasswordError: "",
  });

  const [signUpFormData, setSignUpFormData] = useState({
    companyUID: companyUIDFromContext,
    locationUID: "",
    name: "",
    emailAddress: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });

  const getLocations = async (companyUID) => {
    setSignUpFormErrors({
      error: "",
      companyUIDError: "",
      locationUIDError: "",
      nameError: "",
      emailAddressError: "",
      phoneNumberError: "",
      passwordError: "",
      confirmPasswordError: "",
    });
    fetch(
      process.env.REACT_APP_API_ENDPOINT +
        "/api/getLocationsByCompany/" +
        companyUID
    ).then(async (response) => {
      let data = await response.json();
      if (response.ok) {
        setLocationData(data);
        setSignUpFormData({
          ...signUpFormData,
          companyUID: companyUID,
          locationUID: data[0].locationUID,
        });
      } else {
        setSignUpFormErrors({
          ...signUpFormErrors,
          error: data.error,
        });
        setLocationData([]);
      }
    });
  };

  useEffect(() => {
    if (companyUIDInputDisabled === true) {
      getLocations(signUpFormData.companyUID);
    }
  }, []);

  const handleSignUpFormChange = (event) => {
    setSignUpFormData({
      ...signUpFormData,
      [event.target.name]: event.target.value,
    });

    if (event.target.name === "companyUID" && event.target.value.length > 4) {
      dispatch({
        type: actionTypes.SET_COMPANYUID,
        companyUID: signUpFormData.companyUID,
      });
      getLocations(event.target.value);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    fetch(process.env.REACT_APP_API_ENDPOINT + "/api/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(signUpFormData),
    })
      .then(async (response) => {
        let data = await response.json();
        if (response.ok) {
          console.log(data); //has token and success
          navigate("/");
        } else {
          setSignUpFormErrors({
            ...signUpFormErrors,
            error: data.error,
          });
        }
      })
      .catch((error) => {
        console.error(error);
      });
    setSignUpFormData({
      companyUID: "",
      locationUID: "",
      name: "",
      emailAddress: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
    });
  };
  return (
    <>
      <Container className="mb-4">
        <h1 className="display-3 text-center mt-4">Sign Up</h1>
        <Row className="justify-content-center">
          <Col md={6}>
            <Form onSubmit={handleSubmit}>
              <p className="text-danger">{signUpFormErrors.error}</p>
              <Form.Group className="mb-3" controlId="companyUID">
                <Form.Label className={appStyles.required}>
                  Company Id
                </Form.Label>
                <Form.Control
                  value={signUpFormData.companyUID}
                  onChange={handleSignUpFormChange}
                  type="text"
                  name="companyUID"
                  placeholder="Enter Company Id"
                  disabled={companyUIDInputDisabled}
                />
                <p className="text-danger">
                  {signUpFormErrors.companyUIDError}
                </p>
              </Form.Group>

              <Form.Label className={appStyles.required}>
                Location Name
              </Form.Label>
              <Form.Select
                className="mb-3"
                aria-label="Location Name"
                name="locationUID"
                onChange={handleSignUpFormChange}
              >
                {locationData.map((location) => (
                  <LocationOption
                    key={location.locationId}
                    locationUID={location.locationUID}
                    locationName={location.locationName}
                  />
                ))}
              </Form.Select>
              <p className="text-danger">{signUpFormErrors.locationUIDError}</p>

              <Form.Group className="mb-3" controlId="name">
                <Form.Label className={appStyles.required}>Name</Form.Label>
                <Form.Control
                  value={signUpFormData.name}
                  onChange={handleSignUpFormChange}
                  type="text"
                  name="name"
                  placeholder="First & Last Name"
                />
                <p className="text-danger">
                  {signUpFormErrors.companyUIDError}
                </p>
              </Form.Group>

              <Form.Group className="mb-3" controlId="emailAddress">
                <Form.Label className={appStyles.required}>
                  Email Address
                </Form.Label>
                <Form.Control
                  value={signUpFormData.emailAddress}
                  onChange={handleSignUpFormChange}
                  type="email"
                  name="emailAddress"
                  placeholder="Enter email"
                />
                <p className="text-danger">
                  {signUpFormErrors.emailAddressError}
                </p>
              </Form.Group>

              <Form.Group className="mb-3" controlId="phoneNumber">
                <Form.Label className={appStyles.required}>
                  Phone Number
                </Form.Label>
                <Form.Control
                  value={signUpFormData.phoneNumber}
                  onChange={handleSignUpFormChange}
                  type="number"
                  name="phoneNumber"
                  placeholder="Phone Number"
                />
                <p className="text-danger">
                  {signUpFormErrors.phoneNumberError}
                </p>
              </Form.Group>

              <Form.Group className="mb-3" controlId="password">
                <Form.Label className={appStyles.required}>Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={signUpFormData.password}
                  onChange={handleSignUpFormChange}
                />
                <p className="text-danger">{signUpFormErrors.passwordError}</p>
              </Form.Group>

              <Form.Group className="mb-3" controlId="confirmPassword">
                <Form.Label className={appStyles.required}>
                  Confirm Password
                </Form.Label>
                <Form.Control
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={signUpFormData.confirmPassword}
                  onChange={handleSignUpFormChange}
                />
                <p className="text-danger">
                  {signUpFormErrors.confirmPasswordError}
                </p>
              </Form.Group>

              <Form.Group className="text-center mb-3">
                <Alert.Link className={appStyles.iForgotLink} href="/signin">
                  Already have an account ? Sign In
                </Alert.Link>
              </Form.Group>

              <div className="d-grid gap-2 mb-4">
                <Button variant="dark" size="lg" type="submit" className="mb-4">
                  Sign Up
                </Button>
              </div>
            </Form>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default SignUp;
