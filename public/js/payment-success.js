document.addEventListener("DOMContentLoaded", () => {
  // ==========================================================
  // SUCCESS CHECK ANIMATION
  // ==========================================================

  const successCheck = document.querySelector(".success-check");

  if (successCheck) {
    successCheck.addEventListener("animationend", () => {
      successCheck.classList.add("completed");
    });
  }

  // ==========================================================
  // CONFETTI
  // ==========================================================

  createConfetti();

  // ==========================================================
  // BUTTON CLICK FEEDBACK
  // ==========================================================

  const buttons = document.querySelectorAll(
    ".success-primary-button, .success-secondary-button",
  );

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      button.classList.add("clicked");
    });
  });
});

// ==========================================================
// CONFETTI FUNCTION
// ==========================================================

function createConfetti() {
  const container = document.querySelector(".payment-success-page");

  if (!container) return;

  const pieces = 45;

  for (let i = 0; i < pieces; i++) {
    const confetti = document.createElement("span");

    confetti.className = "success-confetti";

    confetti.style.left = `${Math.random() * 100}%`;

    confetti.style.animationDelay = `${Math.random() * 1.5}s`;

    confetti.style.animationDuration = `${2.5 + Math.random() * 2}s`;

    confetti.style.transform = `rotate(${Math.random() * 360}deg)`;

    const size = 5 + Math.random() * 6;

    confetti.style.width = `${size}px`;

    confetti.style.height = `${size}px`;

    container.appendChild(confetti);

    setTimeout(() => {
      confetti.remove();
    }, 5000);
  }
}
