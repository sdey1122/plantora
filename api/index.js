const mongoose = require("mongoose");
const app = require("../src/app");

let connectionPromise = null;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is missing from Vercel environment variables.",
    );
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(process.env.MONGODB_URI)
      .catch((error) => {
        connectionPromise = null;
        throw error;
      });
  }

  await connectionPromise;
}

module.exports = async (req, res) => {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error("Plantora Vercel runtime error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
};
