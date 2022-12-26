import React from "react";
import { Route, Routes } from "react-router-dom";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import SignIn from "./components/Auth/SignIn";
import SignUp from "./components/Auth/SignUp";
import ForgotPassword from "./components/Auth/ForgotPassword";
import Register from "./components/Auth/Register";
import Home from "./components/Home/Home";
import AuthProvider from "./providers/authProvider";
import NewLocation from "./components/Auth/NewLocation";
import ResetPassword from "./components/Auth/ResetPassword";

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/iforgot" element={<ForgotPassword />} />
          <Route path="/register" element={<Register />} />
          <Route path="/location" element={<NewLocation />} />
          <Route
            path="/resetPassword/:resetPasswordToken"
            element={<ResetPassword />}
          />
        </Routes>
        <Footer />
      </AuthProvider>
    </div>
  );
}

export default App;
