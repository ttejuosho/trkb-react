const finRecController = require("../controllers/finrec_controller.js");
const { check } = require("express-validator");
const Security = require("../services/security/security.js");

module.exports = function (app) {
  app.get("/api/health", finRecController.CheckApi);
  app.get("/", Security.isLoggedIn, finRecController.GetHomePage);
  app.get(
    "/transaction/library",
    Security.isLoggedIn,
    finRecController.GetTransactionLibrary
  );
  app.get(
    "/transaction/locations",
    Security.isLoggedIn,
    finRecController.GetTransactionsPage
  );

  app.get(
    "/transaction/new/:transactionType",
    Security.isLoggedIn,
    finRecController.GetNewTransactionForm
  );

  app.get(
    "/transaction/new",
    Security.isLoggedIn,
    finRecController.GetNewTransactionForm
  );

  app.post(
    "/transaction/new",
    [
      check("transactionTerminal")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Please choose a transaction terminal"),
      check("transactionType")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Please choose a transaction type"),
      check("transactionAmount")
        .not()
        .isEmpty()
        .escape()
        .isNumeric()
        .withMessage("Transaction Amount Error"),
      check("transactionCharge")
        .not()
        .isEmpty()
        .escape()
        .isNumeric()
        .withMessage("Transaction Charge Error"),
      check("posCharge")
        .not()
        .isEmpty()
        .isNumeric()
        .escape()
        .withMessage("POS Charge error"),
    ],
    Security.isLoggedIn,
    finRecController.SaveNewTransaction
  );

  app.get(
    "/transaction/detail/:transactionUID",
    Security.isLoggedIn,
    finRecController.GetTransactionDetails
  );

  app.post(
    "/search",
    [
      check("searchQuery")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Enter a valid search term"),
    ],
    Security.isLoggedIn,
    finRecController.search
  );

  app.get("/profile", Security.isLoggedIn, finRecController.GetProfilePage);
  app.get("/settings", Security.isLoggedIn, finRecController.GetSettingsPage);
  app.post(
    "/updateCompanyInfo",
    [
      check("companyName")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Company name is required"),
      check("companyEmail")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Email is required"),
      check("companyAddress")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Address is required"),
      check("companyCity")
        .not()
        .isEmpty()
        .escape()
        .withMessage("City is required"),
      check("companyState")
        .not()
        .isEmpty()
        .escape()
        .withMessage("State is required"),
      check("companyPhone")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Phone number is required"),
    ],
    Security.isLoggedIn,
    finRecController.UpdateCompanyInfo
  );

  app.get(
    "/expensetracker",
    Security.isLoggedIn,
    finRecController.GetExpenseTracker
  );

  app.get(
    "/item/new",
    Security.isLoggedIn,
    finRecController.GetNewSaleRecordPage
  );

  app.post(
    "/item/new",
    [
      check("itemName")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Item name is required"),
      check("itemModel")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Item model is required"),
      check("itemCategory")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Item category is required"),
      check("brandName")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Brand name is required"),
      check("purchasePrice")
        .not()
        .isEmpty()
        .escape()
        .isNumeric()
        .withMessage("Purchase price is required"),
      check("purchaseContactMedium")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Contact medium is required"),
      check("purchaseMeetingLocation")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Meeting location is required"),
    ],
    Security.isLoggedIn,
    finRecController.SaveNewSaleItem
  );

  app.get(
    "/item/details/:itemId",
    Security.isLoggedIn,
    finRecController.GetItemDetails
  );

  app.get(
    "/item/:itemId",
    Security.isLoggedIn,
    finRecController.GetItemEditPage
  );

  app.post(
    "/item/:itemId",
    [
      check("itemName")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Item name is required"),
      check("itemModel")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Item model is required"),
      check("itemCategory")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Item category is required"),
      check("brandName")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Brand name is required"),
      check("purchasePrice")
        .not()
        .isEmpty()
        .escape()
        .isNumeric()
        .withMessage("Purchase price is required"),
      check("purchaseContactMedium")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Contact medium is required"),
      check("purchaseMeetingLocation")
        .not()
        .isEmpty()
        .escape()
        .withMessage("Meeting location is required"),
    ],
    Security.isLoggedIn,
    finRecController.SaveNewSaleItem
  );
};
