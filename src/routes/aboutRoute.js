const express = require("express");

const AboutController = require("../controllers/AboutController");

const router = express.Router();

// ==========================================================
// ABOUT PAGE
// ==========================================================

router.get("/", AboutController.showAboutPage);

// ==========================================================
// GENERATE PLANTORA QUESTIONS
// ==========================================================

router.get("/questions", AboutController.getQuestions);

// ==========================================================
// GENERATE PLANTORA AI ANSWER
// ==========================================================

router.post("/answer", AboutController.getAnswer);

module.exports = router;
