import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [companyUID, setCompanyUID] = useState(null);
  const [locationUID, setLocationUID] = useState(null);
  const [userId, setUserId] = useState(null);
  const [companyName, setCompanyName] = useState(null);
  const [userContext, setUserContext] = useContext(UserContext);

  const handleLogin = async (emailAddress, password) => {
    const token = await fetch(
      process.env.REACT_APP_API_ENDPOINT + "/api/signin",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailAddress: emailAddress,
          password: password,
        }),
      }
    )
      .then(async (response) => {
        if (!response.ok) {
          return { error: "Error Occurred, Please try again" };
        } else {
          const data = await response.json();
          console.log(data);
          setUserContext((oldValues) => {
            return {
              ...oldValues,
              token: data.token,
              companyUID: data.companyUID,
              locationUID: data.locationUID,
              companyName: data.companyName,
              userId: data.userId,
            };
          });
          setToken(data.token);
          setCompanyUID(data.companyUID);
          setLocationUID(data.locationUID);
          setCompanyName(data.companyName);
          setUserId(data.userId);
          navigate("/");
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleLogout = () => {
    setToken(null);
    setCompanyUID(null);
    setLocationUID(null);
    setCompanyName(null);
    setUserId(null);
    navigate("/signin");
  };

  const value = {
    token,
    companyUID,
    locationUID,
    userId,
    companyName,
    onLogin: handleLogin,
    onLogout: handleLogout,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export default AuthProvider;
