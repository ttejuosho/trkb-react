import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Col from "react-bootstrap/Col";
import appStyles from "../../App.module.css";
import { useAppContextValue } from "../../context/AppContext";
import { actionTypes } from "../../context/Reducer";

const NewLocation = () => {
  const navigate = useNavigate();
  const [{ companyUID }, dispatch] = useAppContextValue();

  const [addNewLocation, setAddNewLocation] = useState(true);
  const [locationFormData, setLocationFormData] = useState({
    locationName: "",
    locationAddress: "",
    locationCity: "",
    locationState: "",
    addNewLocation: addNewLocation,
  });

  const [locationFormErrors, setLocationFormErrors] = useState({
    error: "",
    locationNameError: "",
    locationAddressError: "",
    locationCityError: "",
    locationStateError: "",
  });

  const handleLocationFormInputChange = (event) => {
    setLocationFormData({
      ...locationFormData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setAddNewLocation(true);
    setLocationFormErrors({
      error: "",
      locationNameError: "",
      locationAddressError: "",
      locationCityError: "",
      locationStateError: "",
    });

    fetch("/api/location/" + companyUID, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(locationFormData),
    })
      .then(async (response) => {
        setLocationFormErrors({
          error: "",
          locationNameError: "",
          locationAddressError: "",
          locationCityError: "",
          locationStateError: "",
        });
        let res = await response.json();
        console.log(addNewLocation);
        if (response.ok) {
          console.log(res);

          if (addNewLocation === false) {
            navigate("/signup");
            dispatch({
              type: actionTypes.SET_COMPANYUID_INPUT_DISABLED,
              companyUIDInputDisabled: true,
            });
          } else {
            setLocationFormData({
              ...locationFormData,
              error: "",
              locationName: "",
              locationAddress: "",
              locationCity: "",
              locationState: "",
              addNewLocation: true,
            });
          }
        } else {
          console.log(res);
          setLocationFormErrors({ ...res });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <>
      <Container>
        <h1 className="display-3 text-center mt-4">New Location</h1>
        <Row className="justify-content-center">
          <Col lg={6} md={6}>
            <Form onSubmit={handleSubmit}>
              <p className="text-danger">{locationFormErrors.error}</p>
              <Form.Group className="mb-3" controlId="locationName">
                <Form.Label className={appStyles.required}>
                  Location Name
                </Form.Label>
                <Form.Control
                  type="text"
                  value={locationFormData.locationName}
                  name="locationName"
                  placeholder="Enter Location Name"
                  onChange={handleLocationFormInputChange}
                />
                <Form.Text className="text-muted">
                  Please enter a location name to register
                </Form.Text>
                <p className="text-danger">
                  {locationFormErrors.locationNameError}
                </p>
              </Form.Group>

              <Form.Group className="mb-3" controlId="locationAddress">
                <Form.Label className={appStyles.required}>Address</Form.Label>
                <Form.Control
                  type="text"
                  name="locationAddress"
                  value={locationFormData.locationAddress}
                  placeholder="11, Oladogba Street"
                  onChange={handleLocationFormInputChange}
                />
                <p className="text-danger">
                  {locationFormErrors.locationAddressError}
                </p>
              </Form.Group>

              <Form.Group className="mb-3" controlId="locationCity">
                <Form.Label className={appStyles.required}>City</Form.Label>
                <Form.Control
                  type="text"
                  name="locationCity"
                  value={locationFormData.locationCity}
                  placeholder="Ketu"
                  onChange={handleLocationFormInputChange}
                />
                <p className="text-danger">
                  {locationFormErrors.locationCityError}
                </p>
              </Form.Group>

              <Form.Group className="mb-3" controlId="locationState">
                <Form.Label className={appStyles.required}>State</Form.Label>
                <Form.Control
                  type="text"
                  name="locationState"
                  value={locationFormData.locationState}
                  placeholder="Lagos"
                  onChange={handleLocationFormInputChange}
                />
                <p className="text-danger">
                  {locationFormErrors.locationStateError}
                </p>
              </Form.Group>

              <Button
                variant="success"
                className="mr-3"
                type="submit"
                onClick={() => {
                  setAddNewLocation(true);
                }}
              >
                Add New Location
              </Button>
              <Button
                className={appStyles.floatRight}
                variant="dark"
                type="submit"
                onClick={() => {
                  setAddNewLocation(false);
                }}
              >
                Done
              </Button>
            </Form>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default NewLocation;
