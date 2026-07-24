const { getIO } = require("./socket");

// Emit event to all customers
const emitToCustomers = (event, data) => {
  try {
    const io = getIO();

    io.to("customers").emit(event, data);
  } catch (error) {
    throw error;
  }
};

module.exports = emitToCustomers;
