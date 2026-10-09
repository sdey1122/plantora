const app = require("../src/app");
const connectDB = require("../src/config/database");

const handler = async (req, res) => {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error("Vercel request failed:", error);

    return res.status(500).json({
      success: false,
      message: "Server error. Check the Vercel function logs.",
    });
  }
};

module.exports = handler;
