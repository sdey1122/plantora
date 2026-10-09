const express = require("express");

const NewsletterController = require("../controllers/NewsletterController");

const router = express.Router();

// ==========================================================
// NEWSLETTER SUBSCRIPTION
// ==========================================================

router.post("/subscribe", NewsletterController.subscribe);

module.exports = router;
