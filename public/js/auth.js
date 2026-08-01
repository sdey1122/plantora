"use strict";

/* ===========================================================
   Register
=========================================================== */

(() => {
  const registerForm = document.getElementById("registerForm");

  if (!registerForm) {
    return;
  }

  /* ===========================================================
       Elements
    =========================================================== */

  const registerAlert = document.getElementById("registerAlert");

  const registerButton = document.getElementById("registerButton");
  const registerButtonText = document.getElementById("registerButtonText");
  const registerSpinner = document.getElementById("registerSpinner");

  const registerName = document.getElementById("registerName");
  const registerEmail = document.getElementById("registerEmail");
  const registerPassword = document.getElementById("registerPassword");
  const registerConfirmPassword = document.getElementById(
    "registerConfirmPassword",
  );
  const registerTerms = document.getElementById("registerTerms");

  const registerNameError = document.getElementById("registerNameError");
  const registerEmailError = document.getElementById("registerEmailError");
  const registerPasswordError = document.getElementById(
    "registerPasswordError",
  );
  const registerConfirmPasswordError = document.getElementById(
    "registerConfirmPasswordError",
  );
  const registerTermsError = document.getElementById("registerTermsError");

  const passwordStrengthBar = document.getElementById("passwordStrengthBar");
  const passwordStrengthText = document.getElementById("passwordStrengthText");

  const togglePasswordButtons = document.querySelectorAll(".toggle-password");

  /* ===========================================================
       Helpers
    =========================================================== */

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function clearErrors() {
    registerAlert.className = "alert d-none";
    registerAlert.textContent = "";

    registerNameError.textContent = "";
    registerEmailError.textContent = "";
    registerPasswordError.textContent = "";
    registerConfirmPasswordError.textContent = "";
    registerTermsError.textContent = "";
  }

  function showAlert(type, message) {
    registerAlert.className = `alert alert-${type}`;
    registerAlert.textContent = message;
  }

  function setLoading(state) {
    registerButton.disabled = state;

    registerSpinner.classList.toggle("d-none", !state);

    registerButtonText.textContent = state ? "Creating..." : "Create Account";
  }

  function isValidEmail(email) {
    return EMAIL_REGEX.test(email);
  }

  function updatePasswordStrength(password) {
    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

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

  registerName.addEventListener("input", () => {
    registerNameError.textContent = registerName.value.trim()
      ? ""
      : "Full name is required.";
  });

  registerEmail.addEventListener("input", () => {
    const email = registerEmail.value.trim();

    if (!email) {
      registerEmailError.textContent = "Email is required.";
    } else if (!isValidEmail(email)) {
      registerEmailError.textContent = "Please enter a valid email.";
    } else {
      registerEmailError.textContent = "";
    }
  });

  registerPassword.addEventListener("input", () => {
    updatePasswordStrength(registerPassword.value);

    registerPasswordError.textContent = registerPassword.value
      ? ""
      : "Password is required.";

    if (registerConfirmPassword.value) {
      registerConfirmPasswordError.textContent =
        registerPassword.value === registerConfirmPassword.value
          ? ""
          : "Passwords do not match.";
    }
  });

  registerConfirmPassword.addEventListener("input", () => {
    if (!registerConfirmPassword.value) {
      registerConfirmPasswordError.textContent =
        "Please confirm your password.";

      return;
    }

    registerConfirmPasswordError.textContent =
      registerPassword.value === registerConfirmPassword.value
        ? ""
        : "Passwords do not match.";
  });

  registerTerms.addEventListener("change", () => {
    registerTermsError.textContent = registerTerms.checked
      ? ""
      : "You must accept Terms & Conditions.";
  });

  /* ===========================================================
       Register Submit
    =========================================================== */

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    clearErrors();

    const name = registerName.value.trim();
    const email = registerEmail.value.trim().toLowerCase();
    const password = registerPassword.value;
    const confirmPassword = registerConfirmPassword.value;
    const termsAccepted = registerTerms.checked;

    let valid = true;

    if (!name) {
      registerNameError.textContent = "Full name is required.";
      valid = false;
    }

    if (!email) {
      registerEmailError.textContent = "Email is required.";
      valid = false;
    } else if (!isValidEmail(email)) {
      registerEmailError.textContent = "Please enter a valid email.";
      valid = false;
    }

    const PASSWORD_REGEX =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()[\]{}\-_=+|\\:;"'<>,./~`]).{8,}$/;

    if (!password) {
      registerPasswordError.textContent = "Password is required.";
      valid = false;
    } else if (!PASSWORD_REGEX.test(password)) {
      registerPasswordError.textContent =
        "Password must contain 9+ characters, 1 uppercase, 1 lowercase, 1 number and 1 special character.";

      valid = false;
    }

    if (!confirmPassword) {
      registerConfirmPasswordError.textContent =
        "Please confirm your password.";

      valid = false;
    } else if (password !== confirmPassword) {
      registerConfirmPasswordError.textContent = "Passwords do not match.";

      valid = false;
    }

    if (!termsAccepted) {
      registerTermsError.textContent = "You must accept Terms & Conditions.";

      valid = false;
    }

    if (!valid) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/auth/register", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword,
          termsAccepted,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        showAlert("danger", result.message || "Registration failed.");

        return;
      }

      registerForm.innerHTML = `
<div class="text-center py-4">

    <i class="bi bi-envelope-check-fill text-success display-2"></i>

    <h3 class="mt-3">
        Registration Successful
    </h3>

    <p class="text-muted">
        ${result.message}
    </p>

    <p class="text-muted">
        Verification email sent to
        <strong>${email}</strong>
    </p>

</div>
`;
    } catch (error) {
      console.error(error);

      showAlert("danger", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);

      resetStrength();
    }
  });
})();

/* ===========================================================
   Login
=========================================================== */

(() => {
  const loginForm = document.getElementById("loginForm");

  if (!loginForm) {
    return;
  }

  /* ===========================================================
       Elements
    =========================================================== */

  const loginAlert = document.getElementById("loginAlert");

  const loginButton = document.getElementById("loginButton");
  const loginButtonText = document.getElementById("loginButtonText");
  const loginSpinner = document.getElementById("loginSpinner");

  const loginEmail = document.getElementById("loginEmail");
  const loginPassword = document.getElementById("loginPassword");
  const rememberMe = document.getElementById("rememberMe");

  // Remember Me
  const remembered = JSON.parse(localStorage.getItem("rememberMe"));

  if (remembered) {
    loginEmail.value = remembered.email;
    loginPassword.value = remembered.password;
    rememberMe.checked = true;
  }

  const loginEmailError = document.getElementById("loginEmailError");
  const loginPasswordError = document.getElementById("loginPasswordError");

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* ===========================================================
       Helpers
    =========================================================== */

  function clearErrors() {
    loginAlert.className = "alert d-none";
    loginAlert.textContent = "";

    loginEmailError.textContent = "";
    loginPasswordError.textContent = "";
  }

  function showAlert(type, message) {
    loginAlert.className = `alert alert-${type}`;
    loginAlert.textContent = message;
  }

  function setLoading(state) {
    loginButton.disabled = state;

    loginSpinner.classList.toggle("d-none", !state);

    loginButtonText.textContent = state ? "Signing In..." : "Login";
  }

  function isValidEmail(email) {
    return EMAIL_REGEX.test(email);
  }

  /* ===========================================================
       Live Validation
    =========================================================== */

  loginEmail.addEventListener("input", () => {
    const email = loginEmail.value.trim();

    if (!email) {
      loginEmailError.textContent = "Email is required.";
    } else if (!isValidEmail(email)) {
      loginEmailError.textContent = "Please enter a valid email.";
    } else {
      loginEmailError.textContent = "";
    }
  });

  loginPassword.addEventListener("input", () => {
    loginPasswordError.textContent = loginPassword.value
      ? ""
      : "Password is required.";
  });

  /* ===========================================================
       Submit
    =========================================================== */

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    clearErrors();

    const email = loginEmail.value.trim().toLowerCase();

    const password = loginPassword.value;

    let valid = true;

    if (!email) {
      loginEmailError.textContent = "Email is required.";

      valid = false;
    } else if (!isValidEmail(email)) {
      loginEmailError.textContent = "Please enter a valid email.";

      valid = false;
    }

    if (!password) {
      loginPasswordError.textContent = "Password is required.";

      valid = false;
    }

    if (!valid) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/auth/login", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email,

          password,

          rememberMe: rememberMe.checked,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        showAlert("danger", result.message || "Login failed.");

        return;
      }

      if (rememberMe.checked) {
        localStorage.setItem(
          "rememberMe",
          JSON.stringify({
            email,
            password,
          }),
        );
      } else {
        localStorage.removeItem("rememberMe");
      }

      showAlert("success", result.message);

      showAlert("success", result.message);

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error(error);

      showAlert("danger", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  });
})();

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

    if (!email) {
      forgotPasswordEmailError.textContent = "Email is required.";
      return;
    }

    if (!isValidEmail(email)) {
      forgotPasswordEmailError.textContent = "Please enter a valid email.";
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
        showAlert("danger", result.message || "Request failed.");
        return;
      }

      showAlert("success", result.message);

      forgotPasswordForm.reset();
    } catch (error) {
      console.error(error);

      showAlert("danger", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  });
})();
