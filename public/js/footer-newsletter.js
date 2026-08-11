/*
============================================================
PLANTORA NEWSLETTER
============================================================
*/

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("plantoraNewsletterForm");

  const emailInput = document.getElementById("newsletterEmail");

  const submitButton = document.getElementById("newsletterSubmitButton");

  const buttonText = submitButton?.querySelector(".newsletter-button-text");

  const buttonLoading = submitButton?.querySelector(
    ".newsletter-button-loading",
  );

  const buttonArrow = submitButton?.querySelector(".newsletter-button-arrow");

  const modal = document.getElementById("newsletterSuccessModal");

  const closeButton = document.getElementById("newsletterSuccessClose");

  const overlay = document.getElementById("newsletterModalOverlay");

  // ========================================================
  // ELEMENT CHECK
  // ========================================================

  if (!form || !emailInput || !submitButton || !modal) {
    return;
  }

  // ========================================================
  // SUBMIT
  // ========================================================

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    // ----------------------------------------------------
    // NATIVE EMAIL VALIDATION
    // ----------------------------------------------------

    if (!emailInput.checkValidity()) {
      emailInput.reportValidity();

      return;
    }

    const email = emailInput.value.trim();

    if (!email) {
      emailInput.reportValidity();

      return;
    }

    // ----------------------------------------------------
    // LOADING STATE
    // ----------------------------------------------------

    setLoadingState(true);

    try {
      const response = await fetch("/newsletter/subscribe", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Accept: "application/json",
        },

        body: JSON.stringify({
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Newsletter subscription failed.");
      }

      // ------------------------------------------------
      // SUCCESS
      // ------------------------------------------------

      emailInput.value = "";

      showSuccessModal();
    } catch (error) {
      console.error("Plantora newsletter error:", error);

      /*
            --------------------------------------------------
            IMPORTANT

            No ugly error message is shown to the customer.

            The server logs the actual problem.

            The button simply returns to its normal state.
            --------------------------------------------------
            */
    } finally {
      setLoadingState(false);
    }
  });

  // ========================================================
  // LOADING STATE
  // ========================================================

  function setLoadingState(isLoading) {
    submitButton.disabled = isLoading;

    if (isLoading) {
      submitButton.classList.add("is-loading");

      if (buttonText) {
        buttonText.style.display = "none";
      }

      if (buttonArrow) {
        buttonArrow.style.display = "none";
      }

      if (buttonLoading) {
        buttonLoading.style.display = "inline-flex";
      }
    } else {
      submitButton.classList.remove("is-loading");

      if (buttonText) {
        buttonText.style.display = "inline-flex";
      }

      if (buttonArrow) {
        buttonArrow.style.display = "inline-flex";
      }

      if (buttonLoading) {
        buttonLoading.style.display = "none";
      }
    }
  }

  // ========================================================
  // SHOW SUCCESS MODAL
  // ========================================================

  function showSuccessModal() {
    modal.classList.add("show");

    modal.setAttribute("aria-hidden", "false");

    document.body.classList.add("newsletter-modal-open");
  }

  // ========================================================
  // CLOSE MODAL
  // ========================================================

  function closeSuccessModal() {
    modal.classList.remove("show");

    modal.setAttribute("aria-hidden", "true");

    document.body.classList.remove("newsletter-modal-open");
  }

  // ========================================================
  // CLOSE BUTTON
  // ========================================================

  if (closeButton) {
    closeButton.addEventListener("click", closeSuccessModal);
  }

  // ========================================================
  // OVERLAY CLICK
  // ========================================================

  if (overlay) {
    overlay.addEventListener("click", closeSuccessModal);
  }

  // ========================================================
  // ESCAPE KEY
  // ========================================================

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("show")) {
      closeSuccessModal();
    }
  });
});
