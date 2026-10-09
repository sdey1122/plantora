// Import Razorpay
const Razorpay = require("razorpay");

// Create Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Export Razorpay instance
module.exports = razorpay;
