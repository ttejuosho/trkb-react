import React from "react";
const LocationOption = ({ locationUID, locationName }) => {
  return <option value={locationUID}>{locationName}</option>;
};
export default LocationOption;
