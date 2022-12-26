const authController = require("../controllers/auth_controller.js");
const { check } = require("express-validator");
const Security = require("../services/security/security.js");
const { verifyUser } = require("../services/security/security.js");
module.exports = function(app) {
  app.post("/signout", authController.signout);

  app.post(
    "/passwordreset/:token",
    [
      check("newPassword")
        .not()
        .isEmpty()
        .withMessage("Please enter your new password"),
      check("confirmPassword")
        .not()
        .isEmpty()
        .withMessage("Please confirm your new password"),
    ],
    authController.passwordReset
  );

  app.post(
    "/resetPassword",
    [
      check("newPassword")
        .not()
        .isEmpty()
        .withMessage("Please enter your new password"),
      check("confirmPassword")
        .not()
        .isEmpty()
        .withMessage("Please confirm your new password"),
    ],
    authController.ResetPassword
  );

  app.post(
    "/api/signup",
    [
      check("name")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Name is required"),
      check("emailAddress")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Email is required"),
      check("phoneNumber")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Phone number is required"),
      check("locationUID")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Location is required"),
    ],
    authController.signup
  );

  app.post("/api/refreshToken", authController.refreshToken);
  app.get("/api/getMe", verifyUser, authController.getMe);
  app.post("/api/signin", authController.signin);
  app.post("/api/updateUserDetails", authController.updateUserDetails);
  app.post(
    "/api/register",
    [
      check("companyName")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Company Name is required"),
    ],
    authController.newCompany
  );
  app.post(
    "/newLocation",
    [
      check("locationName")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Location Name is required"),
    ],
    authController.newLocation
  );
};
