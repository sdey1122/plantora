// Import model
const AuditLog = require("../models/AuditLog");

// Import logger
const logger = require("../config/logger");

// Import user-agent parser
const { UAParser } = require("ua-parser-js");

// Create audit log
const createAuditLog = async ({
  req = null,
  actor = null,

  module,

  action,

  severity = "info",

  target = {},

  description = "",

  statusCode = null,

  responseTime = null,
}) => {
  try {
    let browser = "Unknown";
    let operatingSystem = "Unknown";
    let device = "Desktop";
    let userAgent = "";

    if (req) {
      userAgent = req.get("user-agent") || "";

      const parser = new UAParser(userAgent);

      const result = parser.getResult();

      browser = result.browser.name || "Unknown";

      operatingSystem = result.os.version
        ? `${result.os.name} ${result.os.version}`
        : result.os.name || "Unknown";

      device = result.device.type || "Desktop";
    }

    await AuditLog.create({
      actor: {
        user: actor?._id || null,
        name: actor?.name || "Unknown",
        email: actor?.email || "",
        role: actor?.role || "customer",
      },

      module,

      action,

      severity,

      target: {
        model: target.model || "",
        id: target.id || null,
        name: target.name || "",
      },

      description,

      request: {
        ipAddress: req?.ip || req?.socket?.remoteAddress || "",

        method: req?.method || "",

        path: req?.originalUrl || "",

        browser,

        operatingSystem,

        device,

        userAgent,

        statusCode,

        responseTime,
      },
    });
  } catch (error) {
    logger.error(`Failed to create audit log: ${error.message}`);
  }
};

// Export utility
module.exports = createAuditLog;
