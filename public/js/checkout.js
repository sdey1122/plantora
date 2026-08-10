document.addEventListener("DOMContentLoaded", () => {
  // ==========================================================
  // CHECKOUT PAGE
  // ==========================================================

  const checkoutForm = document.querySelector("#checkoutForm");

  if (!checkoutForm) {
    return;
  }

  // ==========================================================
  // ADDRESS SELECTION
  // ==========================================================

  const addressOptions = document.querySelectorAll(".checkout-address-option");

  addressOptions.forEach((option) => {
    const radio = option.querySelector('input[type="radio"]');

    if (!radio) {
      return;
    }

    // Initial selected state
    if (radio.checked) {
      option.classList.add("selected");
    }

    option.addEventListener("click", () => {
      addressOptions.forEach((item) => {
        item.classList.remove("selected");
      });

      radio.checked = true;

      option.classList.add("selected");
    });

    radio.addEventListener("change", () => {
      addressOptions.forEach((item) => {
        item.classList.remove("selected");
      });

      option.classList.add("selected");
    });
  });

  // ==========================================================
  // CHECKOUT FORM SUBMIT
  // ==========================================================

  checkoutForm.addEventListener("submit", (event) => {
    const selectedAddress = checkoutForm.querySelector(
      'input[name="addressId"]:checked',
    );

    if (!selectedAddress) {
      event.preventDefault();

      alert("Please select a delivery address.");

      return;
    }

    // --------------------------------------------------------
    // Prevent double submission
    // --------------------------------------------------------

    const submitButton = checkoutForm.querySelector('button[type="submit"]');

    if (submitButton) {
      submitButton.disabled = true;

      const originalText = submitButton.innerHTML;

      submitButton.innerHTML = `
        <span
          class="spinner-border spinner-border-sm me-2"
          role="status"
          aria-hidden="true"
        ></span>
        Processing...
      `;

      // ------------------------------------------------------
      // Safety fallback
      // ------------------------------------------------------

      setTimeout(() => {
        submitButton.disabled = false;

        submitButton.innerHTML = originalText;
      }, 15000);
    }
  });

  // ==========================================================
  // COUPON FORM
  // ==========================================================

  const couponForm = document.querySelector("#couponForm");

  if (couponForm) {
    couponForm.addEventListener("submit", (event) => {
      const input = couponForm.querySelector('input[name="couponCode"]');

      if (!input) {
        return;
      }

      const couponCode = input.value.trim();

      if (!couponCode) {
        event.preventDefault();

        alert("Please enter a coupon code.");

        input.focus();

        return;
      }

      input.value = couponCode.toUpperCase();

      const button = couponForm.querySelector('button[type="submit"]');

      if (button) {
        button.disabled = true;

        button.innerHTML = `
          <span
            class="spinner-border spinner-border-sm"
            role="status"
            aria-hidden="true"
          ></span>
        `;
      }
    });
  }

  // ==========================================================
  // REMOVE COUPON
  // ==========================================================

  const removeCouponForm = document.querySelector("#removeCouponForm");

  if (removeCouponForm) {
    removeCouponForm.addEventListener("submit", (event) => {
      const confirmed = window.confirm(
        "Are you sure you want to remove this coupon?",
      );

      if (!confirmed) {
        event.preventDefault();

        return;
      }

      const button = removeCouponForm.querySelector('button[type="submit"]');

      if (button) {
        button.disabled = true;

        button.innerHTML = `
          <span
            class="spinner-border spinner-border-sm"
            role="status"
            aria-hidden="true"
          ></span>
        `;
      }
    });
  }

  // ==========================================================
  // ADDRESS → ADD NEW ADDRESS
  // ==========================================================

  const addAddressButton = document.querySelector(".checkout-add-address");

  if (addAddressButton) {
    addAddressButton.addEventListener("click", () => {
      window.location.href = "/addresses/create";
    });
  }

  // ==========================================================
  // NOTES CHARACTER COUNT
  // ==========================================================

  const notesTextarea = document.querySelector('textarea[name="notes"]');

  const notesCounter = document.querySelector("#notesCounter");

  if (notesTextarea && notesCounter) {
    const updateNotesCounter = () => {
      notesCounter.textContent = `${notesTextarea.value.length}/500`;
    };

    notesTextarea.addEventListener("input", updateNotesCounter);

    updateNotesCounter();
  }

  // ==========================================================
  // ADDRESS RADIO KEYBOARD SUPPORT
  // ==========================================================

  addressOptions.forEach((option) => {
    option.setAttribute("tabindex", "0");

    option.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();

      const radio = option.querySelector('input[type="radio"]');

      if (!radio) {
        return;
      }

      addressOptions.forEach((item) => {
        item.classList.remove("selected");
      });

      radio.checked = true;

      option.classList.add("selected");
    });
  });
});
