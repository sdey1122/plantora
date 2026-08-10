/* ==========================================================
   PLANTORA — ORDER PAGE
========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  /* ========================================================
     STAGGER ORDER CARDS
  ======================================================== */

  const cards = document.querySelectorAll(".order-card, .order-section");

  cards.forEach((card, index) => {
    card.style.animationDelay = `${Math.min(index * 0.07, 0.5)}s`;
  });

  /* ========================================================
     COPY PAYMENT IDS
  ======================================================== */

  const paymentIds = document.querySelectorAll(".payment-id");

  paymentIds.forEach((element) => {
    element.style.cursor = "pointer";

    element.title = "Click to copy";

    element.addEventListener("click", async () => {
      const value = element.textContent.trim();

      if (!value) return;

      try {
        await navigator.clipboard.writeText(value);

        const originalText = element.textContent;

        element.textContent = "Copied!";

        element.style.color = "#2d704d";

        setTimeout(() => {
          element.textContent = originalText;
        }, 1200);
      } catch (error) {
        console.error("Unable to copy payment ID:", error);
      }
    });
  });

  /* ========================================================
     PRODUCT IMAGE FALLBACK
  ======================================================== */

  document
    .querySelectorAll(".order-item img, .order-product-image img")
    .forEach((image) => {
      image.addEventListener("error", () => {
        if (!image.src.includes("/images/placeholder-product.jpg")) {
          image.src = "/images/placeholder-product.jpg";
        }
      });
    });

  /* ========================================================
     STATUS PULSE
  ======================================================== */

  document
    .querySelectorAll(".order-status-pending, .order-status-processing")
    .forEach((status) => {
      status.animate(
        [
          {
            opacity: 1,
          },
          {
            opacity: 0.65,
          },
          {
            opacity: 1,
          },
        ],
        {
          duration: 2200,
          iterations: Infinity,
        },
      );
    });
});
