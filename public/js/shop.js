/* ==========================================================
   SHOP
========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", (event) => {
      const interactiveElement = event.target.closest(
        "button, form, input, select, textarea",
      );

      if (interactiveElement) {
        event.stopPropagation();
      }
    });
  });
});
