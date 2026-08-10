document.addEventListener("DOMContentLoaded", () => {
  // ==========================================================
  // WISHLIST PAGE
  // ==========================================================

  const wishlistPage = document.querySelector(".wishlist-page");

  if (!wishlistPage) return;

  // ==========================================================
  // REDUCED MOTION
  // ==========================================================

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // ==========================================================
  // CARD REVEAL
  // ==========================================================

  const cards = document.querySelectorAll(".wishlist-card");

  if (!prefersReducedMotion && cards.length > 0) {
    cards.forEach((card, index) => {
      card.style.opacity = "0";
      card.style.transform = "translateY(24px)";

      card.style.transition =
        "opacity 0.55s ease, transform 0.55s cubic-bezier(0.2, 0.7, 0.2, 1)";

      card.style.transitionDelay = `${Math.min(index * 70, 350)}ms`;

      requestAnimationFrame(() => {
        setTimeout(() => {
          card.style.opacity = "1";
          card.style.transform = "translateY(0)";
        }, 30);
      });
    });
  }

  // ==========================================================
  // IMAGE HOVER EFFECT
  // ==========================================================

  if (!prefersReducedMotion) {
    const imageWrappers = document.querySelectorAll(
      ".wishlist-card-image-wrapper",
    );

    imageWrappers.forEach((wrapper) => {
      const image = wrapper.querySelector(".wishlist-card-image");

      if (!image) return;

      wrapper.addEventListener("mousemove", (event) => {
        const rect = wrapper.getBoundingClientRect();

        const x = (event.clientX - rect.left) / rect.width;

        const y = (event.clientY - rect.top) / rect.height;

        const moveX = (x - 0.5) * 5;
        const moveY = (y - 0.5) * 5;

        image.style.transform = `scale(1.045) translate(${moveX}px, ${moveY}px)`;
      });

      wrapper.addEventListener("mouseleave", () => {
        image.style.transform = "";
      });
    });
  }

  // ==========================================================
  // REMOVE FROM WISHLIST
  // ==========================================================

  // ==========================================================
  // REMOVE FROM WISHLIST
  // ==========================================================

  const removeForms = document.querySelectorAll(".wishlist-remove-form");

  removeForms.forEach((form) => {
    form.addEventListener("submit", (event) => {
      const card = form.closest(".wishlist-card");

      if (!card) return;

      const button = form.querySelector(".wishlist-remove-btn");

      // ------------------------------------------------------
      // Reduced motion
      // ------------------------------------------------------

      if (prefersReducedMotion) {
        if (button) {
          button.disabled = true;
        }

        return;
      }

      // ------------------------------------------------------
      // Prevent immediate submission
      // ------------------------------------------------------

      event.preventDefault();

      // ------------------------------------------------------
      // Disable button
      // ------------------------------------------------------

      if (button) {
        button.disabled = true;

        button.classList.add("wishlist-remove-processing");

        button.innerHTML = `
        <i class="bi bi-hourglass-split"></i>
      `;
      }

      // ------------------------------------------------------
      // Card exit animation
      // ------------------------------------------------------

      card.style.transition =
        "opacity 0.35s ease, transform 0.35s cubic-bezier(0.2, 0.7, 0.2, 1)";

      requestAnimationFrame(() => {
        card.style.opacity = "0";

        card.style.transform = "translateY(-18px) scale(0.96)";
      });

      // ------------------------------------------------------
      // Submit after animation
      // ------------------------------------------------------

      setTimeout(() => {
        form.submit();
      }, 350);
    });
  });

  // ==========================================================
  // MOVE TO CART
  // ==========================================================

  const cartForms = document.querySelectorAll(".wishlist-cart-form");

  cartForms.forEach((form) => {
    form.addEventListener("submit", () => {
      const button = form.querySelector(".wishlist-cart-btn");

      if (!button) return;

      // Prevent accidental double submission.

      button.disabled = true;

      button.classList.add("wishlist-cart-processing");

      button.dataset.originalText = button.innerHTML;

      button.innerHTML = `
        <i class="bi bi-check2"></i>
        Moving...
      `;
    });
  });

  // ==========================================================
  // WISHLIST HEART INTRO
  // ==========================================================

  const emptyIcon = document.querySelector(".wishlist-empty-icon");

  if (emptyIcon && !prefersReducedMotion) {
    emptyIcon.animate(
      [
        {
          opacity: 0,
          transform: "scale(0.75)",
        },
        {
          opacity: 1,
          transform: "scale(1.08)",
        },
        {
          opacity: 1,
          transform: "scale(1)",
        },
      ],
      {
        duration: 700,
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
    );
  }

  // ==========================================================
  // EMPTY WISHLIST BUTTON
  // ==========================================================

  const shopButton = document.querySelector(".wishlist-shop-btn");

  if (shopButton && !prefersReducedMotion) {
    shopButton.addEventListener("mouseenter", () => {
      shopButton.animate(
        [
          {
            transform: "translateY(0)",
          },
          {
            transform: "translateY(-2px)",
          },
        ],
        {
          duration: 180,
          fill: "forwards",
        },
      );
    });
  }

  // ==========================================================
  // WISHLIST HEART ICON
  // ==========================================================

  const wishlistHeaderIcon = document.querySelector(".wishlist-icon");

  if (wishlistHeaderIcon && !prefersReducedMotion) {
    wishlistHeaderIcon.addEventListener("mouseenter", () => {
      const icon = wishlistHeaderIcon.querySelector("i");

      if (!icon) return;

      icon.animate(
        [
          {
            transform: "scale(1)",
          },
          {
            transform: "scale(1.2)",
          },
          {
            transform: "scale(1)",
          },
        ],
        {
          duration: 300,
          easing: "ease-out",
        },
      );
    });
  }

  // ==========================================================
  // PAGINATION BUTTON MICRO INTERACTION
  // ==========================================================

  const paginationButtons = document.querySelectorAll(".wishlist-page-btn");

  paginationButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (prefersReducedMotion) return;

      button.animate(
        [
          {
            transform: "scale(1)",
          },
          {
            transform: "scale(0.92)",
          },
          {
            transform: "scale(1)",
          },
        ],
        {
          duration: 180,
          easing: "ease-out",
        },
      );
    });
  });
});
