/*
============================================================
PLANTORA CONTACT ROUTES
============================================================
*/

const express = require("express");

const ContactController = require("../controllers/ContactController");

const router = express.Router();

// ==========================================================
// CONTACT PAGE
// ==========================================================

router.get("/", ContactController.showContactPage);

// ==========================================================
// SEND CONTACT MESSAGE
// ==========================================================

router.post("/send", ContactController.sendContactMessage);

// ==========================================================
// EXPORT
// ==========================================================

module.exports = router;
