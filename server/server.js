const express = require("express");
const app = express();
const cors = require("cors");
const db = require("./models");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const moment = require("moment");
const helmet = require("helmet");
const cookieParser = require(`cookie-parser`);
const passport = require("passport");
const session = require("express-session");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const winston = require("./services/winston/winston");
const path = require("path");
require("dotenv").config();

// cors setup
app.use(cors());
app.use(helmet());
app.options("*", cors());

// Enable before deployment to Heroku
app.set("trust proxy", 1);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

//  apply to all requests
app.use("/api/", apiLimiter);

// Logger uncomment next line to enable winston
app.use(morgan("combined", { stream: winston.stream }));
//app.use(morgan("dev"));

// Serve static content for the app from the "public" directory in the application directory.
app.use(express.static(__dirname + "/public"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// override with POST having ?_method=DELETE
app.use(methodOverride("_method"));
app.use(bodyParser.json());
app.use(cookieParser(process.env.COOKIE_SECRET));

// For Passport
app.use(
  session({
    secret: "alakori somebodi",
    resave: true,
    saveUninitialized: false,
    cookie: {},
  })
); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions

app.use((req, res, next) => {
  if (req.isAuthenticated) {
    res.locals.isAuthenticated = req.isAuthenticated();
    if (req.user !== undefined) {
      res.locals.userId = req.user.userId;
      res.locals.name = req.user.name;
      res.locals.emailAddress = req.user.emailAddress;
      res.locals.phoneNumber = req.user.phoneNumber;
      res.locals.companyUID = req.user.companyUID;
      res.locals.locationUID = req.user.locationUID;
      res.locals.role = req.user.role;
    }
  }
  next();
});

require(path.join(__dirname, "./routes/api-routes.js"))(app);
require(path.join(__dirname, "./routes/auth-routes.js"))(app);

// load passport strategies
require(path.join(__dirname, "./services/passport/passport.js"))(
  passport,
  db.User
);
//require(path.join(__dirname, "./services/passport/local.js"));
require(path.join(__dirname, "./services/passport/jwt.js"));
require(path.join(__dirname, "./services/security/security.js"));

module.exports = app;
