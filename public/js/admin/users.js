/*
==========================================================
EDIT USER MODAL
==========================================================
*/

/*
==========================================================
EDIT USER MODAL
==========================================================
*/

function initializeEditModal() {
  const modal = document.getElementById("editUserModal");

  if (!modal) return;

  modal.addEventListener("show.bs.modal", (event) => {
    const button = event.relatedTarget;

    if (!button) return;

    const { userId, userName, userEmail, userRole, userAvatar, userCreated } =
      button.dataset;

    // Header
    document.getElementById("editUserHeading").textContent = userName;

    document.getElementById("editUserEmailHeading").textContent = userEmail;

    document.getElementById("editUserAvatar").src =
      userAvatar || document.getElementById("editUserAvatar").src;

    // Form
    document.getElementById("editUserName").value = userName;

    document.getElementById("editUserEmail").value = userEmail;

    document.getElementById("editUserRole").textContent =
      userRole.charAt(0).toUpperCase() + userRole.slice(1);

    document.getElementById("editUserCreatedAt").textContent = userCreated;

    // Badge
    const badge = document.getElementById("editUserRoleBadge");

    badge.className = "modal-role-badge";

    badge.textContent = userRole.charAt(0).toUpperCase() + userRole.slice(1);

    if (userRole === "admin") {
      badge.classList.add("role-admin");
    } else if (userRole === "seller") {
      badge.classList.add("role-seller");
    } else {
      badge.classList.add("role-customer");
    }

    // IMPORTANT
    document.getElementById("editUserForm").action =
      `/admin/users/${userId}/update`;

    console.log(document.getElementById("editUserForm").action);
  });
}

/*
==========================================================
BUTTON LOADING
==========================================================
*/

function initializeFormLoading() {
  document.querySelectorAll("form").forEach((form) => {
    form.addEventListener("submit", () => {
      const button = form.querySelector('button[type="submit"]');

      if (!button) return;

      button.disabled = true;

      button.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2"></span>
        `;
    });
  });
}

/*
==========================================================
AUTO FILTER
==========================================================
*/

function initializeAutoFilters() {
  document.querySelectorAll(".user-filter-card select").forEach((select) => {
    select.addEventListener("change", () => {
      select.form.submit();
    });
  });
}

/*
==========================================================
SEARCH DEBOUNCE
==========================================================
*/

function initializeSearch() {
  const input = document.getElementById("userSearch");

  if (!input) return;

  const rows = document.querySelectorAll(".user-row");

  input.addEventListener("input", () => {
    const keyword = input.value.trim().toLowerCase();

    rows.forEach((row) => {
      const matched =
        row.dataset.name.includes(keyword) ||
        row.dataset.email.includes(keyword) ||
        row.dataset.id.includes(keyword);

      row.style.display = matched ? "" : "none";
    });

    updateVisibleRows();
  });
}

/*
==========================================================
BOOTSTRAP TOOLTIPS
==========================================================
*/

function initializeTooltips() {
  document.querySelectorAll("[title]").forEach((element) => {
    new bootstrap.Tooltip(element);
  });
}

/*
==========================================================
TABLE HOVER
==========================================================
*/

function initializeTableHover() {
  document.querySelectorAll(".admin-table tbody tr").forEach((row) => {
    row.addEventListener("mouseenter", () => {
      row.style.transition = ".25s";

      row.style.boxShadow = "0 8px 20px rgba(46,125,50,.08)";
    });

    row.addEventListener("mouseleave", () => {
      row.style.boxShadow = "";
    });
  });
}

/*
==========================================================
COPY USER ID
==========================================================
*/

function initializeCopyUserId() {
  document.querySelectorAll(".user-id").forEach((id) => {
    id.style.cursor = "pointer";

    id.title = "Click to copy";

    id.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(id.dataset.id);

        const original = id.textContent;

        id.innerHTML = `
                <i class="bi bi-check-circle-fill me-1"></i>
                Copied
            `;

        setTimeout(() => {
          id.textContent = original;
        }, 1500);
      } catch (error) {
        console.error(error);
      }
    });
  });
}

/*
==========================================================
MODAL RESET
==========================================================
*/

/*
==========================================================
RESET EDIT MODAL
==========================================================
*/

function initializeModalReset() {
  const modal = document.getElementById("editUserModal");

  if (!modal) return;

  modal.addEventListener("hidden.bs.modal", () => {
    const form = document.getElementById("editUserForm");

    form.reset();

    form.action = "";
  });
}

/*
==========================================================
KEYBOARD SHORTCUTS
==========================================================
*/

function initializeKeyboardShortcuts() {
  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key.toLowerCase() === "f") {
      event.preventDefault();

      document.querySelector('input[name="search"]')?.focus();
    }

    if (event.key === "Escape") {
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("editUserModal"),
      );

      modal?.hide();
    }
  });
}

/*
==========================================================
ANIMATE STATISTICS
==========================================================
*/

function initializeStatisticsAnimation() {
  document.querySelectorAll(".statistics-content h3").forEach((counter) => {
    const target = Number(counter.textContent);

    let current = 0;

    const step = Math.max(1, Math.ceil(target / 30));

    const interval = setInterval(() => {
      current += step;

      if (current >= target) {
        counter.textContent = target;

        clearInterval(interval);

        return;
      }

      counter.textContent = current;
    }, 20);
  });
}

/*
==========================================================
PAGE LOADER
==========================================================
*/

window.addEventListener("load", () => {
  document.body.classList.add("page-loaded");
});

// Delete Modal
/*
==========================================================
DELETE MODAL
==========================================================
*/

function initializeDeleteModal() {
  const modal = document.getElementById("deleteUserModal");

  if (!modal) return;

  modal.addEventListener("show.bs.modal", (event) => {
    const button = event.relatedTarget;

    document.getElementById("deleteUserText").textContent =
      `Move "${button.dataset.userName}" to Trash?`;

    document.getElementById("deleteUserForm").action =
      `/admin/users/${button.dataset.userId}/delete`;
  });
}

function initializeRestoreModal() {
  const modal = document.getElementById("restoreUserModal");

  if (!modal) return;

  modal.addEventListener("show.bs.modal", (event) => {
    const btn = event.relatedTarget;

    document.getElementById("restoreUserForm").action =
      `/admin/users/${btn.dataset.userId}/restore`;

    document.getElementById("restoreUserText").textContent =
      `Restore "${btn.dataset.userName}" ?`;
  });
}

function initializePermanentDeleteModal() {
  const modal = document.getElementById("permanentDeleteModal");

  if (!modal) return;

  modal.addEventListener("show.bs.modal", (event) => {
    const btn = event.relatedTarget;

    document.getElementById("permanentDeleteForm").action =
      `/admin/users/${btn.dataset.userId}/permanent-delete`;

    document.getElementById("permanentDeleteText").textContent =
      `Delete "${btn.dataset.userName}" forever?`;
  });
}

/*
==========================================================
FRONTEND SORT
==========================================================
*/

function initializeSorting() {
  const sort = document.getElementById("userSort");

  if (!sort) return;

  const tbody = document.querySelector(".admin-table tbody");

  sort.addEventListener("change", () => {
    const rows = [...tbody.querySelectorAll(".user-row")];

    switch (sort.value) {
      case "az":
        rows.sort((a, b) => a.dataset.name.localeCompare(b.dataset.name));
        break;

      case "za":
        rows.sort((a, b) => b.dataset.name.localeCompare(a.dataset.name));
        break;

      case "oldest":
        rows.sort(
          (a, b) => Number(a.dataset.created) - Number(b.dataset.created),
        );
        break;

      default:
        rows.sort(
          (a, b) => Number(b.dataset.created) - Number(a.dataset.created),
        );
    }

    rows.forEach((row) => tbody.appendChild(row));
  });
}

/*
==========================================================
INITIALIZE
==========================================================
*/

document.addEventListener("DOMContentLoaded", () => {
  initializeEditModal();

  initializeDeleteModal();

  initializeRestoreModal();

  initializePermanentDeleteModal();

  initializeFormLoading();

  initializeSearch();

  initializeSorting();

  initializeTooltips();

  initializeTableHover();

  initializeCopyUserId();

  initializeModalReset();

  initializeKeyboardShortcuts();

  initializeStatisticsAnimation();
});
