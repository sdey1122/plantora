// ==========================================================
// PLANTORA ADDRESS
// ==========================================================

document.addEventListener("DOMContentLoaded", () => {
  // ========================================================
  // DELETE ADDRESS
  // ========================================================

  document.querySelectorAll(".delete-address-form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      const confirmed = window.confirm(
        "Are you sure you want to delete this address?",
      );

      if (!confirmed) {
        event.preventDefault();
      }
    });
  });

  // ========================================================
  // PERMANENT DELETE
  // ========================================================

  document.querySelectorAll(".permanent-delete-form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      const confirmed = window.confirm(
        "This will permanently delete the address. This action cannot be undone. Continue?",
      );

      if (!confirmed) {
        event.preventDefault();
      }
    });
  });

  // ========================================================
  // PHONE NUMBER
  // ========================================================

  const phoneInputs = document.querySelectorAll('input[type="tel"]');

  phoneInputs.forEach((input) => {
    input.addEventListener("input", () => {
      input.value = input.value.replace(/[^0-9+\-\s]/g, "");
    });
  });

  // ========================================================
  // POSTAL CODE
  // ========================================================

  const postalCode = document.querySelector("#postalCode");

  if (postalCode) {
    postalCode.addEventListener("input", () => {
      postalCode.value = postalCode.value.replace(/[^a-zA-Z0-9\s-]/g, "");
    });
  }
});
