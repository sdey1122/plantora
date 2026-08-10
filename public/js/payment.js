document.addEventListener("DOMContentLoaded", () => {
  // ==========================================================
  // PAYMENT DATA
  // ==========================================================

  if (!window.PAYMENT_DATA) {
    console.error("Payment data not found.");
    return;
  }

  const { keyId, amount, currency, razorpayOrderId, paymentId, orderNumber } =
    window.PAYMENT_DATA;

  // ==========================================================
  // PAY BUTTON
  // ==========================================================

  const payButton = document.getElementById("pay-now-btn");

  const buttonText = document.querySelector(".payment-pay-btn-text");

  const loader = document.getElementById("payment-loader");

  if (!payButton) {
    console.error("Pay button not found.");
    return;
  }

  // ==========================================================
  // RESET BUTTON
  // ==========================================================

  const resetPaymentButton = () => {
    payButton.disabled = false;

    if (buttonText) {
      buttonText.style.display = "inline-flex";
    }

    if (loader) {
      loader.style.display = "none";
    }
  };

  // ==========================================================
  // PAY NOW
  // ==========================================================

  payButton.addEventListener("click", () => {
    // --------------------------------------------------------
    // Prevent double click
    // --------------------------------------------------------

    if (payButton.disabled) {
      return;
    }

    // --------------------------------------------------------
    // Razorpay SDK check
    // --------------------------------------------------------

    if (typeof Razorpay === "undefined") {
      console.error("Razorpay SDK not loaded.");

      alert("Razorpay failed to load. Please refresh the page.");

      return;
    }

    // --------------------------------------------------------
    // Validate payment data
    // --------------------------------------------------------

    if (!keyId || !amount || !currency || !razorpayOrderId || !paymentId) {
      console.error("Invalid payment data:", window.PAYMENT_DATA);

      alert("Payment information is incomplete.");

      return;
    }

    // --------------------------------------------------------
    // Convert amount to paise
    // --------------------------------------------------------

    const razorpayAmount = Math.round(Number(amount) * 100);

    if (!Number.isInteger(razorpayAmount) || razorpayAmount <= 0) {
      console.error("Invalid Razorpay amount:", amount);

      alert("Invalid payment amount.");

      return;
    }

    // --------------------------------------------------------
    // Loading state
    // --------------------------------------------------------

    payButton.disabled = true;

    if (buttonText) {
      buttonText.style.display = "none";
    }

    if (loader) {
      loader.style.display = "inline-flex";
    }

    // ========================================================
    // RAZORPAY OPTIONS
    // ========================================================

    const options = {
      key: keyId,

      amount: razorpayAmount,

      currency: currency,

      order_id: razorpayOrderId,

      name: "Plantora",

      description: `Payment for Order ${orderNumber}`,

      theme: {
        color: "#198754",
      },

      // ======================================================
      // PAYMENT SUCCESS
      // ======================================================

      handler: async function (response) {
        try {
          console.log("Razorpay payment response:", response);

          const verificationResponse = await fetch("/payment/verify", {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,

              razorpay_payment_id: response.razorpay_payment_id,

              razorpay_signature: response.razorpay_signature,

              paymentId: paymentId,
            }),
          });

          const result = await verificationResponse.json();

          console.log("Payment verification response:", result);

          // --------------------------------------------------
          // Success
          // --------------------------------------------------

          if (verificationResponse.ok && result.success) {
            window.location.href = result.redirectUrl;

            return;
          }

          throw new Error(result.message || "Payment verification failed.");
        } catch (error) {
          console.error("Payment verification error:", error);

          alert(
            error.message ||
              "Payment verification failed. Please contact support.",
          );

          resetPaymentButton();
        }
      },

      // ======================================================
      // MODAL CLOSED
      // ======================================================

      modal: {
        ondismiss: function () {
          console.log("Razorpay payment window closed.");

          resetPaymentButton();
        },
      },

      // ======================================================
      // PREFILL
      // ======================================================

      prefill: {
        name: "",
        email: "",
        contact: "",
      },

      // ======================================================
      // NOTES
      // ======================================================

      notes: {
        orderNumber: orderNumber,
      },
    };

    // ========================================================
    // CREATE RAZORPAY INSTANCE
    // ========================================================

    const razorpayCheckout = new Razorpay(options);

    // ========================================================
    // PAYMENT FAILED
    // ========================================================

    razorpayCheckout.on("payment.failed", function (response) {
      console.error("Razorpay payment failed:", response.error);

      alert(response.error?.description || "Payment failed. Please try again.");

      resetPaymentButton();
    });

    // ========================================================
    // OPEN RAZORPAY
    // ========================================================

    razorpayCheckout.open();
  });

  console.log("Payment page initialized successfully.");
});
