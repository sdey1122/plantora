// ======================================
// PROFILE IMAGE PREVIEW
// ======================================

const profileImageInput = document.getElementById("profileImage");
const profileImage = document.getElementById("profilePreview");

if (profileImageInput && profileImage) {
  profileImageInput.addEventListener("change", function () {
    const file = this.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (event) {
      profileImage.src = event.target.result;
    };

    reader.readAsDataURL(file);
  });
}

// ======================================
// BIO CHARACTER COUNTER
// ======================================

const bio = document.getElementById("bio");
const bioCounter = document.getElementById("bioCounter");

if (bio && bioCounter) {
  const updateCounter = () => {
    bioCounter.textContent = `${bio.value.length} / 500`;
  };

  updateCounter();

  bio.addEventListener("input", updateCounter);
}

// ======================================
// SHOW / HIDE PASSWORD
// ======================================

document.querySelectorAll(".profile-password-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.target);

    if (!input) return;

    const icon = button.querySelector("i");

    if (input.type === "password") {
      input.type = "text";
      icon.classList.replace("bi-eye", "bi-eye-slash");
    } else {
      input.type = "password";
      icon.classList.replace("bi-eye-slash", "bi-eye");
    }
  });
});

// ======================================
// PASSWORD MATCH
// ======================================

const newPassword = document.getElementById("newPassword");
const confirmPassword = document.getElementById("confirmPassword");

if (newPassword && confirmPassword) {
  const text = document.createElement("small");

  confirmPassword.closest(".col-md-6").appendChild(text);

  function checkPassword() {
    if (!confirmPassword.value) {
      text.innerHTML = "";

      return;
    }

    if (newPassword.value === confirmPassword.value) {
      text.className = "text-success";

      text.innerHTML = "Passwords match";
    } else {
      text.className = "text-danger";

      text.innerHTML = "Passwords do not match";
    }
  }

  newPassword.addEventListener("keyup", checkPassword);

  confirmPassword.addEventListener("keyup", checkPassword);
}

// ======================================
// PASSWORD STRENGTH + LIVE VALIDATION
// ======================================

const strengthProgress = document.getElementById("strengthProgress");
const strengthText = document.getElementById("strengthText");

if (newPassword && strengthProgress && strengthText) {
  const error = document.createElement("small");

  error.className = "text-danger d-block mt-2";

  newPassword.closest(".col-md-6").appendChild(error);

  newPassword.addEventListener("input", () => {
    const value = newPassword.value;

    let score = 0;

    const errors = [];

    if (value.length >= 9) score++;
    else errors.push("minimum 9 characters");

    if (/[A-Z]/.test(value)) score++;
    else errors.push("1 uppercase");

    if (/[a-z]/.test(value)) score++;
    else errors.push("1 lowercase");

    if (/\d/.test(value)) score++;
    else errors.push("1 number");

    if (/[^A-Za-z0-9]/.test(value)) score++;
    else errors.push("1 special character");

    const percent = (score / 5) * 100;

    strengthProgress.style.width = `${percent}%`;

    strengthProgress.className = "";

    if (percent <= 20) {
      strengthProgress.classList.add("strength-weak");
      strengthText.textContent = "Weak";
    } else if (percent <= 40) {
      strengthProgress.classList.add("strength-fair");
      strengthText.textContent = "Fair";
    } else if (percent <= 80) {
      strengthProgress.classList.add("strength-good");
      strengthText.textContent = "Good";
    } else {
      strengthProgress.classList.add("strength-strong");
      strengthText.textContent = "Strong";
    }

    error.textContent = errors.length
      ? `Password must contain ${errors.join(", ")}.`
      : "";
  });
}

// ======================================
// LOADING BUTTONS
// ======================================

document.querySelectorAll("form").forEach((form) => {
  form.addEventListener("submit", function () {
    const btn = this.querySelector("button[type='submit']");

    if (!btn) return;

    btn.disabled = true;

    btn.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2"></span>
            Please wait...
        `;
  });
});

// ======================================
// AUTO CLOSE ALERTS
// ======================================

document.querySelectorAll(".alert").forEach((alert) => {
  setTimeout(() => {
    alert.classList.add("fade");

    setTimeout(() => {
      alert.remove();
    }, 500);
  }, 4000);
});

// ======================================
// FADE-IN CARDS
// ======================================

document.querySelectorAll(".card").forEach((card, index) => {
  card.style.opacity = "0";

  card.style.transform = "translateY(25px)";

  setTimeout(() => {
    card.style.transition = ".5s";

    card.style.opacity = "1";

    card.style.transform = "translateY(0)";
  }, index * 120);
});

// AGE
const ageElement = document.getElementById("profileAge");

if (ageElement) {
  const createdAt = new Date(
    ageElement.dataset.createdAt || ageElement.getAttribute("data-created-at"),
  );

  if (!isNaN(createdAt)) {
    const now = new Date();

    const diffTime = now - createdAt;
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const years = Math.floor(totalDays / 365);
    const days = totalDays % 365;

    if (years > 0) {
      ageElement.textContent = `${years} year${years > 1 ? "s" : ""} ${days} day${days !== 1 ? "s" : ""}`;
    } else {
      ageElement.textContent = `${totalDays} day${totalDays !== 1 ? "s" : ""}`;
    }
  }
}
