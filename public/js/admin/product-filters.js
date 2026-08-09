document.addEventListener("DOMContentLoaded", () => {
  const forms = document.querySelectorAll(".pm-toolbar-form");

  forms.forEach((form) => {
    const searchInput = form.querySelector('input[name="search"]');

    const sortSelect = form.querySelector('select[name="sort"]');

    const limitSelect = form.querySelector('select[name="limit"]');

    /*
        ==========================================================
        BUILD URL
        ==========================================================
        */

    const applyFilters = () => {
      const url = new URL(form.getAttribute("action"), window.location.origin);

      const params = new URLSearchParams();

      /*
            ------------------------------------------------------
            SEARCH
            ------------------------------------------------------
            */

      const search = searchInput ? searchInput.value.trim() : "";

      /*
            IMPORTANT:
            Only add search when there is actually text.
            */

      if (search !== "") {
        params.set("search", search);
      }

      /*
            ------------------------------------------------------
            SORT
            ------------------------------------------------------
            */

      const sort = sortSelect ? sortSelect.value : "newest";

      switch (sort) {
        case "oldest":
          params.set("sortBy", "createdAt");
          params.set("sortOrder", "asc");

          break;

        case "az":
          params.set("sortBy", "name");
          params.set("sortOrder", "asc");

          break;

        case "za":
          params.set("sortBy", "name");
          params.set("sortOrder", "desc");

          break;

        case "newest":
        default:
          params.set("sortBy", "createdAt");
          params.set("sortOrder", "desc");

          break;
      }

      /*
            ------------------------------------------------------
            LIMIT
            ------------------------------------------------------
            */

      const limit = limitSelect ? limitSelect.value : "10";

      params.set("limit", limit);

      /*
            ------------------------------------------------------
            ALWAYS RESET TO PAGE 1
            ------------------------------------------------------
            */

      params.set("page", "1");

      /*
            ------------------------------------------------------
            NAVIGATE
            ------------------------------------------------------
            */

      url.search = params.toString();

      window.location.href = url.toString();
    };

    /*
        ==========================================================
        LIVE SEARCH
        ==========================================================
        */

    let searchTimer;

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        clearTimeout(searchTimer);

        searchTimer = setTimeout(() => {
          applyFilters();
        }, 400);
      });
    }

    /*
        ==========================================================
        SORT
        ==========================================================
        */

    if (sortSelect) {
      sortSelect.addEventListener("change", () => {
        applyFilters();
      });
    }

    /*
        ==========================================================
        SHOW LIMIT
        ==========================================================
        */

    if (limitSelect) {
      limitSelect.addEventListener("change", () => {
        applyFilters();
      });
    }

    /*
        ==========================================================
        PREVENT NORMAL FORM SUBMIT
        ==========================================================
        */

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      applyFilters();
    });
  });
});
