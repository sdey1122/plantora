/* ==========================================================
   PRODUCT MANAGEMENT
========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initializeImagePreview();

  initializeRestoreConfirmation();

  initializePermanentDeleteConfirmation();

  initializeSearchAndFilters();

  initializeTableRowHover();

  initializeImageClickPreview();

  initializeProductForm();

  initializeCopyProductId();
});

// /* ==========================================================
//    IMAGE PREVIEW
// ========================================================== */

// function initializeImagePreview() {
//   const input = document.getElementById("productImages");

//   const preview = document.getElementById("imagePreview");

//   if (!input || !preview) return;

//   input.addEventListener("change", function () {
//     preview.innerHTML = "";

//     const files = Array.from(this.files);

//     if (!files.length) return;

//     files.forEach((file) => {
//       if (!file.type.startsWith("image/")) {
//         return;
//       }

//       const reader = new FileReader();

//       reader.onload = function (event) {
//         const wrapper = document.createElement("div");

//         wrapper.className = "product-image-item";

//         wrapper.innerHTML = `
//                     <img
//                         src="${event.target.result}"
//                         class="img-fluid rounded shadow-sm"
//                         alt="${file.name}"
//                     >
//                 `;

//         preview.appendChild(wrapper);
//       };

//       reader.readAsDataURL(file);
//     });
//   });
// }

/* ==========================================================
   SWEET TOAST
========================================================== */

function showProductToast(icon, title, timer = 3000) {
  if (typeof Swal === "undefined") {
    console.error("SweetAlert2 is not loaded.");
    return;
  }

  Swal.fire({
    toast: true,
    position: "top-end",
    icon,
    title,
    showConfirmButton: false,
    timer,
    timerProgressBar: true,
  });
}

/* ==========================================================
   IMAGE PREVIEW + REMOVE NEW IMAGES
========================================================== */

function initializeImagePreview() {
  const input = document.getElementById("productImages");
  const preview = document.getElementById("imagePreview");

  if (!input || !preview) {
    return;
  }

  /*
   * Prevent duplicate event listeners.
   */

  if (input.dataset.imagePreviewInitialized === "true") {
    return;
  }

  input.dataset.imagePreviewInitialized = "true";

  /*
   * Keep the selected files in memory.
   *
   * This allows us to remove individual files
   * before the form is submitted.
   */

  let selectedFiles = [];

  /* ======================================================
       GET EXISTING IMAGE COUNT
    ====================================================== */

  function getExistingImageCount() {
    /*
     * Edit page:
     * Existing images have data-existing-image.
     *
     * Create page:
     * There are no existing images.
     */

    return document.querySelectorAll("[data-existing-image]").length;
  }

  /* ======================================================
       UPDATE COUNTER
    ====================================================== */

  function updateCounter() {
    const counter = document.getElementById("imageSlotCounter");

    if (!counter) {
      return;
    }

    const existingCount = getExistingImageCount();

    const newCount = selectedFiles.length;

    const total = existingCount + newCount;

    counter.textContent = `${total}/5`;

    /*
     * Change appearance when maximum is reached.
     */

    counter.classList.toggle("pm-image-limit-reached", total >= 5);
  }

  /* ======================================================
       REBUILD FILE INPUT
    ====================================================== */

  function rebuildFileInput() {
    const dataTransfer = new DataTransfer();

    selectedFiles.forEach((file) => {
      dataTransfer.items.add(file);
    });

    input.files = dataTransfer.files;
  }

  /* ======================================================
       RENDER NEW IMAGE PREVIEWS
    ====================================================== */

  function renderPreviews() {
    /*
     * Remove only NEW image previews.
     *
     * Existing product images are in a
     * different container.
     */

    preview.replaceChildren();

    selectedFiles.forEach((file, index) => {
      const reader = new FileReader();

      reader.onload = function (event) {
        const wrapper = document.createElement("div");

        wrapper.className = "product-image-item";

        wrapper.dataset.newImagePreview = "true";

        wrapper.innerHTML = `

                    <div class="pm-edit-image-card pm-new-image-card">

                        <div class="pm-edit-image-container">

                            <img
                                src="${event.target.result}"
                                alt="${file.name}"
                                class="pm-edit-image"
                            >

                        </div>


                        <div class="pm-edit-image-footer">

                            <span class="pm-edit-image-number">

                                <i class="bi bi-cloud-arrow-up"></i>

                                New Image

                            </span>


                            <button
                                type="button"
                                class="pm-new-image-remove"
                                data-new-image-index="${index}"
                                title="Remove image"
                            >

                                <i class="bi bi-trash3"></i>

                                Remove

                            </button>

                        </div>

                    </div>

                `;

        preview.appendChild(wrapper);
      };

      reader.readAsDataURL(file);
    });

    updateCounter();
  }

  /* ======================================================
       IMAGE INPUT CHANGE
    ====================================================== */

  input.addEventListener("change", function () {
    const newlySelectedFiles = Array.from(this.files || []).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (!newlySelectedFiles.length) {
      return;
    }

    /*
     * Existing images + currently selected new images.
     */

    const existingCount = getExistingImageCount();

    const totalAfterSelection =
      existingCount + selectedFiles.length + newlySelectedFiles.length;

    /*
     * Maximum 5 images.
     */

    if (totalAfterSelection > 5) {
      const availableSlots = 5 - existingCount - selectedFiles.length;

      showProductToast(
        "error",
        availableSlots > 0
          ? `You can add only ${availableSlots} more image${availableSlots === 1 ? "" : "s"}.`
          : "Maximum 5 images allowed.",
      );

      /*
       * Restore the actual input
       * to the files we already accepted.
       */

      rebuildFileInput();

      return;
    }

    /*
     * Add new files to our array.
     */

    selectedFiles.push(...newlySelectedFiles);

    /*
     * Rebuild input so it contains
     * exactly our selected files.
     */

    rebuildFileInput();

    /*
     * Render previews.
     */

    renderPreviews();
  });

  /* ======================================================
       REMOVE NEW IMAGE
    ====================================================== */

  preview.addEventListener("click", function (event) {
    const removeButton = event.target.closest("[data-new-image-index]");

    if (!removeButton) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const index = Number(removeButton.dataset.newImageIndex);

    if (Number.isNaN(index) || index < 0 || index >= selectedFiles.length) {
      return;
    }

    /*
     * Remove the file from our array.
     */

    selectedFiles.splice(index, 1);

    /*
     * IMPORTANT:
     *
     * Removing the preview alone does NOT remove
     * the file from input.files.
     *
     * So rebuild the FileList.
     */

    rebuildFileInput();

    /*
     * Render remaining images.
     */

    renderPreviews();

    showProductToast("success", "Image removed.");
  });

  /*
   * Initial counter.
   */

  updateCounter();
}

/* ==========================================================
   RESTORE
========================================================== */

function initializeRestoreConfirmation() {
  document.querySelectorAll(".restore-product").forEach((button) => {
    button.addEventListener("click", function (event) {
      if (!confirm("Restore this product?")) {
        event.preventDefault();
      }
    });
  });
}

/* ==========================================================
   PERMANENT DELETE
========================================================== */

function initializePermanentDeleteConfirmation() {
  document.querySelectorAll(".delete-product-permanent").forEach((button) => {
    button.addEventListener("click", function (event) {
      if (!confirm("This action cannot be undone.\n\nDelete permanently?")) {
        event.preventDefault();
      }
    });
  });
}

/* ==========================================================
   SEARCH / FILTER / SORT
========================================================== */

function initializeSearchAndFilters() {
  const toolbar = document.querySelector(".pm-toolbar");

  if (!toolbar) return;

  const form = toolbar.querySelector("form");

  if (!form) return;

  /* ------------------------------------------------------
       SEARCH
    ------------------------------------------------------ */

  const searchInput = form.querySelector('input[name="search"]');

  if (searchInput) {
    searchInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();

        form.submit();
      }
    });
  }

  /* ------------------------------------------------------
       SORT BY
    ------------------------------------------------------ */

  const sortBy = form.querySelector('select[name="sortBy"]');

  if (sortBy) {
    sortBy.addEventListener("change", function () {
      form.submit();
    });
  }

  /* ------------------------------------------------------
       SORT ORDER
    ------------------------------------------------------ */

  const sortOrder = form.querySelector('select[name="sortOrder"]');

  if (sortOrder) {
    sortOrder.addEventListener("change", function () {
      form.submit();
    });
  }

  /* ------------------------------------------------------
       FILTERS
    ------------------------------------------------------ */

  const filterNames = [
    "category",
    "brand",
    "status",
    "approvalStatus",
    "isFeatured",
    "minPrice",
    "maxPrice",
  ];

  filterNames.forEach((name) => {
    const field = form.querySelector(`[name="${name}"]`);

    if (!field) return;

    field.addEventListener("change", function () {
      form.submit();
    });
  });

  /* ------------------------------------------------------
       RESET
    ------------------------------------------------------ */

  const resetButton = toolbar.querySelector("[data-product-reset]");

  if (resetButton) {
    resetButton.addEventListener("click", function (event) {
      event.preventDefault();

      window.location.href = "/admin/products";
    });
  }
}

/* ==========================================================
   TABLE ROW HOVER
========================================================== */

function initializeTableRowHover() {
  document.querySelectorAll(".pm-product-row").forEach((row) => {
    row.addEventListener("mouseenter", () => {
      row.classList.add("pm-row-hover");
    });

    row.addEventListener("mouseleave", () => {
      row.classList.remove("pm-row-hover");
    });
  });
}

/* ==========================================================
   IMAGE CLICK PREVIEW
========================================================== */

function initializeImageClickPreview() {
  document.querySelectorAll(".pm-product-image").forEach((image) => {
    image.addEventListener("click", function () {
      if (!this.src) return;

      window.open(this.src, "_blank");
    });
  });
}

/* ==========================================================
   PRODUCT FORM LOADING
========================================================== */

function initializeProductForm() {
  const productForm =
    document.getElementById("productForm") ||
    document.getElementById("productCreateForm");

  if (!productForm) return;

  productForm.addEventListener("submit", function () {
    const submitButton = this.querySelector('button[type="submit"]');

    if (!submitButton) return;

    submitButton.disabled = true;

    submitButton.innerHTML = `
                <span class="spinner-border spinner-border-sm me-2"></span>
                Saving...
            `;
  });
}

/* ==========================================================
   COPY FULL PRODUCT ID
========================================================== */

function initializeCopyProductId() {
  document.querySelectorAll("[data-copy-product-id]").forEach((button) => {
    button.addEventListener("click", async function () {
      const productId = this.getAttribute("data-copy-product-id");

      if (!productId) return;

      try {
        await navigator.clipboard.writeText(productId);

        const originalHTML = this.innerHTML;

        this.innerHTML = `
                            <i class="bi bi-check2"></i>
                        `;

        setTimeout(() => {
          this.innerHTML = originalHTML;
        }, 1500);
      } catch (error) {
        console.error("Failed to copy product ID:", error);
      }
    });
  });
}
