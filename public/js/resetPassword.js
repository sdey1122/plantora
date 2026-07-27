"use strict";

/* ===========================================================
   Reset Password
=========================================================== */

(() => {
  const resetPasswordForm = document.getElementById("resetPasswordForm");

  if (!resetPasswordForm) {
    return;
  }

  /* ===========================================================
       Elements
    =========================================================== */

  const resetPasswordAlert = document.getElementById("resetPasswordAlert");

  const resetPasswordButton = document.getElementById("resetPasswordButton");

  const resetPasswordButtonText = document.getElementById(
    "resetPasswordButtonText",
  );

  const resetPasswordSpinner = document.getElementById("resetPasswordSpinner");

  const password = document.getElementById("newPassword");

  const confirmPassword = document.getElementById("confirmNewPassword");

  const passwordError = document.getElementById("newPasswordError");

  const confirmPasswordError = document.getElementById(
    "confirmNewPasswordError",
  );

  const passwordStrengthBar = document.getElementById("passwordStrengthBar");

  const passwordStrengthText = document.getElementById("passwordStrengthText");

  const togglePasswordButtons = document.querySelectorAll(".toggle-password");

  const PASSWORD_REGEX =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()[\]{}\-_=+|\\:;"'<>,./~`]).{8,}$/;

  /* ===========================================================
       Helpers
    =========================================================== */

  function clearErrors() {
    resetPasswordAlert.className = "alert d-none";
    resetPasswordAlert.textContent = "";

    passwordError.textContent = "";
    confirmPasswordError.textContent = "";
  }

  function showAlert(type, message) {
    resetPasswordAlert.className = `alert alert-${type}`;
    resetPasswordAlert.textContent = message;
  }

  function setLoading(state) {
    resetPasswordButton.disabled = state;

    resetPasswordSpinner.classList.toggle("d-none", !state);

    resetPasswordButtonText.textContent = state
      ? "Resetting..."
      : "Reset Password";
  }

  function updatePasswordStrength(value) {
    let score = 0;

    if (value.length >= 8) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[a-z]/.test(value)) score++;
    if (/\d/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;

    passwordStrengthBar.className = "password-strength-bar";

    switch (score) {
      case 0:
      case 1:
        passwordStrengthBar.classList.add("weak");
        passwordStrengthText.textContent = "Weak Password";
        break;

      case 2:
      case 3:
        passwordStrengthBar.classList.add("medium");
        passwordStrengthText.textContent = "Medium Password";
        break;

      default:
        passwordStrengthBar.classList.add("strong");
        passwordStrengthText.textContent = "Strong Password";
    }
  }

  function resetStrength() {
    passwordStrengthBar.className = "password-strength-bar";
    passwordStrengthText.textContent = "Password strength";
  }

  /* ===========================================================
       Password Toggle
    =========================================================== */

  togglePasswordButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.target);

      const icon = button.querySelector("i");

      if (input.type === "password") {
        input.type = "text";
        icon.className = "bi bi-eye-slash";
      } else {
        input.type = "password";
        icon.className = "bi bi-eye";
      }
    });
  });

  /* ===========================================================
       Live Validation
    =========================================================== */

  password.addEventListener("input", () => {
    updatePasswordStrength(password.value);

    if (!password.value) {
      passwordError.textContent = "Password is required.";
    } else if (!PASSWORD_REGEX.test(password.value)) {
      passwordError.textContent =
        "Password must contain 9+ characters, 1 uppercase, 1 lowercase, 1 number and 1 special character.";
    } else {
      passwordError.textContent = "";
    }

    if (confirmPassword.value) {
      confirmPasswordError.textContent =
        password.value === confirmPassword.value
          ? ""
          : "Passwords do not match.";
    }
  });

  confirmPassword.addEventListener("input", () => {
    if (!confirmPassword.value) {
      confirmPasswordError.textContent = "Please confirm your password.";

      return;
    }

    confirmPasswordError.textContent =
      password.value === confirmPassword.value ? "" : "Passwords do not match.";
  });

  /* ===========================================================
       Submit
    =========================================================== */

  resetPasswordForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    clearErrors();

    const newPassword = password.value;
    const confirm = confirmPassword.value;

    let valid = true;

    if (!newPassword) {
      passwordError.textContent = "Password is required.";
      valid = false;
    } else if (!PASSWORD_REGEX.test(newPassword)) {
      passwordError.textContent =
        "Password must contain 9+ characters, 1 uppercase, 1 lowercase, 1 number and 1 special character.";

      valid = false;
    }

    if (!confirm) {
      confirmPasswordError.textContent = "Please confirm your password.";

      valid = false;
    } else if (newPassword !== confirm) {
      confirmPasswordError.textContent = "Passwords do not match.";

      valid = false;
    }

    if (!valid) {
      return;
    }

    setLoading(true);

    try {
      const token = window.location.pathname.split("/").pop();

      const response = await fetch(`/auth/reset-password/${token}`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          password: newPassword,
          confirmPassword: confirm,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        showAlert("danger", result.message || "Password reset failed.");

        return;
      }

      showAlert("success", result.message);

      resetPasswordForm.reset();

      resetStrength();

      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 2000);
    } catch (error) {
      console.error(error);

      showAlert("danger", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  });
})();
