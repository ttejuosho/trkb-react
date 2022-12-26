import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";

const AppContextProvider = ({ children }) => {
  const [companyUID, setCompanyUID] = useState(null);
  const [appContext, setAppContext] = useContext(UserContext);
};

export default AppContextProvider;
