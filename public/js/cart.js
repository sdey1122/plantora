document.addEventListener("DOMContentLoaded", () => {
  // ==========================================================
  // ELEMENTS
  // ==========================================================

  const cartCards = document.querySelectorAll(".cart-product-card");

  const selectAllCheckbox = document.getElementById("select-all-cart");

  const summaryItems = document.getElementById("cart-summary-items");

  const summarySubtotal = document.getElementById("cart-summary-subtotal");

  const summaryShipping = document.getElementById("cart-summary-shipping");

  const summaryTax = document.getElementById("cart-summary-tax");

  const summaryPlatform = document.getElementById("cart-summary-platform");

  const summaryTotal = document.getElementById("cart-summary-total");

  const checkoutButton = document.getElementById("cart-checkout-btn");

  // ==========================================================
  // MODAL ELEMENTS
  // ==========================================================

  const modal = document.getElementById("cart-modal");

  const modalIcon = document.getElementById("cart-modal-icon");

  const modalTitle = document.getElementById("cart-modal-title");

  const modalMessage = document.getElementById("cart-modal-message");

  const modalCancel = document.getElementById("cart-modal-cancel");

  const modalConfirm = document.getElementById("cart-modal-confirm");

  let modalAction = null;

  // ==========================================================
  // MONEY FORMAT
  // ==========================================================

  const formatMoney = (amount) => {
    return Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // ==========================================================
  // MODAL
  // ==========================================================

  const openModal = ({
    title,
    message,
    icon = "bi-trash3",
    type = "danger",
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm = null,
  }) => {
    if (!modal) {
      return;
    }

    modalAction = onConfirm;

    // --------------------------------------------------------
    // CONTENT
    // --------------------------------------------------------

    modalTitle.textContent = title;

    modalMessage.textContent = message;

    modalConfirm.textContent = confirmText;

    modalCancel.textContent = cancelText;

    // --------------------------------------------------------
    // ICON
    // --------------------------------------------------------

    modalIcon.className = "cart-modal-icon";

    if (type === "success") {
      modalIcon.classList.add("success");
    }

    if (type === "warning") {
      modalIcon.classList.add("warning");
    }

    modalIcon.innerHTML = `<i class="bi ${icon}"></i>`;

    // --------------------------------------------------------
    // CONFIRM BUTTON
    // --------------------------------------------------------

    modalConfirm.className = "cart-modal-btn cart-modal-confirm";

    if (type === "success") {
      modalConfirm.classList.add("success");
    }

    if (type === "warning") {
      modalConfirm.classList.add("warning");
    }

    // --------------------------------------------------------
    // SHOW
    // --------------------------------------------------------

    modal.classList.add("active");

    modal.setAttribute("aria-hidden", "false");

    document.body.style.overflow = "hidden";

    // Focus confirm button

    setTimeout(() => {
      modalConfirm.focus();
    }, 50);
  };

  // ==========================================================
  // CLOSE MODAL
  // ==========================================================

  const closeModal = () => {
    if (!modal) {
      return;
    }

    modal.classList.remove("active");

    modal.setAttribute("aria-hidden", "true");

    document.body.style.overflow = "";

    modalAction = null;
  };

  // ==========================================================
  // MODAL CONFIRM
  // ==========================================================

  if (modalConfirm) {
    modalConfirm.addEventListener("click", async () => {
      if (!modalAction) {
        closeModal();

        return;
      }

      const action = modalAction;

      closeModal();

      try {
        await action();
      } catch (error) {
        console.error("Cart modal action failed:", error);
      }
    });
  }

  // ==========================================================
  // MODAL CANCEL
  // ==========================================================

  if (modalCancel) {
    modalCancel.addEventListener("click", () => {
      closeModal();
    });
  }

  // ==========================================================
  // CLICK OUTSIDE MODAL
  // ==========================================================

  if (modal) {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeModal();
      }
    });
  }

  // ==========================================================
  // ESCAPE KEY
  // ==========================================================

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal?.classList.contains("active")) {
      closeModal();
    }
  });

  // ==========================================================
  // SHOW ERROR MODAL
  // ==========================================================

  const showError = (message) => {
    openModal({
      title: "Something went wrong",
      message,
      icon: "bi-exclamation-triangle",
      type: "warning",
      confirmText: "Okay",
      cancelText: "Close",
      onConfirm: null,
    });
  };

  // ==========================================================
  // CHECKBOXES
  // ==========================================================

  const getItemCheckboxes = () => {
    return document.querySelectorAll(".cart-item-checkbox");
  };

  // ==========================================================
  // SELECTED CARDS
  // ==========================================================

  const getSelectedCards = () => {
    return Array.from(cartCards).filter((card) => {
      const checkbox = card.querySelector(".cart-item-checkbox");

      return checkbox && checkbox.checked;
    });
  };

  // ==========================================================
  // QUANTITY
  // ==========================================================

  const getQuantity = (card) => {
    const quantityElement = card.querySelector(".cart-quantity-value");

    return Number(quantityElement?.textContent?.trim() || 0);
  };

  // ==========================================================
  // SET QUANTITY
  // ==========================================================

  const setQuantity = (card, quantity) => {
    const quantityElement = card.querySelector(".cart-quantity-value");

    if (quantityElement) {
      quantityElement.textContent = quantity;
    }
  };

  // ==========================================================
  // QUANTITY BUTTONS
  // ==========================================================

  const updateQuantityButtons = (card) => {
    const quantity = getQuantity(card);

    const stock = Number(card.dataset.stock || 0);

    const minusButton = card.querySelector(".quantity-minus");

    const plusButton = card.querySelector(".quantity-plus");

    if (minusButton) {
      minusButton.disabled = quantity <= 1;
    }

    if (plusButton) {
      plusButton.disabled = stock <= 0 || quantity >= stock;
    }
  };

  // ==========================================================
  // ITEM TOTAL
  // ==========================================================

  const updateItemTotal = (card) => {
    const price = Number(card.dataset.price || 0);

    const quantity = getQuantity(card);

    const subtotal = price * quantity;

    const totalElement = card.querySelector(".cart-product-total strong");

    if (totalElement) {
      totalElement.textContent = `₹${formatMoney(subtotal)}`;
    }
  };

  // ==========================================================
  // SUMMARY
  // ==========================================================

  const calculateSummary = () => {
    const selectedCards = getSelectedCards();

    let subtotal = 0;

    let totalQuantity = 0;

    selectedCards.forEach((card) => {
      const price = Number(card.dataset.price || 0);

      const quantity = getQuantity(card);

      subtotal += price * quantity;

      totalQuantity += quantity;
    });

    subtotal = Number(subtotal.toFixed(2));

    // --------------------------------------------------------
    // SHIPPING
    // --------------------------------------------------------

    let shipping = 0;

    if (subtotal > 0 && subtotal <= 999) {
      shipping = 100;
    }

    // --------------------------------------------------------
    // GST
    // --------------------------------------------------------

    const tax = subtotal > 0 ? Number((subtotal * 0.18).toFixed(2)) : 0;

    // --------------------------------------------------------
    // PLATFORM
    // --------------------------------------------------------

    const platformFee = subtotal > 0 ? 49 : 0;

    // --------------------------------------------------------
    // TOTAL
    // --------------------------------------------------------

    const total = subtotal + shipping + tax + platformFee;

    // --------------------------------------------------------
    // UI
    // --------------------------------------------------------

    if (summaryItems) {
      summaryItems.textContent = totalQuantity;
    }

    if (summarySubtotal) {
      summarySubtotal.textContent = `₹${formatMoney(subtotal)}`;
    }

    if (summaryShipping) {
      summaryShipping.textContent =
        subtotal > 999 ? "FREE" : `₹${formatMoney(shipping)}`;
    }

    if (summaryTax) {
      summaryTax.textContent = `₹${formatMoney(tax)}`;
    }

    if (summaryPlatform) {
      summaryPlatform.textContent = `₹${formatMoney(platformFee)}`;
    }

    if (summaryTotal) {
      summaryTotal.textContent = `₹${formatMoney(total)}`;
    }

    // --------------------------------------------------------
    // CHECKOUT
    // --------------------------------------------------------

    if (checkoutButton) {
      if (selectedCards.length === 0) {
        checkoutButton.classList.add("disabled");

        checkoutButton.setAttribute("aria-disabled", "true");
      } else {
        checkoutButton.classList.remove("disabled");

        checkoutButton.removeAttribute("aria-disabled");
      }
    }

    // --------------------------------------------------------
    // CARD STATE
    // --------------------------------------------------------

    cartCards.forEach((card) => {
      const checkbox = card.querySelector(".cart-item-checkbox");

      if (checkbox?.checked) {
        card.classList.add("cart-item-selected");
      } else {
        card.classList.remove("cart-item-selected");
      }
    });

    return {
      subtotal,
      shipping,
      tax,
      platformFee,
      total,
      totalQuantity,
      selectedCount: selectedCards.length,
    };
  };

  // ==========================================================
  // TOGGLE CART ITEM
  // ==========================================================

  const toggleCartItem = async (productId, isSelected) => {
    try {
      const response = await fetch("/cart/toggle", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          productId,
          isSelected,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update cart selection.");
      }

      calculateSummary();

      updateSelectAllState();

      return true;
    } catch (error) {
      console.error("Toggle cart item failed:", error);

      showError(
        error.message || "Failed to update cart selection. Please try again.",
      );

      return false;
    }
  };

  // ==========================================================
  // INDIVIDUAL CHECKBOX
  // ==========================================================

  getItemCheckboxes().forEach((checkbox) => {
    checkbox.addEventListener("change", async () => {
      const oldState = !checkbox.checked;

      const success = await toggleCartItem(checkbox.value, checkbox.checked);

      if (!success) {
        checkbox.checked = oldState;

        calculateSummary();

        updateSelectAllState();
      }
    });
  });

  // ==========================================================
  // SELECT ALL STATE
  // ==========================================================

  const updateSelectAllState = () => {
    if (!selectAllCheckbox) {
      return;
    }

    const checkboxes = getItemCheckboxes();

    if (checkboxes.length === 0) {
      selectAllCheckbox.checked = false;

      selectAllCheckbox.indeterminate = false;

      return;
    }

    const checkedCount = document.querySelectorAll(
      ".cart-item-checkbox:checked",
    ).length;

    selectAllCheckbox.checked = checkedCount === checkboxes.length;

    selectAllCheckbox.indeterminate =
      checkedCount > 0 && checkedCount < checkboxes.length;
  };

  // ==========================================================
  // SELECT ALL
  // ==========================================================

  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener("change", async () => {
      const isSelected = selectAllCheckbox.checked;

      const checkboxes = Array.from(getItemCheckboxes());

      // ------------------------------------------------------
      // Disable select-all while processing
      // ------------------------------------------------------

      selectAllCheckbox.disabled = true;

      // ------------------------------------------------------
      // Process each checkbox
      // ------------------------------------------------------

      for (const checkbox of checkboxes) {
        // Already in desired state
        if (checkbox.checked === isSelected) {
          continue;
        }

        const previousState = checkbox.checked;

        // Update UI immediately
        checkbox.checked = isSelected;

        const success = await toggleCartItem(checkbox.value, isSelected);

        // Restore if server failed
        if (!success) {
          checkbox.checked = previousState;
        }
      }

      // ------------------------------------------------------
      // Refresh UI
      // ------------------------------------------------------

      calculateSummary();

      updateSelectAllState();

      // ------------------------------------------------------
      // Enable select-all
      // ------------------------------------------------------

      selectAllCheckbox.disabled = false;
    });
  }

  // ==========================================================
  // UPDATE QUANTITY
  // ==========================================================

  const updateQuantity = async (card, newQuantity) => {
    const productId = card.dataset.productId;

    const stock = Number(card.dataset.stock || 0);

    const oldQuantity = getQuantity(card);

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!Number.isInteger(newQuantity)) {
      return;
    }

    if (newQuantity < 1) {
      newQuantity = 1;
    }

    if (stock > 0 && newQuantity > stock) {
      newQuantity = stock;
    }

    if (stock <= 0) {
      return;
    }

    // --------------------------------------------------------
    // OPTIMISTIC UI
    // --------------------------------------------------------

    setQuantity(card, newQuantity);

    updateQuantityButtons(card);

    updateItemTotal(card);

    calculateSummary();

    // --------------------------------------------------------
    // SERVER
    // --------------------------------------------------------

    try {
      const response = await fetch("/cart/quantity", {
        method: "POST",

        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },

        body: new URLSearchParams({
          productId,
          quantity: String(newQuantity),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update quantity.");
      }

      updateQuantityButtons(card);

      updateItemTotal(card);

      calculateSummary();

      await updateCartBadge();
    } catch (error) {
      console.error("Quantity update failed:", error);

      // ------------------------------------------------------
      // RESTORE
      // ------------------------------------------------------

      setQuantity(card, oldQuantity);

      updateQuantityButtons(card);

      updateItemTotal(card);

      calculateSummary();

      showError(
        error.message || "Failed to update quantity. Please try again.",
      );
    }
  };

  // ==========================================================
  // PLUS / MINUS
  // ==========================================================

  cartCards.forEach((card) => {
    const minusButton = card.querySelector(".quantity-minus");

    const plusButton = card.querySelector(".quantity-plus");

    updateQuantityButtons(card);

    // --------------------------------------------------------
    // MINUS
    // --------------------------------------------------------

    if (minusButton) {
      minusButton.addEventListener("click", () => {
        const currentQuantity = getQuantity(card);

        if (currentQuantity <= 1) {
          return;
        }

        updateQuantity(card, currentQuantity - 1);
      });
    }

    // --------------------------------------------------------
    // PLUS
    // --------------------------------------------------------

    if (plusButton) {
      plusButton.addEventListener("click", () => {
        const currentQuantity = getQuantity(card);

        const stock = Number(card.dataset.stock || 0);

        if (stock <= 0 || currentQuantity >= stock) {
          return;
        }

        updateQuantity(card, currentQuantity + 1);
      });
    }
  });

  // ==========================================================
  // CLEAR CART
  // ==========================================================

  const clearCartForm = document.querySelector("[data-confirm-clear]");

  if (clearCartForm) {
    clearCartForm.addEventListener("submit", (event) => {
      event.preventDefault();

      openModal({
        title: "Clear Your Cart?",

        message:
          "This will remove every product currently in your cart. This action cannot be undone.",

        icon: "bi-cart-x",

        type: "danger",

        confirmText: "Yes, Clear Cart",

        cancelText: "Keep Cart",

        onConfirm: () => {
          clearCartForm.submit();
        },
      });
    });
  }

  // ==========================================================
  // REMOVE PRODUCT
  // ==========================================================

  document.querySelectorAll(".cart-remove-form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      openModal({
        title: "Remove Product?",

        message: "Are you sure you want to remove this product from your cart?",

        icon: "bi-trash3",

        type: "danger",

        confirmText: "Yes, Remove",

        cancelText: "Keep Product",

        onConfirm: () => {
          form.submit();
        },
      });
    });
  });

  // ==========================================================
  // CHECKOUT
  // ==========================================================

  if (checkoutButton) {
    checkoutButton.addEventListener("click", (event) => {
      if (getSelectedCards().length === 0) {
        event.preventDefault();

        openModal({
          title: "No Products Selected",

          message:
            "Please select at least one product before proceeding to checkout.",

          icon: "bi-bag-check",

          type: "warning",

          confirmText: "Okay",

          cancelText: "Close",

          onConfirm: null,
        });
      }
    });
  }

  // ==========================================================
  // IMAGE FALLBACK
  // ==========================================================

  document.querySelectorAll(".cart-product-img").forEach((image) => {
    image.addEventListener("error", () => {
      if (image.dataset.fallbackApplied) {
        return;
      }

      image.dataset.fallbackApplied = "true";

      image.src = "/images/placeholder-product.jpg";
    });
  });

  // ==========================================================
  // CART BADGE
  // ==========================================================

  const updateCartBadge = async () => {
    try {
      const response = await fetch("/cart/summary");

      const data = await response.json();

      if (!response.ok || !data.success) {
        return;
      }

      const totalItems = Number(data.summary.totalItems || 0);

      const cartIcon = document.querySelector(".cart-icon");

      if (!cartIcon) {
        return;
      }

      let badge = document.getElementById("cartBadge");

      if (totalItems > 0) {
        if (!badge) {
          badge = document.createElement("span");

          badge.className = "header-badge cart-badge";

          badge.id = "cartBadge";

          cartIcon.appendChild(badge);
        }

        badge.textContent = totalItems;
      } else if (badge) {
        badge.remove();
      }
    } catch (error) {
      console.error("Cart badge update failed:", error);
    }
  };

  // ==========================================================
  // INITIALIZE
  // ==========================================================

  cartCards.forEach((card) => {
    const checkbox = card.querySelector(".cart-item-checkbox");

    if (checkbox?.checked) {
      card.classList.add("cart-item-selected");
    }

    updateQuantityButtons(card);

    updateItemTotal(card);
  });

  updateSelectAllState();

  calculateSummary();

  console.log("Premium cart page initialized successfully.");
});
