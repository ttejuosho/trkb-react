/* eslint-disable max-len */
// const session = require('express-session');
// load bcrypt
const bCrypt = require("bcrypt-nodejs");
const db = require("../../models");
const sendEmail = require("../email/email.js");
const { getRefreshToken } = require("../security/security");

module.exports = function(passport, user) {
  const User = user;
  const LocalStrategy = require("passport-local").Strategy;
  // creates a cookie for the user sessions
  passport.serializeUser(function(user, done) {
    done(null, user.userId);
  });

  // used to deserialize the user
  // reads the cookie
  passport.deserializeUser(function(userId, done) {
    User.findByPk(userId).then(function(user) {
      if (user) {
        done(null, user.get());
      } else {
        done(user.errors, null);
      }
    });
  });

  // LOCAL SIGNUP
  passport.use(
    "local-signup",
    new LocalStrategy(
      {
        usernameField: "emailAddress",
        passwordField: "password",
        passReqToCallback: true, // allows us to pass back the entire request to the callback
      },
      function(req, emailAddress, password, done) {
        const generateHash = function(password) {
          return bCrypt.hashSync(password, bCrypt.genSaltSync(8), null);
        };

        User.findOne({
          where: {
            emailAddress: emailAddress,
          },
        }).then(function(user) {
          if (user) {
            return done(null, false, {
              message: "That email is already taken",
            });
          } else {
            const userPassword = generateHash(password);
            const data = {
              emailAddress: emailAddress,
              password: userPassword,
              name: req.body.name,
              phoneNumber: req.body.phoneNumber,
              companyUID: req.body.companyUID,
              locationUID: req.body.locationUID,
              role: req.body.newCompany == "true" ? "admin" : "basic",
            };

            User.create(data)
              .then(function(newUser, created) {
                if (!newUser) {
                  return done(null, false);
                }
                if (newUser) {
                  let refreshToken = getRefreshToken({
                    userId: newUser.userId,
                  });
                  User.update(
                    { refreshToken: refreshToken },
                    {
                      where: {
                        userId: newUser.userId,
                      },
                    }
                  ).then(() => {
                    return done(null, newUser);
                  });
                }
              })
              .then(() => {
                //Send Confirmation Email to new user
                const emailBody = `
          <p>Hello ${
            req.body.name.split(" ").length > 1
              ? req.body.name.split(" ")[0]
              : req.body.name
          },</p>
          <p style="color: black;">Your account is set and you're all good to go. Click <a href="https://trkb.herokuapp.com/">here</a> to sign in to manage your business finances.</p>
          <p> <span style="font-size: 1rem;color: black;"><strong>The TRKB Team</strong></span></p>
          `;
                sendEmail(
                  "TrKB Financial",
                  emailBody,
                  "Welcome to Torokobo!",
                  emailAddress
                );
              });
          }
        });
      }
    )
  );

  // LOCAL SIGNIN
  passport.use(
    "local-signin",
    new LocalStrategy(
      {
        // by default, local strategy uses username and password, we will override with email
        usernameField: "emailAddress",
        passwordField: "password",
        passReqToCallback: true, // allows us to pass back the entire request to the callback
        failureFlash: true,
      },
      function(req, emailAddress, password, done) {
        const User = user;
        const isValidPassword = function(inputPassword, hashedPassword) {
          return bCrypt.compareSync(inputPassword, hashedPassword);
        };

        User.findOne({
          where: {
            emailAddress: emailAddress,
          },
        })
          .then(function(user) {
            if (user == null) {
              return done(null, false, {
                message:
                  "Email does not exist, click sign up with your company Id or register.",
              });
            }

            if (!user.active) {
              return done(null, true, {
                message:
                  "Your account is inactive. Contact your Admin to activate your account.",
              });
            }

            if (!isValidPassword(password, user.password)) {
              return done(null, false, {
                message: "Incorrect password.",
              });
            }

            let refreshToken = getRefreshToken({
              userId: user.dataValues.userId,
            });

            User.update(
              { refreshToken: refreshToken },
              {
                where: {
                  userId: user.dataValues.userId,
                },
              }
            ).then(() => {
              const userInfo = user.get();
              return done(null, userInfo);
            });
          })
          .catch(function(err) {
            return done(null, false, {
              message: "Something went wrong with your Signin",
            });
          });
      }
    )
  );
};
