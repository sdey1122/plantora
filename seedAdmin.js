// Load environment variables
require("dotenv").config();

// Import packages
const mongoose = require("mongoose");

// Import database connection
const databaseConnection = require("./app/config/database");

// Import model
const User = require("./app/models/User");

// Seed admin
const seedAdmin = async () => {
  try {
    // Connect database
    await databaseConnection();

    // Check existing admin
    const existingAdmin = await User.findOne({
      role: "admin",
    });

    if (existingAdmin) {
      console.log("Admin account already exists.");

      process.exit(0);
    }

    // Create admin
    const admin = new User({
      name: process.env.ADMIN_NAME,
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,

      role: "admin",

      status: "active",

      isEmailVerified: true,

      seller: {
        status: "none",
      },

      termsAccepted: true,

      termsAcceptedAt: new Date(),

      failedLoginAttempts: 0,

      accountLockedUntil: null,

      lockReason: "",

      lockedBy: null,

      lastLogin: null,

      lastActive: null,

      emailChangedAt: null,

      isDeleted: false,

      deletedAt: null,
    });

    await admin.save();

    console.log("Admin account created successfully.");

    process.exit(0);
  } catch (error) {
    console.error(`Failed to seed admin: ${error.message}`);

    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

// Run
seedAdmin();
