"use strict";

// Countdown Timer
const countdownElement = document.getElementById("countdown");

if (countdownElement) {

    let seconds = Number(countdownElement.textContent) || 5;

    const timer = setInterval(() => {

        seconds--;

        countdownElement.textContent = seconds;

        if (seconds <= 0) {

            clearInterval(timer);

            window.location.href = "/?openLogin=true";

        }

    }, 1000);

}

// Remove Query Parameters
const cleanUrl = () => {

    const url = new URL(window.location);

    url.search = "";

    window.history.replaceState({}, "", url);

};

// Clean URL after page loads
window.addEventListener("load", cleanUrl);

// Auto Focus Email Input
const emailInput = document.getElementById("email");

if (emailInput) {

    emailInput.focus();

}

// Prevent Double Form Submission
const verificationForms = document.querySelectorAll(".verification-form");

verificationForms.forEach((form) => {

    form.addEventListener("submit", () => {

        const submitButton = form.querySelector("button[type='submit']");

        if (!submitButton) return;

        submitButton.disabled = true;

        submitButton.innerHTML = `
            <span
                class="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
            ></span>
            Sending...
        `;

    });

});