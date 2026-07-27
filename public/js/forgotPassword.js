"use strict";

/* ===========================================================
   Forgot Password
=========================================================== */

(() => {
  const forgotPasswordForm = document.getElementById("forgotPasswordForm");

  if (!forgotPasswordForm) {
    return;
  }

  /* ===========================================================
       Elements
    =========================================================== */

  const forgotPasswordAlert = document.getElementById("forgotPasswordAlert");

  const forgotPasswordButton = document.getElementById("forgotPasswordButton");

  const forgotPasswordButtonText = document.getElementById(
    "forgotPasswordButtonText",
  );

  const forgotPasswordSpinner = document.getElementById(
    "forgotPasswordSpinner",
  );

  const forgotPasswordEmail = document.getElementById("forgotPasswordEmail");

  const forgotPasswordEmailError = document.getElementById(
    "forgotPasswordEmailError",
  );

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* ===========================================================
       Helpers
    =========================================================== */

  function clearErrors() {
    forgotPasswordAlert.className = "alert d-none";
    forgotPasswordAlert.textContent = "";

    forgotPasswordEmailError.textContent = "";
  }

  function showAlert(type, message) {
    forgotPasswordAlert.className = `alert alert-${type}`;
    forgotPasswordAlert.textContent = message;
  }

  function setLoading(state) {
    forgotPasswordButton.disabled = state;

    forgotPasswordSpinner.classList.toggle("d-none", !state);

    forgotPasswordButtonText.textContent = state
      ? "Sending..."
      : "Send Reset Link";
  }

  function isValidEmail(email) {
    return EMAIL_REGEX.test(email);
  }

  /* ===========================================================
       Live Validation
    =========================================================== */

  forgotPasswordEmail.addEventListener("input", () => {
    const email = forgotPasswordEmail.value.trim();

    if (!email) {
      forgotPasswordEmailError.textContent = "Email is required.";
    } else if (!isValidEmail(email)) {
      forgotPasswordEmailError.textContent = "Please enter a valid email.";
    } else {
      forgotPasswordEmailError.textContent = "";
    }
  });

  /* ===========================================================
       Submit
    =========================================================== */

  forgotPasswordForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    clearErrors();

    const email = forgotPasswordEmail.value.trim().toLowerCase();

    let valid = true;

    if (!email) {
      forgotPasswordEmailError.textContent = "Email is required.";

      valid = false;
    } else if (!isValidEmail(email)) {
      forgotPasswordEmailError.textContent = "Please enter a valid email.";

      valid = false;
    }

    if (!valid) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/auth/forgot-password", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        showAlert(
          "danger",
          result.message || "Unable to process your request.",
        );

        return;
      }

      forgotPasswordForm.reset();

      showAlert("success", result.message);
    } catch (error) {
      console.error(error);

      showAlert("danger", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  });
})();
