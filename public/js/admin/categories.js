/*
==========================================================
CATEGORY MANAGEMENT
==========================================================
*/

document.addEventListener("DOMContentLoaded", () => {
  /*
    ==========================================================
    ELEMENTS
    ==========================================================
    */

  const searchForm = document.querySelector("form[action='/admin/categories']");

  const searchInput = document.querySelector("input[name='search']");

  const sortSelect = document.querySelector("select[name='sort']");

  const categoryForm = document.querySelector(
    "#categoryCreateForm, #categoryEditForm",
  );

  const categoryNameInput = document.querySelector("input[name='name']");

  /*
    ==========================================================
    PAGE READY
    ==========================================================
    */

  document.body.classList.add("page-loaded");

  /*
    ==========================================================
    SEARCH
    ==========================================================
    */

  if (searchInput && searchForm) {
    searchInput.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") {
        return;
      }

      event.preventDefault();

      searchInput.value = searchInput.value.trim();

      searchForm.submit();
    });

    searchInput.addEventListener("blur", () => {
      searchInput.value = searchInput.value.trim();
    });
  }

  /*
    ==========================================================
    SORT
    ==========================================================
    */

  if (sortSelect && searchForm) {
    sortSelect.addEventListener("change", () => {
      searchForm.submit();
    });
  }

  /*
    ==========================================================
    CTRL + K
    ==========================================================
    */

  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key.toLowerCase() === "k" && searchInput) {
      event.preventDefault();

      searchInput.focus();

      searchInput.select();
    }
  });

  /*
    ==========================================================
    ESC TO BLUR SEARCH
    ==========================================================
    */

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.activeElement === searchInput) {
      searchInput.blur();
    }
  });

  /*
    ==========================================================
    AUTO TRIM
    ==========================================================
    */

  if (categoryNameInput) {
    categoryNameInput.focus();

    categoryNameInput.select();

    categoryNameInput.addEventListener("blur", () => {
      categoryNameInput.value = categoryNameInput.value.trim();
    });
  }

  /*
    ==========================================================
    FORM VALIDATION
    ==========================================================
    */

  if (categoryForm) {
    let changed = false;

    categoryForm.querySelectorAll("input").forEach((input) => {
      input.addEventListener("input", () => {
        changed = true;
      });
    });

    window.addEventListener("beforeunload", (event) => {
      if (!changed) {
        return;
      }

      event.preventDefault();

      event.returnValue = "";
    });

    categoryForm.addEventListener("submit", (event) => {
      const input = categoryForm.querySelector("input[name='name']");

      const value = input.value.trim();

      if (!value) {
        event.preventDefault();

        input.focus();

        Swal.fire({
          icon: "warning",

          title: "Category Name Required",

          text: "Please enter a category name.",
        });

        return;
      }

      if (value.length < 1) {
        event.preventDefault();

        input.focus();

        Swal.fire({
          icon: "warning",

          title: "Invalid Category",

          text: "Category name must contain at least 2 characters.",
        });

        return;
      }

      input.value = value;

      changed = false;

      const submitButton = categoryForm.querySelector("button[type='submit']");

      if (submitButton) {
        submitButton.disabled = true;

        submitButton.innerHTML = `

                    <span class="spinner-border spinner-border-sm"></span>

                `;
      }
    });
  }

  /*
==========================================================
DELETE CATEGORY
==========================================================
*/

  document.querySelectorAll(".category-delete-form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const button = form.querySelector(".category-delete-btn");

      button.disabled = true;

      button.innerHTML = `
            <span class="spinner-border spinner-border-sm"></span>
        `;

      form.submit();
    });
  });

  /*
    ==========================================================
    COPY MONGODB ID
    ==========================================================
    */

  document.querySelectorAll(".copy-mongo-id").forEach((element) => {
    element.style.cursor = "pointer";

    element.title = "Click to copy Mongo ID";

    element.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(element.dataset.id);

        Swal.fire({
          toast: true,

          position: "top-end",

          icon: "success",

          title: "Mongo ID Copied",

          timer: 1200,

          showConfirmButton: false,

          timerProgressBar: true,
        });
      } catch (error) {
        console.error(error);

        Swal.fire({
          toast: true,

          position: "top-end",

          icon: "error",

          title: "Copy Failed",

          timer: 1200,

          showConfirmButton: false,
        });
      }
    });
  });

  /*
    ==========================================================
    BUTTON BLUR
    ==========================================================
    */

  document.querySelectorAll(".btn").forEach((button) => {
    button.addEventListener("mouseup", () => {
      button.blur();
    });
  });
});
