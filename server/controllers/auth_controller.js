const db = require("../models");
const passport = require("passport");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const bCrypt = require("bcrypt-nodejs");
const crypto = require("crypto");
const sendEmail = require("../services/email/email.js");
const { logThis } = require("../services/log/log.js");
const {
  getUserLocationData,
  getCompanyByUID,
} = require("../services/common/common");
const {
  getToken,
  COOKIE_OPTIONS,
  getRefreshToken,
} = require("../services/security/security.js");

exports.newCompany = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    errors.companyName = req.body.companyName;
    errors.companyRegistration = true;
    errors.layout = "partials/prelogin";
    return res.render("auth/auth", errors);
  }
  var companyUID = Math.floor(Math.random() * 90000) + 10000;
  let checkCompany = await db.Company.findOne({
    where: {
      companyName: req.body.companyName,
    },
  });

  if (checkCompany == null) {
    db.Company.create({
      companyName: req.body.companyName,
      companyUID: companyUID,
    }).then((dbCompany) => {
      return res.render("auth/auth", {
        title: "Sign Up",
        layout: "partials/prelogin",
        newLocation: true,
        companyUID: companyUID,
        companyName: req.body.companyName,
      });
    });
  } else {
    return res.render("auth/auth", {
      title: "Register",
      layout: "partials/prelogin",
      companyRegistration: true,
      companyName: req.body.companyName,
      error: "Company already exists.",
    });
  }
};

exports.newLocation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    errors.locationName = req.body.locationName;
    errors.newLocation = true;
    return res.render("auth/auth", errors);
  }
  var locationUID = Math.floor(Math.random() * 90000) + 10000;
  db.Location.findOne({
    where: {
      locationName: req.body.locationName,
    },
  }).then((dbLocation) => {
    if (dbLocation == null) {
      db.Location.create({
        locationUID: locationUID,
        companyUID: req.body.companyUID,
        locationName: req.body.locationName,
      }).then((dbLocation) => {
        if (req.body.action === "New Location") {
          return res.render("auth/auth", {
            layout: "partials/prelogin",
            newLocation: true,
            companyUID: req.body.companyUID,
            companyName: req.body.companyName,
          });
        } else {
          db.Location.findAll({
            where: {
              companyUID: req.body.companyUID,
            },
          }).then((dbLocation) => {
            var locations = [];
            for (var i = 0; i < dbLocation.length; i++) {
              locations.push(dbLocation[i].dataValues);
            }
            return res.render("auth/auth", {
              layout: "partials/prelogin",
              signup: true,
              newCompany: true,
              companyUID: req.body.companyUID,
              companyName: req.body.companyName,
              locations: locations,
            });
          });
        }
      });
    } else {
      return res.render("auth/auth", {
        title: "Sign Up",
        layout: "partials/prelogin",
        newLocation: true,
        companyUID: req.body.companyUID,
        companyName: req.body.companyName,
        error: "Location already exists.",
      });
    }
  });
};

exports.signup = (req, res, next) => {
  //Validate Company Id
  res.locals.locationUID = req.body.locationUID;
  db.Company.findOne({
    where: {
      companyUID: req.body.companyUID,
    },
  }).then((dbCompany) => {
    if (dbCompany == null) {
      return res.status(404).json({ error: "Invalid Company ID" });
    } else {
      req.session.userInfo = {};
      req.session.userInfo.companyUID = dbCompany.dataValues.companyUID;
      req.session.userInfo.companyName = req.body.companyName;
      //Check Password
      if (
        req.body.password.trim().length < 3 ||
        req.body.password.trim() !== req.body.confirmPassword.trim()
      ) {
        return res.status(400).json({ error: "Please Check your password" });
      } else {
        // check if Email address exists
        db.User.findOne({
          where: {
            emailAddress: req.body.emailAddress,
          },
        }).then((dbUser) => {
          if (dbUser !== null) {
            return res.status(409).json({
              error:
                "Email is taken, Please use the password reset link or choose a new email",
            });
          } else {
            // Success
            passport.authenticate("local-signup", (err, user) => {
              if (err) {
                return next(err); // will generate a 500 error
              }
              if (!user) {
                return res.json({
                  error: "Sign Up Failed: Username already exists",
                });
              }
              req.login(user, (signupErr) => {
                if (signupErr) {
                  return res.json({ error: "Sign up Failed" });
                }
                req.session.userInfo = {};
                req.session.userInfo.companyId = req.body.companyUID;
                req.session.userInfo.companyName = req.body.companyName;

                let token = getToken({ userId: user.userId });

                res.cookie("refreshToken", user.refreshToken, COOKIE_OPTIONS);
                res.send({ success: true, token });
              });
            })(req, res, next);
          }
        });
      }
    }
  });
};

exports.signin = async (req, res, next) => {
  const locationData = await getUserLocationData(
    req.headers["x-forwarded-for"] || req.socket.remoteAddress
  );

  passport.authenticate("local-signin", function(err, user, info) {
    if (err) {
      return next(err); // will generate a 500 error
    }

    if (info && info.message.length > 1) {
      return res.send({ error: info.message });
    }

    // User is boolean
    if (!user) {
      return res.send({ error: "Your Username or Password is incorrect" });
    }

    req.login(user, async (loginErr) => {
      if (loginErr) {
        return res.send({ error: "Authentication Failed" });
      }

      await logThis(
        "INFO",
        req.user.userId,
        req.user.emailAddress,
        req.user.companyUID,
        req.user.locationUID,
        "/signin",
        locationData.ipAddress,
        "AuthController.Signin called.",
        `${req.user.name} signed in at ${new Date().toLocaleString()}`
      );

      if (process.env.NODE_ENV !== "development") {
        let emailBody = `${
          req.user.name
        } signed in at ${new Date().toLocaleString()}`;
        sendEmail(
          "TrKB Financials",
          emailBody,
          "New Login Notification",
          "theycallmeflowz@yahoo.com"
        );
      }

      const companyInfo = await getCompanyByUID(user.companyUID);

      req.session.userInfo = {};
      req.session.userInfo.companyId = companyInfo.companyId;
      req.session.userInfo.companyUID = companyInfo.companyUID;
      req.session.userInfo.companyName = companyInfo.companyName;
      req.session.userInfo.ipAddress =
        req.headers["x-forwarded-for"] || req.socket.remoteAddress;
      req.session.userInfo.userLocationCity = locationData.city;
      req.session.userInfo.userLocationState = locationData.state;

      const token = getToken({ userId: req.user.userId });

      res.cookie("refreshToken", req.user.refreshToken, COOKIE_OPTIONS);
      res.send({
        success: true,
        token: token,
        companyUID: companyInfo.companyUID,
        locationUID: req.user.locationUID,
        companyName: companyInfo.companyName,
        userId: req.user.userId,
      });
    });
  })(req, res, next);
};

exports.refreshToken = async (req, res, next) => {
  const { signedCookies = {} } = req;
  const { refreshToken } = signedCookies;
  if (refreshToken) {
    try {
      const payload = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
      const userId = payload.userId;
      db.User.findByPk(userId, { raw: true }).then(
        (user) => {
          if (user) {
            // Find the refresh token against the user record in database
            db.User.findOne({
              where: { userId: userId, refreshToken: refreshToken },
            }).then((dbUser) => {
              console.log(dbUser);
              if (dbUser == null) {
                res.statusCode = 401;
                res.send({ error: "Unauthorized" });
              } else {
                const token = getToken({ userId: userId });
                // If the refresh token exists, then create new one and replace it.
                const newRefreshToken = getRefreshToken({
                  userId: userId,
                });
                db.User.update(
                  { refreshToken: newRefreshToken },
                  { where: { userId: userId } }
                )
                  .then((dbUser) => {
                    res.cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS);
                    res.send({ success: true, token });
                  })
                  .catch((error) => {
                    res.statusCode = 500;
                    res.send(err);
                  });
              }
            });
          } else {
            res.statusCode = 401;
            res.send("Unauthorized");
          }
        },
        (err) => next(err)
      );
    } catch (err) {
      res.statusCode = 401;
      res.send("Unauthorized");
    }
  } else {
    res.statusCode = 401;
    res.send("Unauthorized");
  }
};

exports.getMe = async (req, res, next) => {
  res.send(req.user);
};

exports.sendPasswordResetEmail = (req, res) => {
  const token = crypto.randomBytes(20).toString("hex");
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    let errorResponse = {};
    errors.errors.map((error) => {
      errorResponse[error.param + "Error"] = error.msg;
    });

    return res.status(400).json(errorResponse);
  }

  db.User.findOne({
    where: {
      emailAddress: req.body.emailAddress,
    },
  }).then((dbUser) => {
    if (dbUser === null) {
      return res.status(400).json({ emailAddressError: "Email not found" });
    }
    const userInfo = {
      name: dbUser.dataValues.name,
      emailAddress: dbUser.dataValues.emailAddress,
      resetPasswordToken: token,
      resetPasswordExpires: Date.now() + 3600000,
    };

    const subject = "Reset Your ToroKobo Password";
    const emailBody = `
          <p>Hello ${userInfo.name},</p>
          <p style="color: black;">Ready to reset your password ?.</p>    
          <p>Click <a href="https://trkb.herokuapp.com/passwordreset/${token}">Reset now</a> to begin.</p>
          <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
          <span style="font-size: 1rem;color: black;"><strong>Kowope Enterprises.</strong></span>
          `;

    logThis(
      "INFO",
      res.locals.userId,
      res.locals.emailAddress,
      res.locals.companyUID,
      res.locals.locationUID,
      "authController/sendPasswordResetEmail",
      req.socket.remoteAddress,
      `Password Reset email sent to ${userInfo.emailAddress}`,
      `Token ${token}, Expires at ${new Date(
        userInfo.resetPasswordExpires
      ).toLocaleString()}`
    );

    return new Promise((resolve, reject) => {
      sendEmail("TrKB Financials", emailBody, subject, userInfo.emailAddress);
      db.User.update(
        {
          resetPasswordExpires: userInfo.resetPasswordExpires,
          resetPasswordToken: userInfo.resetPasswordToken,
        },
        {
          where: {
            userId: dbUser.dataValues.userId,
          },
        }
      );
      return res.status(200).json({
        response:
          "Password reset email has been sent to " + userInfo.emailAddress,
      });
    });
  });
};

exports.passwordReset = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    (errors.resetPassword = true), (errors.token = req.params.token);
    errors.layout = "partials/prelogin";
    return res.render("auth/auth", errors);
  } else if (req.body.newPassword !== req.body.confirmPassword) {
    const hbsObject = {
      resetPassword: true,
      token: req.params.token,
      error: "Passwords dont match",
      layout: "partials/prelogin",
    };
    return res.render("auth/auth", hbsObject);
  } else {
    db.User.findOne({
      where: {
        resetPasswordToken: req.params.token,
      },
    }).then((dbUser) => {
      if (dbUser === null) {
        const errors = {
          resetPassword: true,
          error: "Email not found",
          layout: "partials/prelogin",
        };
        return res.render("auth/auth", errors);
      }
      if (
        dbUser.dataValues.resetPasswordExpires > Date.now() &&
        crypto.timingSafeEqual(
          Buffer.from(dbUser.dataValues.resetPasswordToken),
          Buffer.from(req.params.token)
        )
      ) {
        const userPassword = bCrypt.hashSync(
          req.body.newPassword,
          bCrypt.genSaltSync(8),
          null
        );
        db.User.update(
          {
            resetPasswordExpires: null,
            resetPasswordToken: null,
            password: userPassword,
          },
          {
            where: {
              userId: dbUser.dataValues.userId,
            },
          }
        );
        const name = dbUser.dataValues.name;
        const subject = "Your Torokobo Password has changed";
        const emailBody = `
              <p>Hello ${name},</p>
              <p style="color: black;">Your password has been successfully reset.</p>    
              <p>Click <a href="https://trkb.herokuapp.com/signin">here to Log In</a>.</p>
              <span style="font-size: 1rem;color: black;"><strong>TrKB Inc.</strong></span>`;
        return new Promise((resolve, reject) => {
          sendEmail(null, emailBody, subject, dbUser.dataValues.emailAddress);
          return res.redirect("/signin");
        });
      }
    });
  }
};

//Internally Reset Password
exports.ResetPassword = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    errors.resetPasswordError = true;
    return res.render("profile", errors);
  } else if (req.body.newPassword !== req.body.confirmPassword) {
    const hbsObject = {
      resetPasswordError: true,
      error: "Passwords dont match",
      companyUID: res.locals.companyUID,
      locationUID: res.locals.locationUID,
      name: res.locals.name,
      emailAddress: res.locals.emailAddress,
      phoneNUmber: res.locals.phoneNumber,
    };

    return res.render("profile", hbsObject);
  } else {
    const userPassword = bCrypt.hashSync(
      req.body.newPassword,
      bCrypt.genSaltSync(8),
      null
    );
    db.User.update(
      { password: userPassword },
      {
        where: {
          userId: res.locals.userId,
        },
      }
    );
    const name = res.locals.name;
    const subject = "Your TrKB Password has changed";
    const emailBody = `
          <p>Hello ${name},</p>
          <p style="color: black;">Your password has been successfully reset.</p>    
          <p>Click <a href="https://trkb.herokuapp.com/signin">here to Log In</a>.</p>
          <span style="font-size: 1rem;color: black;"><strong>TrKB Inc.</strong></span>`;
    return new Promise((resolve, reject) => {
      sendEmail(null, emailBody, subject, res.locals.emailAddress);
      return res.redirect("/profile");
    });
  }
};

exports.signout = async (req, res) => {
  const { signedCookies = {} } = req;
  const { refreshToken } = signedCookies;

  await logThis(
    "INFO",
    res.locals.userId,
    res.locals.emailAddress,
    res.locals.companyUID,
    res.locals.locationUID,
    "/signout",
    "AuthController.Signout called.",
    `${res.locals.name} signed out at ${new Date().toLocaleString()}`
  );

  db.User.update(
    { refreshToken: "" },
    {
      where: {
        userId: req.user.userId,
      },
    }
  )
    .then(() => {
      res.clearCookie("refreshToken", COOKIE_OPTIONS);
      res.send({ success: true });
    })
    .catch((err) => {
      res.statusCode = 500;
      res.send(err);
    });
};

exports.updateUserDetails = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    errors.name = req.body.name;
    errors.emailAddress = req.body.emailAddress;
    errors.phoneNumber = req.body.phoneNumber;
    return res.render("profile", errors);
  }

  db.User.update(
    {
      name: req.body.name,
      emailAddress: req.body.emailAddress,
      phoneNUmber: req.body.phoneNumber,
    },
    {
      where: { userId: res.locals.userId },
    }
  ).then((dbUser) => {
    return res.redirect("/profile");
  });
};
