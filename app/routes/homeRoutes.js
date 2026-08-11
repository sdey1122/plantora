const express = require("express");

const HomeController = require("../controllers/HomeController");

const router = express.Router();

// Home
router.get("/", HomeController.showHomePage);

// Contact
router.get("/contact", HomeController.showContactPage);

module.exports = router;
