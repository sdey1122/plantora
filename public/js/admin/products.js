/* ==========================================================
   PRODUCT MANAGEMENT
========================================================== */

// document.addEventListener("DOMContentLoaded", () => {
//   initializeImagePreview();

//   initializeDeleteConfirmation();

//   initializeRestoreConfirmation();

//   initializePermanentDeleteConfirmation();

//   initializeSearchReset();

//   initializeTableRowHover();
// });

document.addEventListener("DOMContentLoaded", () => {
  initializeImagePreview();

  initializeDeleteConfirmation();

  initializeRestoreConfirmation();

  initializePermanentDeleteConfirmation();

  initializeSearchAndFilters();

  initializeTableRowHover();

  initializeImageClickPreview();

  initializeProductForm();

  initializeCopyProductId();

  initializeExistingImageRemoval();
});

/* ==========================================================
   IMAGE PREVIEW
========================================================== */
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

// /* ==========================================================
//    IMAGE PREVIEW
// ========================================================== */

// function initializeImagePreview() {
//   const input = document.getElementById("productImages");

//   const preview = document.getElementById("imagePreview");

//   if (!input || !preview) return;

//   input.addEventListener("change", function () {
//     preview.innerHTML = "";

//     const existingImages = document.querySelectorAll(
//       "[data-existing-image]",
//     ).length;

//     const files = Array.from(this.files);

//     const availableSlots = 5 - existingImages;

//     if (availableSlots <= 0) {
//       alert(
//         "This product already has 5 images. Remove an existing image before adding a new one.",
//       );

//       this.value = "";

//       updateImageSlotCounter();

//       return;
//     }

//     if (files.length > availableSlots) {
//       alert(
//         `You can add only ${availableSlots} more image${availableSlots > 1 ? "s" : ""}. Maximum is 5 images.`,
//       );

//       this.value = "";

//       return;
//     }

//     files.forEach((file) => {
//       if (!file.type.startsWith("image/")) {
//         return;
//       }

//       const reader = new FileReader();

//       reader.onload = function (event) {
//         const wrapper = document.createElement("div");

//         wrapper.className = "product-image-item";

//         wrapper.innerHTML = `

//                         <div class="product-image-preview-wrapper">

//                             <img
//                                 src="${event.target.result}"
//                                 class="product-existing-image-preview"
//                                 alt="${file.name}"
//                             >

//                         </div>

//                     `;

//         preview.appendChild(wrapper);

//         updateImageSlotCounter();
//       };

//       reader.readAsDataURL(file);
//     });
//   });
// }

/* ==========================================================
   SOFT DELETE
========================================================== */

function initializeDeleteConfirmation() {
  document.querySelectorAll(".delete-product").forEach((button) => {
    button.addEventListener("click", function (e) {
      if (!confirm("Move this product to trash?")) {
        e.preventDefault();
      }
    });
  });
}

/* ==========================================================
   RESTORE
========================================================== */

function initializeRestoreConfirmation() {
  document.querySelectorAll(".restore-product").forEach((button) => {
    button.addEventListener("click", function (e) {
      if (!confirm("Restore this product?")) {
        e.preventDefault();
      }
    });
  });
}

/* ==========================================================
   PERMANENT DELETE
========================================================== */

function initializePermanentDeleteConfirmation() {
  document.querySelectorAll(".delete-product-permanent").forEach((button) => {
    button.addEventListener("click", function (e) {
      if (!confirm("This action cannot be undone.\n\nDelete permanently?")) {
        e.preventDefault();
      }
    });
  });
}

/* ==========================================================
   SEARCH RESET
========================================================== */

function initializeSearchReset() {
  const resetButton = document.querySelector(".reset-search");

  if (!resetButton) return;

  resetButton.addEventListener("click", () => {
    const form = document.querySelector(".product-toolbar form");

    if (!form) return;

    form.reset();
  });
}

/* ==========================================================
   TABLE HOVER
========================================================== */

function initializeTableRowHover() {
  document.querySelectorAll(".admin-table tbody tr").forEach((row) => {
    row.addEventListener("mouseenter", () => {
      row.classList.add("table-active");
    });

    row.addEventListener("mouseleave", () => {
      row.classList.remove("table-active");
    });
  });
}

/* ==========================================================
   IMAGE CLICK PREVIEW
========================================================== */

document.querySelectorAll(".table-product-image").forEach((image) => {
  image.addEventListener("click", function () {
    window.open(this.src, "_blank");
  });
});

/* ==========================================================
   AUTO SUBMIT FILTERS
========================================================== */

document.querySelectorAll(".product-toolbar select").forEach((select) => {
  select.addEventListener("change", () => {
    select.form.submit();
  });
});

/* ==========================================================
   LOADING BUTTON
========================================================== */

const productForm = document.getElementById("productForm");

if (productForm) {
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
   REMOVE EXISTING PRODUCT IMAGE
========================================================== */

function initializeExistingImageRemoval() {
  document.querySelectorAll("[data-remove-image]").forEach((button) => {
    button.addEventListener("click", function () {
      const imageItems = document.querySelectorAll("[data-image-item]");

      if (imageItems.length <= 1) {
        alert("A product must have at least one image.");

        return;
      }

      const imageItem = this.closest("[data-image-item]");

      if (!imageItem) return;

      const hiddenInput = imageItem.querySelector("[data-existing-image]");

      if (hiddenInput) {
        hiddenInput.remove();
      }

      imageItem.remove();

      updateImageSlotCounter();
    });
  });
}

/* ==========================================================
   IMAGE SLOT COUNTER
========================================================== */

function updateImageSlotCounter() {
  const counter = document.getElementById("imageSlotCounter");

  if (!counter) return;

  const existingImages = document.querySelectorAll(
    "[data-existing-image]",
  ).length;

  const newImages = document.querySelectorAll(
    "#imagePreview .product-image-item",
  ).length;

  const total = existingImages + newImages;

  counter.textContent = `${total}/5`;
}
