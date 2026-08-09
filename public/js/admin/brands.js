/*
==========================================================
BRAND MANAGEMENT
==========================================================
*/

document.addEventListener("DOMContentLoaded", () => {
  /*
    ==========================================================
    ELEMENTS
    ==========================================================
    */

  const searchForm = document.querySelector("form[action='/admin/brands']");

  const searchInput = document.querySelector("input[name='search']");

  const sortSelect = document.querySelector("select[name='sort']");

  const brandForm = document.querySelector("#brandCreateForm, #brandEditForm");

  const brandNameInput = document.querySelector("input[name='name']");

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

  if (brandNameInput) {
    brandNameInput.focus();

    brandNameInput.select();

    brandNameInput.addEventListener("blur", () => {
      brandNameInput.value = brandNameInput.value.trim();
    });
  }

  /*
    ==========================================================
    FORM VALIDATION
    ==========================================================
    */

  if (brandForm) {
    let changed = false;

    brandForm.querySelectorAll("input").forEach((input) => {
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

    brandForm.addEventListener("submit", (event) => {
      const input = brandForm.querySelector("input[name='name']");

      const value = input.value.trim();

      if (!value) {
        event.preventDefault();

        input.focus();

        Swal.fire({
          icon: "warning",

          title: "Brand Name Required",

          text: "Please enter a brand name.",
        });

        return;
      }

      if (value.length < 1) {
        event.preventDefault();

        input.focus();

        Swal.fire({
          icon: "warning",

          title: "Invalid Brand",

          text: "Brand name must contain at least 2 characters.",
        });

        return;
      }

      input.value = value;

      changed = false;

      const submitButton = brandForm.querySelector("button[type='submit']");

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
DELETE BRAND
==========================================================
*/

  document.querySelectorAll(".brand-delete-form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const button = form.querySelector(".brand-delete-btn");

      button.disabled = true;

      button.innerHTML = `
            <span class="spinner-border spinner-border-sm"></span>
        `;

      form.submit();
    });
  });

  /*
    ==========================================================
    COPY MONGO ID
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

          showConfirmButton: false,

          timer: 1200,

          timerProgressBar: true,
        });
      } catch (error) {
        console.error(error);

        Swal.fire({
          toast: true,

          position: "top-end",

          icon: "error",

          title: "Copy Failed",

          showConfirmButton: false,

          timer: 1200,
        });
      }
    });
  });

  /*
    ==========================================================
    REMOVE BUTTON FOCUS
    ==========================================================
    */

  document.querySelectorAll(".btn").forEach((button) => {
    button.addEventListener("mouseup", () => {
      button.blur();
    });
  });
});
