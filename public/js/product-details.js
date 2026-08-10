document.addEventListener("DOMContentLoaded", () => {
  // ==========================================================
  // PRODUCT IMAGE GALLERY
  // ==========================================================

  const mainImage = document.getElementById("product-main-image");

  const thumbnails = document.querySelectorAll(".product-thumbnail");

  if (mainImage && thumbnails.length > 0) {
    thumbnails.forEach((thumbnail) => {
      thumbnail.addEventListener("click", () => {
        const imageUrl = thumbnail.dataset.image;

        const imageAlt = thumbnail.dataset.imageAlt || mainImage.alt;

        if (!imageUrl) {
          return;
        }

        if (mainImage.src === imageUrl) {
          return;
        }

        mainImage.classList.add("changing");

        setTimeout(() => {
          mainImage.src = imageUrl;

          mainImage.alt = imageAlt;

          mainImage.classList.remove("changing");
        }, 150);

        thumbnails.forEach((item) => {
          item.classList.remove("active");

          item.setAttribute("aria-selected", "false");
        });

        thumbnail.classList.add("active");

        thumbnail.setAttribute("aria-selected", "true");
      });
    });
  }

  // ==========================================================
  // IMAGE LIGHTBOX
  // ==========================================================

  if (mainImage) {
    mainImage.addEventListener("click", () => {
      const imageUrl = mainImage.src;

      if (!imageUrl) {
        return;
      }

      const lightbox = document.createElement("div");

      lightbox.className = "product-image-lightbox";

      lightbox.innerHTML = `
        <button
          type="button"
          class="product-image-lightbox-close"
          aria-label="Close image"
        >
          &times;
        </button>

        <img
          src="${imageUrl}"
          alt="${mainImage.alt || "Product image"}"
          class="product-image-lightbox-image"
        />
      `;

      document.body.appendChild(lightbox);

      document.body.classList.add("image-lightbox-open");

      const closeButton = lightbox.querySelector(
        ".product-image-lightbox-close",
      );

      const escapeHandler = (event) => {
        if (event.key === "Escape") {
          closeLightbox();
        }
      };

      const closeLightbox = () => {
        lightbox.classList.remove("active");

        document.body.classList.remove("image-lightbox-open");

        document.removeEventListener("keydown", escapeHandler);

        setTimeout(() => {
          lightbox.remove();
        }, 200);
      };

      closeButton.addEventListener("click", (event) => {
        event.stopPropagation();

        closeLightbox();
      });

      lightbox.addEventListener("click", (event) => {
        if (event.target === lightbox) {
          closeLightbox();
        }
      });

      document.addEventListener("keydown", escapeHandler);

      requestAnimationFrame(() => {
        lightbox.classList.add("active");
      });
    });

    // Image fallback

    mainImage.addEventListener("error", () => {
      if (mainImage.dataset.fallbackApplied) {
        return;
      }

      mainImage.dataset.fallbackApplied = "true";

      mainImage.src = "/images/placeholder-product.jpg";
    });
  }

  // ==========================================================
  // CART QUANTITY
  // ==========================================================

  const cartSection = document.querySelector(".product-details-cart-section");

  if (cartSection) {
    const minusButton = cartSection.querySelector(".quantity-minus");

    const plusButton = cartSection.querySelector(".quantity-plus");

    const quantityValue = cartSection.querySelector(".quantity-value");

    const cartQuantityInput = cartSection.querySelector(
      ".product-details-cart-quantity-input",
    );

    const stock = Number(cartSection.dataset.stock || 0);

    let quantity = Number(quantityValue?.dataset.quantity || 1);

    if (!Number.isInteger(quantity) || quantity < 1) {
      quantity = 1;
    }

    const updateQuantityUI = () => {
      if (stock <= 0) {
        quantity = 0;
      } else {
        quantity = Math.max(1, Math.min(quantity, stock));
      }

      if (quantityValue) {
        quantityValue.textContent = quantity;

        quantityValue.dataset.quantity = quantity;
      }

      if (cartQuantityInput) {
        cartQuantityInput.value = quantity;
      }

      if (minusButton) {
        minusButton.disabled = quantity <= 1;
      }

      if (plusButton) {
        plusButton.disabled = quantity >= stock;
      }
    };

    if (minusButton) {
      minusButton.addEventListener("click", () => {
        if (quantity <= 1) {
          return;
        }

        quantity -= 1;

        updateQuantityUI();
      });
    }

    if (plusButton) {
      plusButton.addEventListener("click", () => {
        if (quantity >= stock) {
          return;
        }

        quantity += 1;

        updateQuantityUI();
      });
    }

    updateQuantityUI();
  }

  // ==========================================================
  // ADD TO CART VALIDATION
  // ==========================================================

  const addToCartForm = document.querySelector(
    ".product-details-add-cart-form",
  );

  if (addToCartForm) {
    addToCartForm.addEventListener("submit", (event) => {
      const quantityInput = addToCartForm.querySelector(
        ".product-details-cart-quantity-input",
      );

      if (!quantityInput) {
        return;
      }

      const quantity = Number(quantityInput.value);

      if (!Number.isInteger(quantity) || quantity < 1) {
        event.preventDefault();

        quantityInput.value = 1;
      }
    });
  }

  // ==========================================================
  // RATING BARS
  // ==========================================================

  const ratingBars = document.querySelectorAll(".review-rating-bar-fill");

  ratingBars.forEach((bar) => {
    const percentage = Number(bar.dataset.percentage || 0);

    const safePercentage = Math.max(0, Math.min(percentage, 100));

    requestAnimationFrame(() => {
      bar.style.width = `${safePercentage}%`;
    });
  });

  // ==========================================================
  // REVIEW IMAGE FALLBACK
  // ==========================================================

  const reviewImages = document.querySelectorAll(".customer-review-images img");

  reviewImages.forEach((image) => {
    image.addEventListener("error", () => {
      image.style.display = "none";
    });
  });

  // ==========================================================
  // THUMBNAIL IMAGE FALLBACK
  // ==========================================================

  thumbnails.forEach((thumbnail) => {
    const image = thumbnail.querySelector("img");

    if (!image) {
      return;
    }

    image.addEventListener("error", () => {
      thumbnail.style.display = "none";
    });
  });

  // ==========================================================
  // REVIEW LINK
  // ==========================================================

  const reviewLink = document.querySelector('a[href="#product-reviews"]');

  const reviewSection = document.getElementById("product-reviews");

  if (reviewLink && reviewSection) {
    reviewLink.addEventListener("click", (event) => {
      event.preventDefault();

      reviewSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  // ==========================================================
  // WRITE REVIEW FORM
  // ==========================================================

  const reviewForm = document.getElementById("write-review-form");

  if (reviewForm) {
    // ========================================================
    // STAR RATING
    // ========================================================

    const ratingContainer = reviewForm.querySelector(".review-rating-input");

    const ratingStars = reviewForm.querySelectorAll(".review-star");

    const ratingText = document.getElementById("review-rating-text");

    const ratingLabels = {
      1: "Poor",
      2: "Fair",
      3: "Good",
      4: "Very Good",
      5: "Excellent",
    };

    let selectedRating = 0;

    const updateReviewStars = (rating) => {
      ratingStars.forEach((star) => {
        const starRating = Number(star.dataset.rating || 0);

        star.classList.toggle("selected", starRating <= rating);
      });
    };

    // ========================================================
    // HOVER
    // ========================================================

    ratingStars.forEach((star) => {
      star.addEventListener("mouseenter", () => {
        const hoverRating = Number(star.dataset.rating || 0);

        ratingStars.forEach((item) => {
          const itemRating = Number(item.dataset.rating || 0);

          item.classList.toggle("hovered", itemRating <= hoverRating);
        });

        if (ratingText) {
          ratingText.textContent = ratingLabels[hoverRating];
        }
      });

      // ====================================================
      // CLICK
      // ====================================================

      star.addEventListener("click", () => {
        const rating = Number(star.dataset.rating || 0);

        selectedRating = rating;

        const radio = star.querySelector('input[type="radio"]');

        if (radio) {
          radio.checked = true;
        }

        updateReviewStars(selectedRating);

        if (ratingText) {
          ratingText.textContent = ratingLabels[selectedRating];

          ratingText.classList.add("selected");
        }
      });
    });

    // ========================================================
    // REMOVE HOVER
    // ========================================================

    if (ratingContainer) {
      ratingContainer.addEventListener("mouseleave", () => {
        ratingStars.forEach((star) => {
          star.classList.remove("hovered");
        });

        updateReviewStars(selectedRating);

        if (ratingText) {
          ratingText.textContent =
            selectedRating > 0
              ? ratingLabels[selectedRating]
              : "Select a rating";
        }
      });
    }

    // ========================================================
    // TITLE COUNTER
    // ========================================================

    const reviewTitle = document.getElementById("reviewTitle");

    const titleCount = document.getElementById("review-title-count");

    if (reviewTitle && titleCount) {
      const updateTitleCount = () => {
        titleCount.textContent = `${reviewTitle.value.length} / 120`;
      };

      reviewTitle.addEventListener("input", updateTitleCount);

      updateTitleCount();
    }

    // ========================================================
    // COMMENT COUNTER
    // ========================================================

    const comment = document.getElementById("comment");

    const commentCount = document.getElementById("review-comment-count");

    if (comment && commentCount) {
      const updateCommentCount = () => {
        commentCount.textContent = `${comment.value.length} / 2000`;
      };

      comment.addEventListener("input", updateCommentCount);

      updateCommentCount();
    }

    // ========================================================
    // FORM SUBMIT
    // ========================================================

    reviewForm.addEventListener("submit", (event) => {
      const checkedRating = reviewForm.querySelector(
        'input[name="rating"]:checked',
      );

      const commentValue = comment?.value.trim() || "";

      // Rating

      if (!checkedRating) {
        event.preventDefault();

        if (ratingText) {
          ratingText.textContent = "Please select a rating";

          ratingText.classList.add("selected");
        }

        ratingContainer?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        return;
      }

      // Comment

      if (!commentValue) {
        event.preventDefault();

        comment?.focus();

        return;
      }

      // Submitting state

      const submitButton = reviewForm.querySelector(".write-review-submit");

      if (submitButton) {
        submitButton.disabled = true;

        submitButton.classList.add("is-submitting");

        const submitText = submitButton.querySelector(".submit-text");

        if (submitText) {
          submitText.textContent = "Submitting...";
        }

        const icon = submitButton.querySelector("i");

        if (icon) {
          icon.className = "bi bi-arrow-repeat";
        }
      }
    });
  }

  // ==========================================================
  // CONSOLE
  // ==========================================================

  console.log("Product details page initialized successfully.");
});
