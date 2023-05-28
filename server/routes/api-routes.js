const db = require("../models");
const https = require("https");
const moment = require("moment");
const Sequelize = require("sequelize");
const sequelize = require("sequelize");
const cron = require("node-cron");
const bCrypt = require("bcrypt-nodejs");
const Op = Sequelize.Op;
const {
  authenticate,
  grantAccess,
  verifyUser,
} = require("../services/security/security.js");
const {
  getLocationNamebyUID,
  getCompanyLocations,
  sendNewAccountPasswordResetEmail,
  getStartDate,
  isDateWithinRange,
  makeHTTPRequest,
  getUserRole,
  getLastWeekDays,
  harvestTimeEntryData,
} = require("../services/common/common.js");
const { check } = require("express-validator");
const { validationResult } = require("express-validator");
const crypto = require("crypto");
const { logThis } = require("../services/log/log.js");
const { sendSMS } = require("../services/sms/sms.js");
const { parse } = require("path/posix");
const Api = require("twilio/lib/rest/Api");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);
const sendEmail = require("../services/email/email.js");
const { start } = require("repl");

module.exports = (app) => {
  app.get("/api/getTransactions", (req, res) => {
    db.Transaction.findAll({
      attributes: {
        exclude: ["transactionId", "createdAt", "updatedAt"],
      },
    }).then((dbTransaction) => {
      res.json(dbTransaction);
    });
  });

  app.get(
    "/api/getTransactionById/:transactionId",
    authenticate,
    (req, res) => {
      const permission = grantAccess("basic", "readOwn", "transaction");

      db.Transaction.findByPk(req.params.transactionId).then(
        (dbTransaction) => {
          permission.filter(dbTransaction.dataValues);
          return res.json(dbTransaction);
        }
      );
    }
  );

  app.get(
    "/api/getTransactionByUID/:transactionUID",
    authenticate,
    (req, res) => {
      db.Transaction.findOne({
        where: {
          transactionUID: req.params.transactionUID,
        },
      }).then((dbTransaction) => {
        res.json(dbTransaction);
      });
    }
  );

  app.get(
    "/api/getTransactionsByPreparer/:preparedBy",
    authenticate,
    (req, res) => {
      db.Transaction.findAll({
        where: {
          preparedBy: req.params.preparedBy,
        },
      }).then((dbTransaction) => {
        res.json(dbTransaction);
      });
    }
  );

  app.get(
    "/api/getTransactionsByType/:transactionType",
    authenticate,
    (req, res) => {
      db.Transaction.findAll({
        where: {
          transactionType: req.params.transactionType,
        },
      }).then((dbTransaction) => {
        res.json(dbTransaction);
      });
    }
  );

  app.get(
    "/api/getTransactionsByTerminal/:transactionTerminal",
    authenticate,
    (req, res) => {
      db.Transaction.findAll({
        where: {
          transactionTerminal: req.params.transactionTerminal,
        },
      }).then((dbTransaction) => {
        res.json(dbTransaction);
      });
    }
  );

  app.get(
    "/api/getTransactionsByDateRange/:startDate/:endDate",
    authenticate,
    (req, res) => {
      // Date Format 2020-08-30T15:10:36.000Z
      const ACCEPT_FORMAT = "YYYY-MM-DD hh:mm:ss";
      const start_date = req.params.startDate;
      const end_date = req.params.endDate;
      const start = moment.utc(start_date, ACCEPT_FORMAT);
      const end = moment.utc(end_date, ACCEPT_FORMAT);

      db.Transaction.findAll({
        where: {
          createdAt: {
            [Op.between]: [start, end],
          },
        },
      })
        .then((dbTransaction) => {
          res.json(dbTransaction);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  );

  app.get(
    "/api/transaction/delete/:transactionId",
    authenticate,
    (req, res) => {
      if (res.locals.role == "basic") {
        return res.json({
          message: "You are not authorized to perform this operation",
        });
      } else {
        db.Transaction.findByPk(req.params.transactionId).then(
          (dbTransaction) => {
            if (dbTransaction !== null) {
              db.Transaction.update(
                { deleted: true },
                {
                  where: {
                    transactionId: req.params.transactionId,
                  },
                }
              ).then((dbTransaction) => {
                res.json(dbTransaction);
              });
            }
          }
        );
      }
    }
  );

  app.get(
    "/api/getTransactionsByLocation/:locationUID",
    authenticate,
    (req, res) => {
      var queryParams = {
        locationUID: res.locals.locationUID,
      };

      if (res.locals.role == "basic") {
        queryParams.UserUserId = res.locals.userId;
      }
      db.Transaction.findAll({
        where: queryParams,
      }).then((dbTransaction) => {
        res.json(dbTransaction);
      });
    }
  );

  app.get("/api/location/getDistinct/:columnName", authenticate, (req, res) => {
    var queryParams = {
      companyUID: res.locals.companyUID,
    };

    if (res.locals.role == "basic") {
      queryParams.locationUID = res.locals.locationUID;
    }

    db.Location.findAll({
      where: queryParams,
      attributes: [
        [
          Sequelize.fn("DISTINCT", Sequelize.col(req.params.columnName)),
          "value",
        ],
      ],
    })
      .then((dbData) => {
        return res.json(dbData);
      })
      .catch((err) => {
        return res.json(err.message);
      });
  });

  app.get(
    "/api/transaction/getDistinct/:columnName",
    authenticate,
    (req, res) => {
      var queryParams = {
        companyUID: res.locals.companyUID,
      };

      if (res.locals.role == "basic") {
        queryParams.UserUserId = res.locals.userId;
      }

      db.Transaction.findAll({
        where: queryParams,
        attributes: [
          [
            Sequelize.fn("DISTINCT", Sequelize.col(req.params.columnName)),
            "value",
          ],
        ],
      })
        .then((dbData) => {
          return res.json(dbData);
        })
        .catch((err) => {
          return res.json(err.message);
        });
    }
  );

  app.get("/api/getUsers", (req, res) => {
    db.User.findAll({
      attributes: {
        exclude: ["password", "resetPasswordToken", "resetPasswordExpires"],
      },
    })
      .then((dbUser) => {
        res.json(dbUser);
      })
      .catch((err) => {
        res.json(err);
      });
  });

  app.get("/api/getUser/:userId", authenticate, (req, res) => {
    db.User.findByPk(req.params.userId)
      .then((dbUser) => {
        res.json(dbUser);
      })
      .catch((err) => {
        res.json(err);
      });
  });

  app.get(
    "/api/getTransactions/:searchBy/:searchQuery",
    authenticate,
    (req, res) => {
      var searchObject = {};
      searchObject[req.params.searchBy] = req.params.searchQuery;
      searchObject["companyUID"] = res.locals.companyUID;
      db.Transaction.findAll({
        where: searchObject,
        attributes: [
          "transactionUID",
          "locationUID",
          "companyUID",
          "transactionTerminal",
          "transactionType",
          "transactionAmount",
          "transactionCharge",
          "posCharge",
          "customerName",
          "customerPhone",
          "customerEmail",
          "preparedBy",
          "createdAt",
        ],
      })
        .then((dbTransaction) => {
          return res.json(dbTransaction);
        })
        .catch((err) => {
          res.json(err);
        });
    }
  );

  app.get("/api/search/:searchBy/:searchQuery", authenticate, (req, res) => {
    const searchQuery = req.params.searchQuery;
    const searchBy = req.params.searchBy;
    let queryObj = {};
    const requestStart = Date.now();

    if (searchBy !== "All") {
      queryObj[searchBy] = {
        [Op.like]: "%" + searchQuery + "%",
      };
    } else {
      queryObj = {
        transactionUID: {
          [Op.like]: "%" + searchQuery + "%",
        },
        locationUID: {
          [Op.like]: "%" + searchQuery + "%",
        },
        transactionTerminal: {
          [Op.like]: "%" + searchQuery + "%",
        },
        transactionType: {
          [Op.like]: "%" + searchQuery + "%",
        },
        customerName: {
          [Op.like]: "%" + searchQuery + "%",
        },
        customerEmail: {
          [Op.like]: "%" + searchQuery + "%",
        },
        customerPhone: {
          [Op.like]: "%" + searchQuery + "%",
        },
        preparedBy: {
          [Op.like]: "%" + searchQuery + "%",
        },
      };
    }

    db.Transaction.findAll({
      where: {
        companyUID: res.locals.companyUID,
        [Op.or]: queryObj,
      },
    })
      .then((dbTransaction) => {
        if (dbTransaction.length > 0) {
          const processingTime = Date.now() - requestStart;
          var data = {
            processingTime: processingTime / 1000 + " seconds",
            count: dbTransaction.length,
            results: [],
          };
          for (var i = 0; i < dbTransaction.length; i++) {
            var temp = {
              transactionUID: dbTransaction[i].transactionUID,
              locationUID: dbTransaction[i].locationUID,
              transactionTerminal: dbTransaction[i].transactionTerminal,
              transactionType: dbTransaction[i].transactionType,
              transactionAmount: dbTransaction[i].transactionAmount,
              transactionCharge: dbTransaction[i].transactionCharge,
              posCharge: dbTransaction[i].posCharge,
              customerName: dbTransaction[i].customerName,
              customerEmail: dbTransaction[i].customerEmail,
              customerPhone: dbTransaction[i].customerPhone,
              preparedBy: dbTransaction[i].preparedBy,
              transactionDate: dbTransaction[i].createdAt,
            };
            data.results.push(temp);
          }

          res.json(data);
        }
      })
      .catch(function(err) {
        res.status(500).send({ message: err.message });
      });
  });

  app.post("/api/saveTransactions", (req, res) => {
    db.Transaction.bulkCreate(req.body)
      .then((dbTransaction) => {
        res.json(dbTransaction);
      })
      .catch((error) => {
        res.json(error.message);
      });
  });

  app.get("/api/makeAdmin/:userId", (req, res) => {
    db.User.update(
      {
        role: "admin",
      },
      {
        where: {
          userId: req.params.userId,
        },
      }
    )
      .then((dbUser) => {
        res.json(dbUser);
      })
      .catch((err) => {
        res.json(err.message);
      });
  });

  app.get("/api/makeBasic/:userId", (req, res) => {
    db.User.update(
      {
        role: "basic",
      },
      {
        where: {
          userId: req.params.userId,
        },
      }
    )
      .then((dbUser) => {
        res.json(dbUser);
      })
      .catch((err) => {
        res.json(err.message);
      });
  });

  app.get("/api/getLocations", authenticate, (req, res) => {
    const queryParams = {
      companyUID: res.locals.companyUID,
    };

    if (res.locals.role === "basic") {
      queryParams.locationUID = res.locals.locationUID;
    }

    db.Location.findAll({
      where: queryParams,
      //attributes: ["locationId", "locationUID", "locationName"],
    })
      .then((dbLocation) => {
        res.json(dbLocation);
      })
      .catch((err) => {
        res.json(err);
      });
  });

  app.get("/api/getLocationsByCompany/:companyUID", (req, res) => {
    db.Company.findOne({
      where: {
        companyUID: req.params.companyUID,
      },
    }).then((dbCompany) => {
      if (dbCompany !== null) {
        db.Location.findAll({
          where: {
            companyUID: req.params.companyUID,
          },
        })
          .then((dbLocation) => {
            res.json(dbLocation);
          })
          .catch((err) => {
            res.json(err);
          });
      } else {
        res.status(404).json({
          error: "Company Id is invalid.",
        });
      }
    });
  });

  app.get("/api/getLocationById/:locationUID", authenticate, (req, res) => {
    db.Location.findOne({
      where: {
        locationUID: req.params.locationUID,
      },
    })
      .then((dbLocation) => {
        res.json(dbLocation);
      })
      .catch((err) => {
        res.json(err);
      });
  });

  app.post(
    "/api/newAgent",
    authenticate,
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
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        errors.name = req.body.name;
        errors.emailAddress = req.body.emailAddress;
        errors.phoneNumber = req.body.phoneNumber;
        errors.locationUID = req.body.locationUID;
        var data = { errors: errors.errors };
        return res.json(data);
      } else {
        if (res.locals.role === "admin") {
          var checkAgent = await db.User.findOne({
            where: {
              emailAddress: req.body.emailAddress,
              companyUID: res.locals.companyUID,
            },
          });
          if (checkAgent == null) {
            const token = crypto.randomBytes(20).toString("hex");
            db.User.create({
              name: req.body.name,
              emailAddress: req.body.emailAddress,
              phoneNumber: req.body.phoneNumber,
              locationUID: req.body.locationUID,
              companyUID: res.locals.companyUID,
              resetPasswordToken: token,
              resetPasswordExpires: Date.now() + 3600000,
              role: req.body.role === "admin" ? "admin" : "basic",
              password: 1234,
            })
              .then((dbUser) => {
                delete dbUser.password;
                delete dbUser.active;
                const userData = {
                  userId: dbUser.userId,
                };
                sendNewAccountPasswordResetEmail(
                  req.body.name.split(" ")[0],
                  res.locals.name,
                  req.session.userInfo.companyName,
                  req.body.emailAddress,
                  token
                );

                var data = {
                  errors: [],
                  response: userData,
                };
                return res.json(data);
              })
              .catch((err) => {
                res.json(err.message);
              });
            await logThis(
              "INFO",
              res.locals.userId,
              res.locals.emailAddress,
              res.locals.companyUID,
              res.locals.locationUID,
              "/api/newAgent Sending Email to " + req.body.emailAddress,
              "",
              "Email sent ",
              "Token: " + token
            );
          } else {
            var data = {
              errors: [
                {
                  param: "message",
                  msg: "User with this email already exists",
                },
              ],
              data: req.body,
            };
            return res.json(data);
          }
        } else {
          return res.json({
            errors: [
              {
                message:
                  "Error: You are not authorized to perform this action.",
              },
            ],
          });
        }
      }
    }
  );

  app.post(
    "/api/updateUser/:userId",
    authenticate,
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
    (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        errors.name = req.body.name;
        errors.emailAddress = req.body.emailAddress;
        errors.phoneNumber = req.body.phoneNumber;
        errors.locationUID = req.body.locationUID;
        var data = { errors: errors.errors };
        return res.json(data);
      } else {
        if (res.locals.role == "admin") {
          res.locals.locationUID = req.body.locationUID;
          db.User.update(
            {
              name: req.body.name,
              emailAddress: req.body.emailAddress,
              phoneNumber: req.body.phoneNumber,
              locationUID: req.body.locationUID,
              companyUID: res.locals.companyUID,
              role: req.body.role,
              active: req.body.active,
            },
            {
              where: {
                userId: req.params.userId,
              },
            }
          )
            .then((dbUser) => {
              var data = {
                errors: [],
                response: dbUser,
              };
              return res.json(data);
            })
            .catch((err) => {
              res.json(err.errors);
            });
        } else {
          return res.json({
            errors: [
              {
                message:
                  "Error: You are not authorized to perform this action.",
              },
            ],
          });
        }
      }
    }
  );

  app.post(
    "/api/location/:companyUID",
    //authenticate,
    [
      check("locationName")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Location name is required"),
      check("locationAddress")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Address is required"),
      check("locationCity")
        .not()
        .isEmpty()
        .escape()
        .withMessage("City is required"),
      check("locationState")
        .not()
        .isEmpty()
        .escape()
        .withMessage("State is required"),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        let errorResponse = {};
        errors.errors.map((error) => {
          errorResponse[error.param + "Error"] = error.msg;
        });

        return res.status(400).json(errorResponse);
      } else {
        var exisitingLocation = await db.Location.findOne({
          where: {
            locationName: req.body.locationName,
            companyUID: req.params.companyUID,
          },
        });

        if (exisitingLocation == null) {
          db.Location.create({
            locationUID: Math.floor(Math.random() * 90000) + 10000,
            locationName: req.body.locationName,
            companyUID: req.params.companyUID,
            locationEmail: req.body.locationEmail,
            locationAddress: req.body.locationAddress,
            locationCity: req.body.locationCity,
            locationState: req.body.locationState,
            locationPhone: req.body.locationPhone,
            locationContactName: req.body.locationContactName,
            locationContactEmail: req.body.locationContactEmail,
            locationContactPhone: req.body.locationContactPhone,
            CompanyCompanyId: res.locals.companyId,
          })
            .then((dbLocation) => {
              var response = {
                locationId: dbLocation.locationId,
                locationUID: dbLocation.locationUID,
              };
              return res.status(200).json(response);
            })
            .catch((err) => {
              res.status(500).json({
                error: err.errors[0].message,
              });
            });
        } else {
          return res.status(400).json({
            error: "Location already exists",
          });
        }
      }
    }
  );

  app.post(
    "/api/updateLocation/:locationId",
    authenticate,
    [
      check("locationName")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Location name is required"),
      check("locationAddress")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Location Address is required"),
      check("locationCity")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Location City is required"),
      check("locationState")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Location State is required"),
    ],
    (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        errors.locationName = req.body.locationName;
        errors.locationAddress = req.body.locationAddress;
        errors.locationCity = req.body.locationCity;
        errors.locationState = req.body.locationState;
        var data = { errors: errors.errors };
        return res.json(data);
      } else {
        if (res.locals.role == "admin") {
          db.Location.update(
            {
              locationUID: req.body.locationUID,
              locationName: req.body.locationName,
              companyUID: res.locals.companyUID,
              locationEmail: req.body.locationEmail,
              locationAddress: req.body.locationAddress,
              locationCity: req.body.locationCity,
              locationState: req.body.locationState,
              locationPhone: req.body.locationPhone,
              locationContactName: req.body.locationContactName,
              locationContactEmail: req.body.locationContactEmail,
              locationContactPhone: req.body.locationContactPhone,
            },
            {
              where: {
                locationId: req.params.locationId,
              },
            }
          )
            .then((dbLocation) => {
              var data = {
                errors: [],
                response: dbLocation,
              };
              return res.json(data);
            })
            .catch((err) => {
              res.json(err.errors);
            });
        } else {
          return res.json({
            errors: [
              {
                message:
                  "Error: You are not authorized to perform this action.",
              },
            ],
          });
        }
      }
    }
  );

  app.get("/api/deactivateUser/:userId", authenticate, (req, res) => {
    if (res.locals.role == "admin") {
      db.User.findOne({
        where: {
          userId: req.params.userId,
          companyUID: res.locals.companyUID,
        },
      }).then((dbUser) => {
        if (dbUser != null) {
          db.User.update(
            {
              active: false,
            },
            {
              where: {
                userId: req.params.userId,
              },
            }
          ).then((dbUser) => {
            res.json(dbUser);
          });
        }
      });
    } else {
      return res.json({
        errors: [
          {
            message: "Error: You are not authorized to perform action.",
          },
        ],
      });
    }
  });

  app.get("/api/activateUser/:userId", authenticate, (req, res) => {
    if (res.locals.role == "admin") {
      db.User.findOne({
        where: {
          userId: req.params.userId,
          companyUID: res.locals.companyUID,
        },
      }).then((dbUser) => {
        if (dbUser != null) {
          db.User.update(
            {
              active: true,
            },
            {
              where: {
                userId: req.params.userId,
              },
            }
          ).then((dbUser) => {
            res.json(dbUser);
          });
        }
      });
    } else {
      return res.json({
        errors: [
          {
            message: "Error: You are not authorized to perform this action.",
          },
        ],
      });
    }
  });

  app.get("/api/deleteUser/:userId", authenticate, (req, res) => {
    if (
      res.locals.role === "admin" &&
      req.params.userId !== res.locals.userId
    ) {
      db.User.findOne({
        where: {
          userId: req.params.userId,
          companyUID: res.locals.companyUID,
        },
      }).then((dbUser) => {
        if (dbUser != null) {
          db.User.destroy({
            where: {
              userId: req.params.userId,
            },
          }).then((dbUser) => {
            res.json(dbUser);
          });
        }
      });
    } else {
      return res.json({
        errors: [
          {
            message: "Error: You are not authorized to perform this action.",
          },
        ],
      });
    }
  });

  app.get("/api/deleteLocation/:locationId", authenticate, (req, res) => {
    if (res.locals.role == "admin") {
      db.Location.findByPk(req.params.locationId).then((dbLocation) => {
        if (dbLocation != null) {
          db.Location.destroy({
            where: {
              locationId: req.params.locationId,
            },
          }).then((dbLocation) => {
            return res.json(dbLocation);
          });
        }
      });
    } else {
      return res.json({
        errors: [
          {
            message: "Error: You are not authorized to perform this action.",
          },
        ],
      });
    }
  });

  app.get("/api/getAgents", authenticate, async (req, res) => {
    const data = await db.sequelize.query(
      "SELECT `User`.`userId`, `User`.`name`, `User`.`emailAddress`, `User`.`phoneNumber`, `User`.`role`, `User`.`active`, `Locations`.`locationId` AS `locationId`,  `Locations`.`locationUID` AS `locationUID`, `Locations`.`locationName` AS `locationName` FROM `Users` AS `User` LEFT OUTER JOIN `Locations` AS `Locations` ON `User`.`locationUID` = `Locations`.`locationUID` WHERE `User`.`companyUID` = " +
        res.locals.companyUID,
      {
        type: sequelize.QueryTypes.SELECT,
      }
    );

    return res.status(200).json(data);
  });

  app.get("/api/getCompanyInfo", authenticate, (req, res) => {
    db.Company.findOne({
      where: {
        companyUID: res.locals.companyUID,
      },
    })
      .then((dbCompany) => {
        res.json(dbCompany);
      })
      .catch((err) => {
        res.json(err);
      });
  });

  app.get(
    "/api/getLocationData/:locationUID",
    authenticate,
    async (req, res) => {
      try {
        const data = await db.sequelize.query(
          "SELECT `Transaction`.`transactionId`, `Transaction`.`transactionUID`,`Transaction`.`companyUID`,`Transaction`.`locationUID`,`Transaction`.`transactionTerminal`,`Transaction`.`transactionType`,`Transaction`.`transactionAmount`,`Transaction`.`transactionCharge`,`Transaction`.`posCharge`,`Transaction`.`customerName`,`Transaction`.`customerPhone`,`Transaction`.`customerEmail`,`Transaction`.`preparedBy`,`Transaction`.`createdAt`,`Location`.`locationId` AS `locationId`,`Location`.`locationUID` AS `locationUID`,`Location`.`locationName` AS `locationName`,`Location`.`locationAddress` AS `locationAddress`,`Location`.`locationCity` AS `locationCity`,`Location`.`locationState` AS `locationState`,`Location`.`locationPhone` AS `locationPhone` FROM `Transactions` AS `Transaction` LEFT OUTER JOIN `Locations` AS `Location` ON `Transaction`.`locationUID` = `Location`.`locationUID` WHERE `Transaction`.`locationUID` =" +
            req.params.locationUID,
          {
            type: sequelize.QueryTypes.SELECT,
          }
        );
        if (data.length > 0) {
          var result = {
            Location: {},
            Transactions: [],
          };
          result.Location.locationId = data[0].locationId;
          result.Location.locationUID = data[0].locationUID;
          result.Location.locationName = data[0].locationName;
          result.Location.locationAddress = data[0].locationAddress;
          result.Location.locationCity = data[0].locationCity;
          result.Location.locationState = data[0].locationState;
          result.Location.locationPhone = data[0].locationPhone;

          data.forEach((trans) => {
            var temp = {
              transactionId: trans.transactionId,
              transactionUID: trans.transactionUID,
              companyUID: trans.companyUID,
              transactionTerminal: trans.transactionTerminal,
              transactionType: trans.transactionType,
              transactionCharge: trans.transactionCharge,
              transactionAmount: trans.transactionAmount,
              posCharge: trans.posCharge,
              customerName: trans.customerName,
              customerEmail: trans.customerEmail,
              customerPhone: trans.customerPhone,
            };
            result.Transactions.push(temp);
          });
        } else {
          result = data;
        }
        return res.status(200).json(result);
      } catch (errors) {
        return res.json(errors);
      }
    }
  );

  app.get("/api/transactions/getMostRecent", authenticate, async (req, res) => {
    try {
      await logThis(
        "INFO",
        res.locals.userId,
        res.locals.emailAddress,
        res.locals.companyUID,
        res.locals.locationUID,
        "/api/transactions/chart/getMostRecent",
        req.session.userInfo.ipAddress,
        "",
        ""
      );

      let data = await db.Transaction.findAll({
        where: {
          companyUID: res.locals.companyUID,
        },
        limit: 10,
        order: [["createdAt", "DESC"]],
        attributes: [
          "transactionUID",
          "locationUID",
          "transactionTerminal",
          "transactionType",
          "transactionAmount",
          "transactionCharge",
          "estimatedProfit",
          "posCharge",
          "preparedBy",
          "createdAt",
        ],
      });

      var results = [];
      for (let i = 0; i < data.length; i++) {
        const locationName = await getLocationNamebyUID(
          data[i].dataValues.locationUID
        );
        data[i].dataValues.locationName = locationName;
        results.push(data[i].dataValues);
      }

      return res.status(200).json(results);
    } catch (errors) {
      await logThis(
        "ERROR",
        res.locals.userId,
        res.locals.emailAddress,
        res.locals.companyUID,
        res.locals.locationUID,
        "/api/transactions/chart/getMostRecent",
        "",
        "Api call failed",
        errors.message
      );

      return res.json(errors);
    }
  });

  app.get(
    "/api/transactions/chart/byLocation/:time",
    //authenticate,
    async (req, res) => {
      try {
        await logThis(
          "INFO",
          res.locals.userId,
          res.locals.emailAddress,
          res.locals.companyUID,
          res.locals.locationUID,
          "/api/transactions/chart/byLocation/" + req.params.time,
          req.session.userInfo.ipAddress,
          "",
          ""
        );

        let results = [];
        let locations = await getCompanyLocations(res.locals.companyUID);
        let startDate = await getStartDate(req.params.time);
        let endDate = new Date(
          new Date().setUTCHours(23, 59, 59, 999)
        ).toISOString();

        for (var i = 0; i < locations.length; i++) {
          let data = {
            locationName: locations[i].locationName,
            locationUID: locations[i].locationUID,
            locationCount: locations.length,
            transactions: [],
            estimatedProfit: 0,
            transactionAmount: 0,
            transactionCharge: 0,
            posCharge: 0,
          };

          let transactions = await db.Transaction.findAll({
            where: {
              locationUID: locations[i].locationUID,
              createdAt: {
                [Op.between]: [startDate, endDate],
              },
            },
            attributes: [
              "transactionUID",
              "companyUID",
              "locationUID",
              "transactionTerminal",
              "transactionType",
              "transactionAmount",
              "transactionCharge",
              "posCharge",
              "estimatedProfit",
              "customerName",
              "customerPhone",
              "customerEmail",
              "preparedBy",
              "createdAt",
            ],
          });

          data.transactionCount = transactions.length;

          for (var j = 0; j < transactions.length; j++) {
            data.transactionAmount += transactions[j].transactionAmount;
            data.transactionCharge += transactions[j].transactionCharge;
            data.posCharge += transactions[j].posCharge;
            data.estimatedProfit += transactions[j].estimatedProfit;
            data.transactions.push(transactions[j].dataValues);
          }

          results.push(data);
        }
        return res.status(200).json(results);
      } catch (errors) {
        await logThis(
          "ERROR",
          res.locals.userId,
          res.locals.emailAddress,
          res.locals.companyUID,
          res.locals.locationUID,
          "/api/transactions/chart/byLocation/" + req.params.time,
          "",
          "Api call failed",
          errors.message
        );
        return res.json(errors);
      }
    }
  );

  app.get(
    "/api/transaction/getTransactions/:locationUID/:transactionFilter",
    authenticate,
    async (req, res) => {
      try {
        await logThis(
          "INFO",
          res.locals.userId,
          res.locals.emailAddress,
          res.locals.companyUID,
          res.locals.locationUID,
          "/api/transaction/getTransactions/" +
            req.params.locationUID +
            "/" +
            req.params.transactionFilter,
          req.session.userInfo.ipAddress,
          "",
          ""
        );
        let startDate = await getStartDate(req.params.transactionFilter);
        let endDate = new Date(
          new Date().setUTCHours(23, 59, 59, 999)
        ).toISOString();
        let locationName = await getLocationNamebyUID(req.params.locationUID);

        let data = {
          locationName: locationName,
          transactions: [],
          estimatedProfit: 0,
        };

        let transactions = await db.Transaction.findAll({
          where: {
            locationUID: req.params.locationUID,
            createdAt: {
              [Op.between]: [startDate, endDate],
            },
          },
          attributes: [
            "transactionUID",
            "companyUID",
            "locationUID",
            "transactionTerminal",
            "transactionType",
            "transactionAmount",
            "transactionCharge",
            "posCharge",
            "estimatedProfit",
            "customerName",
            "customerPhone",
            "customerEmail",
            "preparedBy",
            "createdAt",
          ],
        });

        data.transactionCount = transactions.length;

        for (var j = 0; j < transactions.length; j++) {
          data.estimatedProfit += transactions[j].estimatedProfit;
          data.transactions.push(transactions[j].dataValues);
        }

        return res.status(200).json(data);
      } catch (errors) {
        await logThis(
          "ERROR",
          res.locals.userId,
          res.locals.emailAddress,
          res.locals.companyUID,
          res.locals.locationUID,
          "/api/transaction/getTransactions/" +
            req.params.locationUID +
            "/" +
            req.params.transactionFilter,
          "",
          "Api call failed",
          errors.message
        );
        return res.json(errors);
      }
    }
  );

  app.get(
    "/api/autoTracker/tracker/getByCustomerId/:customerId",
    authenticate,
    async (req, res) => {
      try {
        db.Tracker.findAll({
          where: {
            customerId: req.params.customerId,
          },
        }).then((dbTracker) => {
          res.json(dbTracker);
        });
      } catch (errors) {
        res.json(errors);
      }
    }
  );

  app.get(
    "/api/autoTracker/tracker/getById/:trackerId",
    authenticate,
    async (req, res) => {
      try {
        db.Tracker.findByPk(req.params.trackerId).then((dbTracker) => {
          res.json(dbTracker);
        });
      } catch (errors) {
        res.json(errors);
      }
    }
  );

  app.get("/api/autoTracker/customers", authenticate, async (req, res) => {
    try {
      db.Customer.findAll({}).then((dbCustomer) => {
        res.json(dbCustomer);
      });
    } catch (errors) {
      res.json(errors);
    }
  });

  app.delete(
    "/api/autoTracker/customer/:customerId",
    authenticate,
    async (req, res) => {
      db.Customer.destroy({
        where: { customerId: req.params.customerId },
      }).then((dbCustomer) => {
        res.json(dbCustomer);
      });
    }
  );

  app.delete(
    "/api/autoTracker/tracker/:customerId/:trackerId",
    authenticate,
    async (req, res) => {
      db.Tracker.destroy({
        where: { trackerId: req.params.trackerId },
      }).then((dbTracker) => {
        console.log(dbTracker);
        res.json(dbTracker);
      });
    }
  );

  app.post(
    "/api/autoTracker/customer/new",
    authenticate,
    [
      check("customerName")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Customer name is required"),
      check("customerExternalId")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Customer Id is required"),
      check("customerEmail")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Email Address is required"),
      check("customerPhone")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Phone Number is required"),
      check("ipAddress")
        .not()
        .isEmpty()
        .escape()
        .withMessage("IP Address is required"),
    ],
    async (req, res) => {
      try {
        db.Customer.create({
          customerName: req.body.customerName,
          customerExternalId: req.body.customerExternalId,
          customerEmail: req.body.customerEmail,
          customerPhone: req.body.customerPhone,
          ipAddress: req.body.ipAddress,
          expiresOn: new Date(req.body.expiresOn).toLocaleDateString(),
          registeredOn: new Date(req.body.registeredOn).toLocaleDateString(),
          lastLoginDate: new Date(req.body.lastLoginDate).toLocaleDateString(),
        }).then((dbCustomer) => {
          res.json(dbCustomer);
        });
      } catch (errors) {
        res.json(errors);
      }
    }
  );

  app.put(
    "/api/autoTracker/tracker/update/:trackerId",
    authenticate,
    [
      check("imei")
        .not()
        .isEmpty()
        .escape()
        .withMessage("IMEI is required"),
      check("gpsDevice")
        .not()
        .isEmpty()
        .escape()
        .withMessage("GPS Device is required"),
      check("simCardNumber")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Sim Card Number is required"),
      check("ipAddress")
        .not()
        .isEmpty()
        .escape()
        .withMessage("IP Address is required"),
      check("port")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Port is required"),
      check("protocol")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Protocol is required"),
      check("netProtocol")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Net Protocol is required"),
      check("expiresOn")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Expiration Date is required"),
      check("lastConnectionDate")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Last Connection Date is required"),
    ],
    async (req, res) => {
      try {
        let trackerPayLoad = {
          customerId: req.body.customerId,
          vehicleYear: req.body.vehicleYear,
          vehicleMake: req.body.vehicleMake,
          vehicleModel: req.body.vehicleModel,
          imei: req.body.imei,
          simCardnumber: req.body.simCardnumber,
          gpsDevice: req.body.gpsDevice,
          protocol: req.body.protocol,
          netProtocol: req.body.netProtocol,
          ipAddress: req.body.ipAddress,
          port: req.body.port,
          expiresOn: new Date(req.body.expiresOn).toLocaleDateString(),
          lastConnectionDate: new Date(
            req.body.lastConnectionDate
          ).toLocaleDateString(),
        };

        await logThis(
          "INFO",
          res.locals.userId,
          res.locals.emailAddress,
          res.locals.companyUID,
          res.locals.locationUID,
          "POST /api/autoTracker/update",
          req.session.userInfo.ipAddress,
          "",
          JSON.stringify(trackerPayLoad)
        );

        db.Tracker.update(trackerPayLoad, {
          where: {
            trackerId: req.params.trackerId,
          },
        }).then((dbTracker) => {
          res.json(dbTracker);
        });
      } catch (errors) {
        res.json(errors);
      }
    }
  );

  app.post(
    "/api/autoTracker/:customerId",
    authenticate,
    [
      check("imei")
        .not()
        .isEmpty()
        .escape()
        .withMessage("IMEI is required"),
      check("gpsDevice")
        .not()
        .isEmpty()
        .escape()
        .withMessage("GPS Device is required"),
      check("simCardNumber")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Sim Card Number is required"),
      check("licensePlateNumber")
        .not()
        .isEmpty()
        .escape()
        .withMessage("License Plate Number is required"),
      check("ipAddress")
        .not()
        .isEmpty()
        .escape()
        .withMessage("IP Address is required"),
      check("port")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Port is required"),
      check("protocol")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Protocol is required"),
      check("netProtocol")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Net Protocol is required"),
      check("expiresOn")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Expiration Date is required"),
      check("lastConnectionDate")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Last Connection Date is required"),
    ],
    async (req, res) => {
      try {
        let trackerPayLoad = {
          customerId: req.body.customerId,
          vehicleYear: req.body.vehicleYear,
          vehicleMake: req.body.vehicleMake,
          vehicleModel: req.body.vehicleModel,
          licensePlateNumber: req.body.licensePlateNumber,
          imei: req.body.imei,
          simCardNumber: req.body.simCardNumber,
          gpsDevice: req.body.gpsDevice,
          protocol: req.body.protocol,
          netProtocol: req.body.netProtocol,
          ipAddress: req.body.ipAddress,
          port: req.body.port,
          expiresOn: new Date(req.body.expiresOn).toLocaleDateString(),
          lastConnectionDate: new Date(
            req.body.lastConnectionDate
          ).toLocaleDateString(),
        };

        db.Tracker.create(trackerPayLoad).then((dbTracker) => {
          res.json(dbTracker);
        });
      } catch (errors) {
        await logThis(
          "ERROR",
          res.locals.userId,
          res.locals.emailAddress,
          res.locals.companyUID,
          res.locals.locationUID,
          "/api/autoTracker/newAutoTracker POST",
          "",
          "Api call failed",
          errors.message
        );
        res.json(errors);
      }
    }
  );

  app.post(
    "/api/expense",
    authenticate,
    [
      check("item")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Item is required"),
      check("expenseCategory")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Category is required"),
      check("expenseAmount")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Amount is required"),
    ],
    async (req, res) => {
      try {
        let newExpenseData = {
          item: req.body.item,
          expenseAmount: req.body.expenseAmount,
          expenseCategory: req.body.expenseCategory,
          notes: req.body.notes,
          expenseDate: new Date(req.body.expenseDate).toLocaleDateString(),
        };

        await logThis(
          "INFO",
          res.locals.userId,
          res.locals.emailAddress,
          res.locals.companyUID,
          res.locals.locationUID,
          "POST /api/expense",
          req.session.userInfo.ipAddress,
          "",
          JSON.stringify(newExpenseData)
        );

        db.Expense.create(newExpenseData).then((dbExpense) => {
          res.json(dbExpense);
        });
      } catch (errors) {
        await logThis(
          "ERROR",
          res.locals.userId,
          res.locals.emailAddress,
          res.locals.companyUID,
          res.locals.locationUID,
          "/api/expense POST",
          "",
          "Api call failed",
          errors.message
        );
        res.json(errors);
      }
    }
  );

  app.get("/api/expense/:expenseId", async (req, res) => {
    try {
      await logThis(
        "INFO",
        res.locals.userId,
        res.locals.emailAddress,
        res.locals.companyUID,
        res.locals.locationUID,
        "GET /api/expense/" + req.params.expenseId,
        req.session.userInfo.ipAddress,
        "",
        ""
      );

      db.Expense.findByPk(req.params.expenseId).then((dbExpense) => {
        return res.json(dbExpense);
      });
    } catch (errors) {
      await logThis(
        "ERROR",
        res.locals.userId,
        res.locals.emailAddress,
        res.locals.companyUID,
        res.locals.locationUID,
        "GET /api/expense" + req.params.expenseId,
        "",
        "Api call failed",
        errors.message
      );
      res.json(errors.message);
    }
  });

  app.get("/api/expense", authenticate, async (req, res) => {
    try {
      await logThis(
        "INFO",
        res.locals.userId,
        res.locals.emailAddress,
        res.locals.companyUID,
        res.locals.locationUID,
        "GET /api/expense/",
        req.session.userInfo.ipAddress,
        "",
        ""
      );

      db.Expense.findAll({}).then((dbExpense) => {
        res.json(dbExpense);
      });
    } catch (errors) {
      await logThis(
        "ERROR",
        res.locals.userId,
        res.locals.emailAddress,
        res.locals.companyUID,
        res.locals.locationUID,
        "GET /api/expense",
        "",
        "Api call failed",
        errors.message
      );
      res.json(errors);
    }
  });

  app.put(
    "/api/expense/:expenseId",
    authenticate,
    [
      check("item")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Item is required"),
      check("expenseCategory")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Category is required"),
      check("expenseAmount")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Amount is required"),
    ],
    async (req, res) => {
      try {
        await logThis(
          "INFO",
          res.locals.userId,
          res.locals.emailAddress,
          res.locals.companyUID,
          res.locals.locationUID,
          "PUT /api/expense/" + req.params.expenseId,
          req.session.userInfo.ipAddress,
          "API call to update expense " +
            req.body.item +
            "with iD " +
            req.params.expenseId,
          ""
        );

        let expenseData = {
          item: req.body.item,
          expenseAmount: req.body.expenseAmount,
          expenseCategory: req.body.expenseCategory,
          notes: req.body.notes,
          expenseDate: new Date(req.body.expenseDate).toLocaleDateString(),
        };

        let exp = await db.Expense.findByPk(req.params.expenseId);

        if (exp) {
          db.Expense.update(expenseData, {
            where: {
              expenseId: req.params.expenseId,
            },
          }).then((dbExpense) => {
            res.json(dbExpense);
          });
        }
      } catch (errors) {
        await logThis(
          "ERROR",
          res.locals.userId,
          res.locals.emailAddress,
          res.locals.companyUID,
          res.locals.locationUID,
          "PUT /api/expense/" + req.params.expenseId,
          "",
          "UPDATE Api call failed",
          errors.message
        );
        res.json(errors);
      }
    }
  );

  app.post("/api/expense/:expenseId", authenticate, async (req, res) => {
    try {
      await logThis(
        "INFO",
        res.locals.userId,
        res.locals.emailAddress,
        res.locals.companyUID,
        res.locals.locationUID,
        "/api/expense/" + req.params.expenseId,
        req.session.userInfo.ipAddress,
        "Delete Expense Id " + req.params.expenseId,
        ""
      );

      db.Expense.destroy({
        where: {
          expenseId: req.params.expenseId,
        },
      }).then((dbExpense) => {
        res.json(dbExpense);
      });
    } catch (errors) {
      await logThis(
        "ERROR",
        res.locals.userId,
        res.locals.emailAddress,
        res.locals.companyUID,
        res.locals.locationUID,
        "DELETE /api/expense" + req.params.expenseId,
        "",
        "Api call failed",
        errors.message
      );
      res.json(errors);
    }
  });

  app.get("/api/clearlogs", (req, res) => {
    db.Log.destroy({
      where: {},
    }).then((dbLog) => {
      res.json("Logs has been cleared");
    });
  });

  app.get("/api/getlogs/:searchParam?/:searchValue?", (req, res) => {
    if (
      req.params.searchParam !== undefined &&
      req.params.searchValue !== undefined
    ) {
      const queryParams = {};
      queryParams[req.params.searchParam] = req.params.searchValue;
      db.Log.findAll({
        where: queryParams,
      }).then((dbLog) => {
        res.json(dbLog);
      });
      return;
    } else {
      db.Log.findAll().then((dbLog) => {
        res.json(dbLog);
      });
      return;
    }
  });

  //TWILIO ENDPOINTS
  app.post("/api/sendSms", (req, res) => {
    const body = req.body.body;
    client.messages
      .create({
        messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
        body: body,
        to: process.env.TO_SMS_NUMBER,
      })
      .then((message) => {
        const task = cron.schedule("2 * * * * *", () => {
          client
            .messages(message.sid)
            .fetch()
            .then((message) => {
              if (message.status === "delivered") {
                task.stop();
              }
            });
          //console.log("Task is running every 2 seconds " + new Date());
        });
        res.json(message);
      });
  });

  app.get("/api/getMessages", (req, res) => {
    client.messages.list({ limit: 20 }).then((messages) => res.json(messages));
  });

  app.get("/api/getMessage/:messageId", (req, res) => {
    client
      .messages(req.params.messageId)
      .fetch()
      .then((message) => res.json(message));
  });

  app.get("/api/harvestData0", async (req, resp) => {
    const options = {
      protocol: "https:",
      hostname: "api.harvestapp.com",
      path: `/v2/time_entries?page=1`,
      headers: {
        "User-Agent": "Node.js Harvest API Sample",
        Authorization: "Bearer " + process.env.HARVEST_ACCESS_TOKEN,
        "Harvest-Account-ID": process.env.HARVEST_ACCOUNT_ID,
      },
    };

    https
      .get(options, (res) => {
        const { statusCode } = res;

        if (statusCode !== 200) {
          console.error(`Request failed with status: ${statusCode}`);
          return;
        }

        res.setEncoding("utf8");
        let rawData = "";
        res.on("data", (chunk) => {
          rawData += chunk;
        });

        res.on("end", () => {
          try {
            let data = [{ response: {} }];
            let clientNames = new Set();
            const parsedData = JSON.parse(rawData);

            for (var j = 0; j < parsedData.time_entries.length; j++) {
              let employeeData = {};

              if (clientNames.has(parsedData.time_entries[j].client.name)) {
                data[0].response[
                  parsedData.time_entries[j].client.name
                ].clientBillableHours += parsedData.time_entries[j].hours;

                data[0].response[
                  parsedData.time_entries[j].client.name
                ].billableAmount +=
                  parsedData.time_entries[j].hours *
                  parsedData.time_entries[j].billable_rate;
              }

              if (
                clientNames.has(parsedData.time_entries[j].client.name) &&
                data[0].response[
                  parsedData.time_entries[j].client.name
                ].hasOwnProperty(parsedData.time_entries[j].user.id)
              ) {
                data[0].response[parsedData.time_entries[j].client.name][
                  parsedData.time_entries[j].user.id
                ].hours += parsedData.time_entries[j].hours;

                if (employeeData.billableRate == null) {
                  employeeData.billableRate =
                    parsedData.time_entries[j].billable_rate;
                }
              } else {
                employeeData.hours = parsedData.time_entries[j].hours;

                employeeData.name = parsedData.time_entries[j].user.name;

                employeeData.userId = parsedData.time_entries[j].user.id;

                clientNames.add(parsedData.time_entries[j].client.name);

                data[0].response[parsedData.time_entries[j].client.name] = {
                  clientBillableHours: parsedData.time_entries[j].hours,
                  billableAmount:
                    parsedData.time_entries[j].hours *
                    parsedData.time_entries[j].billable_rate,
                };
                data[0].response[parsedData.time_entries[j].client.name][
                  parsedData.time_entries[j].user.id
                ] = employeeData;
              }
            }

            resp.json(data);
          } catch (e) {
            console.error(e.message);
          }
        });
      })
      .on("error", (e) => {
        console.error(`Got error: ${e.message}`);
      });
  });

  app.get("/api/harvestData", async (req, resp) => {
    const options = {
      protocol: "https:",
      hostname: "api.harvestapp.com",
      headers: {
        "User-Agent": "Node.js Harvest API Sample",
        Authorization: "Bearer " + process.env.HARVEST_ACCESS_TOKEN,
        "Harvest-Account-ID": process.env.HARVEST_ACCOUNT_ID,
      },
    };
    var data = [];
    var completed_requests = 0;

    for (var i = 1; i < 5; i++) {
      options.path = "/v2/time_entries?page=" + i;
      https.get(options, function(res) {
        res.setEncoding("utf8");
        let rawData = "";
        res.on("data", (chunk) => {
          rawData += chunk;
        });

        res.on("end", () => {
          let parsedData = JSON.parse(rawData);

          for (var j = 0; j < parsedData.time_entries.length; j++) {
            db.TimeEntry.create({
              id: parsedData.time_entries[j].id,
              spent_date: parsedData.time_entries[j].spent_date,
              hours: parsedData.time_entries[j].hours,
              rounded_hours: parsedData.time_entries[j].rounded_hours,
              billable: parsedData.time_entries[j].billable,
              cost_rate: parsedData.time_entries[j].cost_rate,
              billable_rate: parsedData.time_entries[j].billable_rate,
              started_time: parsedData.time_entries[j].started_time,
              ended_time: parsedData.time_entries[j].ended_time,
              userId: parsedData.time_entries[j].user.id,
              user_name: parsedData.time_entries[j].user.name,
              clientId: parsedData.time_entries[j].client.id,
              client_name: parsedData.time_entries[j].client.name,
              project_id: parsedData.time_entries[j].project.id,
              project_name: parsedData.time_entries[j].project.name,
              notes: parsedData.time_entries[j].notes,
              created_at: parsedData.time_entries[j].created_at,
              updated_at: parsedData.time_entries[j].updated_at,
            });
          }

          completed_requests++;

          if (completed_requests == 4) {
            console.log(data.length);
            resp.json(data.length);
          }
        });
      });
    }
  });

  app.get("/api/harvest", async (req, resp) => {
    const options = {
      protocol: "https:",
      hostname: "api.harvestapp.com",
      headers: {
        "User-Agent": "Node.js Harvest API Sample",
        Authorization: "Bearer " + process.env.HARVEST_ACCESS_TOKEN,
        "Harvest-Account-ID": process.env.HARVEST_ACCOUNT_ID,
      },
    };

    var urls = [
      "/v2/time_entries?page=1",
      "/v2/time_entries?page=2",
      "/v2/time_entries?page=3",
      "/v2/time_entries?page=4",
      "/v2/time_entries?page=5",
    ];
    var data = [];
    var completed_requests = 0;

    for (var i = 1; i < 101; i++) {
      options.path = "/v2/time_entries?page=" + i;
      https.get(options, function(res) {
        res.setEncoding("utf8");
        let rawData = "";
        res.on("data", (chunk) => {
          rawData += chunk;
        });

        res.on("end", () => {
          let parsedData = JSON.parse(rawData);

          let k = 0;
          while (k < parsedData.time_entries.length) {
            if (isDateWithinRange(parsedData.time_entries[k].spent_date)) {
              console.log(parsedData.time_entries[k].spent_date.split("-")[1]);
              data.push(parsedData.time_entries[k]);
            }

            k++;
          }

          completed_requests++;

          if (completed_requests == 100) {
            console.log(data.length);
            resp.json(data);
          }
        });
      });
    }
  });

  app.post(
    "/api/register",
    [
      check("companyName")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Company Name is required"),
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        errors.companyName = req.body.companyName;
        errors.error = errors.errors[0].msg;
        return res.json(errors);
      }
      var companyUID = Math.floor(Math.random() * 90000) + 10000;
      let existingCompany = await db.Company.findOne({
        where: {
          companyName: req.body.companyName,
        },
      });
      if (existingCompany == null) {
        db.Company.create({
          companyName: req.body.companyName,
          companyUID: companyUID,
        }).then((dbCompany) => {
          return res.status(200).json({
            companyUID: companyUID,
            companyName: req.body.companyName,
          });
        });
      } else {
        res.status(200).json({ error: "Company already exists" });
      }
    }
  );

  app.post(
    "/api/iForgot",
    [
      check("emailAddress")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Email Address is required"),
    ],
    async (req, res) => {
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
          return res.status(400).json({
            emailAddressError: "Email not found",
          });
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
          sendEmail(
            "TrKB Financials",
            emailBody,
            subject,
            userInfo.emailAddress
          );
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
    }
  );

  app.post(
    "/api/resetPassword/:resetPasswordToken",
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
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        let errorResponse = {};
        errors.errors.map((error) => {
          errorResponse[error.param + "Error"] = error.msg;
        });

        return res.status(400).json(errorResponse);
      } else if (req.body.newPassword !== req.body.confirmPassword) {
        return res.status(400).json({ error: "Passwords dont match" });
      } else {
        db.User.findOne({
          where: {
            resetPasswordToken: req.params.resetPasswordToken,
          },
        }).then((dbUser) => {
          if (dbUser === null) {
            return res.status(400).json({
              error: "Invalid Token, Please request a new token",
            });
          }
          if (
            dbUser.dataValues.resetPasswordExpires > Date.now() &&
            crypto.timingSafeEqual(
              Buffer.from(dbUser.dataValues.resetPasswordToken),
              Buffer.from(req.params.resetPasswordToken)
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
              sendEmail(
                null,
                emailBody,
                subject,
                dbUser.dataValues.emailAddress
              );
              return res.status(200).json({
                error: "Password has been reset. You can now log in",
              });
            });
          } else {
            res.status(400).json({
              error: "Password reset token expired.",
            });
          }
        });
      }
    }
  );

  app.get("/api/options/getCalls", async (req, res) => {
    db.OptionCall.findAll().then((dbOptionCalls) => {
      res.json(dbOptionCalls);
    });
  });

  app.get("/api/options/getCallById/:callId", async (req, res) => {
    db.OptionCall.findOne(req.param.callId).then((dbOptionCall) => {
      res.json(dbOptionCall);
    });
  });

  app.get("/api/options/getCallsByTicker/:ticker", async (req, res) => {
    db.OptionCall.findAll({
      where: {
        ticker: req.params.ticker,
      },
    }).then((dbOptionCalls) => {
      res.json(dbOptionCalls);
    });
  });

  app.get(
    "/api/options/getCallsByContractSymbol/:contractSymbol",
    async (req, res) => {
      db.OptionCall.findAll({
        where: {
          contractSymbol: req.params.contractSymbol,
        },
      }).then((dbOptionCalls) => {
        res.json(dbOptionCalls);
      });
    }
  );

  //Expiration Date
  app.get("/api/options/getCallsThatExpireOn/:thisDate", async (req, res) => {
    db.OptionCall.findAll({
      where: {
        exp_date: moment.utc(req.params.thisDate, "YYYY-MM-DD"),
      },
    }).then((dbOptionCall) => {
      res.json(dbOptionCall);
    });
  });

  app.get("/api/options/getCallsExpiringBy/:thisDate", async (req, res) => {
    const ACCEPT_FORMAT = "YYYY-MM-DD";
    const start_date = Date.now;
    const end_date = req.params.thisDate;
    const start = moment.utc(start_date, ACCEPT_FORMAT);
    const end = moment.utc(end_date, ACCEPT_FORMAT);
    db.OptionCall.findAll({
      where: {
        exp_date: {
          [Op.between]: [start, end],
        },
      },
    }).then((dbOptionCalls) => {
      res.json(dbOptionCalls);
    });
  });

  app.get(
    "/api/options/getCallsExpiringBetween/:startDate/:endDate",
    async (req, res) => {
      // Date Format 2020-08-30T15:10:36.000Z
      const ACCEPT_FORMAT = "YYYY-MM-DD";
      const start_date = req.params.startDate;
      const end_date = req.params.endDate;
      const start = moment.utc(start_date, ACCEPT_FORMAT);
      const end = moment.utc(end_date, ACCEPT_FORMAT);

      db.OptionCall.findAll({
        where: {
          exp_date: {
            [Op.between]: [start, end],
          },
        },
      })
        .then((dbOptionCalls) => {
          res.json(dbOptionCalls);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  );

  // Bid
  app.get("/api/options/getCallsWithBidUnder/:thisBid", async (req, res) => {
    db.OptionCall.findAll({
      where: {
        bid: {
          [Op.lte]: req.params.thisBid,
        },
      },
    }).then((dbOptionCall) => {
      res.json(dbOptionCall);
    });
  });

  app.get("/api/options/getCallsWithBidOver/:thisBid", async (req, res) => {
    db.OptionCall.findAll({
      where: {
        bid: {
          [Op.gte]: req.params.thisBid,
        },
      },
    }).then((dbOptionCall) => {
      res.json(dbOptionCall);
    });
  });

  app.get(
    "/api/options/getCallsWithBidBetween/:thisBid/:andThatBid",
    async (req, res) => {
      db.OptionCall.findAll({
        where: {
          bid: {
            [Op.between]: [req.params.thisBid, req.params.andThatBid],
          },
        },
      }).then((dbOptionCalls) => {
        res.json(dbOptionCalls);
      });
    }
  );

  // Strike Price
  app.get(
    "/api/options/getCallsWithStrikePriceUnder/:thisStrike",
    async (req, res) => {
      db.OptionCall.findAll({
        where: {
          strike: {
            [Op.lte]: req.params.thisStrike,
          },
        },
      }).then((dbOptionCalls) => {
        res.json(dbOptionCalls);
      });
    }
  );

  app.get(
    "/api/options/getCallsWithStrikePriceOver/:thisStrike",
    async (req, res) => {
      db.OptionCall.findAll({
        where: {
          strike: {
            [Op.gte]: req.params.thisStrike,
          },
        },
      }).then((dbOptionCall) => {
        res.json(dbOptionCall);
      });
    }
  );

  app.get(
    "/api/options/getCallsWithStrikePriceBetween/:thisStrike/:andThatStrike",
    async (req, res) => {
      db.OptionCall.findAll({
        where: {
          strike: {
            [Op.between]: [req.params.thisStrike, req.params.andThatStrike],
          },
        },
      }).then((dbOptionCall) => {
        res.json(dbOptionCall);
      });
    }
  );

  // Implied Volatility
  app.get(
    "/api/options/getCallsWithImpliedVolatilityUnder/:thisImpliedVolatility",
    async (req, res) => {
      db.OptionCall.findAll({
        where: {
          impliedVolatility: {
            [Op.lte]: req.params.thisImpliedVolatility,
          },
        },
      }).then((dbOptionCalls) => {
        res.json(dbOptionCalls);
      });
    }
  );

  app.get(
    "/api/options/getCallsWithImpliedVolatilityOver/:thisImpliedVolatility",
    async (req, res) => {
      db.OptionCall.findAll({
        where: {
          impliedVolatility: {
            [Op.gte]: req.params.thisImpliedVolatility,
          },
        },
      }).then((dbOptionCall) => {
        res.json(dbOptionCall);
      });
    }
  );

  app.get(
    "/api/options/getCallsWithImpliedVolatilityBetween/:thisImpliedVolatility/:andThatImpliedVolatility",
    async (req, res) => {
      db.OptionCall.findAll({
        where: {
          impliedVolatility: {
            [Op.between]: [
              req.params.thisImpliedVolatility,
              req.params.andThatImpliedVolatility,
            ],
          },
        },
      }).then((dbOptionCall) => {
        res.json(dbOptionCall);
      });
    }
  );

  //Options Price
  app.get(
    "/api/options/getCallsWithPriceUnder/:thisPrice",
    async (req, res) => {
      db.OptionCall.findAll({
        order: [["strike", "ASC"]],
      }).then((dbTickers) => {
        res.json(
          dbTickers.filter((s) => {
            if (s.strike * 100 < req.params.thisPrice) {
              return s;
            }
          })
        );
      });
    }
  );

  app.get("/api/options/getCallsWithPriceOver/:thisPrice", async (req, res) => {
    db.OptionCall.findAll({
      order: [["strike", "ASC"]],
    }).then((dbTickers) => {
      res.json(
        dbTickers.filter((s) => {
          if (s.strike * 100 > req.params.thisPrice) {
            return s;
          }
        })
      );
    });
  });

  app.get(
    "/api/options/getCallsWithPriceBetween/:thisPrice/:andThatPrice",
    async (req, res) => {
      db.OptionCall.findAll({
        order: [["strike", "ASC"]],
      }).then((dbTickers) => {
        res.json(
          dbTickers.filter((s) => {
            if (
              s.strike >= req.params.thisPrice / 100 &&
              s.strike <= req.params.andThatPrice / 100
            ) {
              return s;
            }
          })
        );
      });
    }
  );

  app.get("/api/options/getTickers", async (req, res) => {
    db.OptionCall.findAll({
      attributes: [
        [Sequelize.fn("DISTINCT", Sequelize.col("ticker")), "ticker"],
      ],
      order: [["ticker", "ASC"]],
    }).then((dbTickers) => {
      res.json(dbTickers);
    });
  });

  // UOA Endpoint
  //Gets total volume for a Contract Symbol for a specified date
  app.get("/api/options/uoa/:date", async (req, res) => {
    db.OptionCall.findAll({
      attributes: [
        [
          Sequelize.fn("DISTINCT", Sequelize.col("contractSymbol")),
          "contractSymbol",
        ],
      ],
      where: {
        ts: {
          [Op.like]: `%${req.params.date}%`,
        },
      },
      raw: true,
    }).then(async (dbContractSymbols) => {
      let data = [];
      for (let i = 0; i < dbContractSymbols.length; i++) {
        const tv = await db.OptionCall.findAll({
          attributes: [
            [Sequelize.col("contractSymbol"), "contractSymbol"],
            [Sequelize.fn("sum", Sequelize.col("volume")), "volume"],
          ],
          where: {
            contractSymbol: dbContractSymbols[i].contractSymbol,
            ts: {
              [Op.like]: `%${req.params.date}%`,
            },
          },
          raw: true,
        });
        data.push(tv[0]);
      }
      await res.json(data);
    });
  });

  //Gets Volume for a specified contract on a specified date
  app.get(
    "/api/options/getVolumeBy/:contractSymbol/:onThisDate",
    async (req, res) => {
      db.OptionCall.findAll({
        attributes: [
          [Sequelize.col("contractSymbol"), "contractSymbol"],
          [Sequelize.fn("sum", Sequelize.col("volume")), "volume"],
        ],
        where: {
          contractSymbol: req.params.contractSymbol,
          ts: {
            [Op.like]: `%${req.params.onThisDate}%`,
          },
        },
        raw: true,
      }).then((data) => {
        if (data[0].volume === null) {
          data[0].volume = 0;
        }
        res.json(data);
      });
    }
  );
};
