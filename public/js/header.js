/*
==========================================================
PLANTORA HEADER
==========================================================
*/

let socket = null;
let notificationsLoaded = false;

document.addEventListener("DOMContentLoaded", () => {
  initializeStickyHeader();
  initializeActiveNavigation();
  initializeNotificationBadge();
  initializeNotificationsDropdown();
  initializeNotificationSocket();
});

/*
==========================================================
STICKY HEADER
==========================================================
*/

function initializeStickyHeader() {
  const header = document.querySelector(".plantora-header");

  if (!header) return;

  const onScroll = () => {
    header.classList.toggle("scrolled", window.scrollY > 10);
  };

  onScroll();

  window.addEventListener("scroll", onScroll);
}

/*
==========================================================
ACTIVE NAVIGATION
==========================================================
*/

function initializeActiveNavigation() {
  const links = document.querySelectorAll(".header-nav a");

  if (!links.length) return;

  links.forEach((link) => {
    link.addEventListener("click", () => {
      links.forEach((item) => item.classList.remove("active"));

      link.classList.add("active");
    });
  });
}

/*
==========================================================
NOTIFICATION BADGE
==========================================================
*/

function initializeNotificationBadge() {
  const badge = document.getElementById("notificationBadge");

  if (!badge) return;

  badge.classList.add("pulse");

  badge.addEventListener("animationend", () => {
    badge.classList.remove("pulse");
  });
}

function getOrCreateNotificationBadge() {
  let badge = document.getElementById("notificationBadge");

  if (badge) {
    return badge;
  }

  const button = document.getElementById("notificationDropdownButton");

  if (!button) return null;

  badge = document.createElement("span");

  badge.id = "notificationBadge";
  badge.className = "header-badge";
  badge.textContent = "1";

  button.appendChild(badge);

  return badge;
}

function refreshNotificationBadge(count) {
  const badge = getOrCreateNotificationBadge();

  if (!badge) return;

  if (count <= 0) {
    badge.style.display = "none";
    return;
  }

  badge.style.display = "flex";
  badge.textContent = count;

  badge.classList.remove("pulse");
  void badge.offsetWidth;
  badge.classList.add("pulse");
}

function incrementNotificationBadge() {
  const badge = getOrCreateNotificationBadge();

  if (!badge) return;

  let count = Number(badge.textContent || 0);

  refreshNotificationBadge(count + 1);
}

/*
==========================================================
NOTIFICATION DROPDOWN
==========================================================
*/

function initializeNotificationsDropdown() {
  const dropdownButton = document.getElementById("notificationDropdownButton");

  if (!dropdownButton) return;

  dropdownButton.addEventListener("shown.bs.dropdown", loadNotifications);

  const markAllButton = document.getElementById("markAllNotificationsRead");

  if (markAllButton) {
    markAllButton.addEventListener("click", markAllNotificationsRead);
  }
}

async function loadNotifications(force = false) {
  if (notificationsLoaded && !force) {
    return;
  }

  const container = document.getElementById("notificationList");

  if (!container) return;

  container.innerHTML = `
<div class="text-center py-4">

    <div
        class="spinner-border spinner-border-sm text-success"
        role="status"
    ></div>

</div>
`;

  try {
    const response = await fetch("/notifications/latest");

    const data = await response.json();

    if (!data.success) {
      container.innerHTML = `
<div class="text-center py-4 text-danger">

Unable to load notifications.

</div>
`;

      return;
    }

    notificationsLoaded = true;

    if (!data.notifications.length) {
      container.innerHTML = `
<div class="text-center py-4 text-muted">

No notifications yet.

</div>
`;

      return;
    }

    container.innerHTML = "";

    data.notifications.forEach((notification) => {
      container.appendChild(createNotificationElement(notification));
    });
  } catch (error) {
    container.innerHTML = `
<div class="text-center py-4 text-danger">

Failed to load notifications.

</div>
`;
  }
}

/*
==========================================================
SOCKET.IO
==========================================================
*/

function initializeNotificationSocket() {
  const token = getCookie("accessToken");

  if (!token) return;

  socket = io({
    auth: {
      token,
    },
  });

  window.socket = socket;

  socket.on("notification", (notification) => {
    incrementNotificationBadge();

    prependNotification(notification);

    playNotificationSound();

    if (typeof showToast === "function") {
      showToast("success", notification.message);
    }
  });
}

/*
==========================================================
NOTIFICATION ELEMENT
==========================================================
*/

function createNotificationElement(notification) {
  const item = document.createElement("div");

  item.className = `notification-item ${notification.isRead ? "" : "unread"}`;

  item.dataset.id = notification._id;

  item.innerHTML = `
<a
    href="#"
    class="notification-link text-decoration-none text-dark d-block"
    data-id="${notification._id}"
    data-url="${notification.actionUrl || "/"}"
>

    <strong>

        ${notification.title}

    </strong>

    <p class="mb-1">

        ${notification.message}

    </p>

    <small class="text-muted">

        ${new Date(notification.createdAt).toLocaleString()}

    </small>

</a>
`;

  return item;
}

/*
==========================================================
PREPEND NOTIFICATION
==========================================================
*/

function prependNotification(notification) {
  const container = document.getElementById("notificationList");

  if (!container) return;

  const loading = container.querySelector(".spinner-border");

  if (loading) {
    container.innerHTML = "";
  }

  if (container.querySelector(`[data-id="${notification._id}"]`)) {
    return;
  }

  const empty = container.querySelector(".text-muted");

  if (empty && empty.textContent.includes("No notifications")) {
    container.innerHTML = "";
  }

  container.prepend(createNotificationElement(notification));

  while (container.children.length > 10) {
    container.lastElementChild.remove();
  }
}

/*
==========================================================
MARK ALL READ
==========================================================
*/

async function markAllNotificationsRead(event) {
  event.preventDefault();

  try {
    const response = await fetch("/notifications/read-all?_method=PATCH", {
      method: "POST",
    });

    const data = await response.json();

    if (!data.success) {
      if (typeof showToast === "function") {
        showToast("error", data.message);
      }

      return;
    }

    notificationsLoaded = false;

    refreshNotificationBadge(0);

    document.querySelectorAll(".notification-item").forEach((item) => {
      item.classList.remove("unread");
    });

    if (typeof showToast === "function") {
      showToast("success", data.message);
    }
  } catch (error) {
    if (typeof showToast === "function") {
      showToast("error", "Failed to update notifications.");
    }
  }
}

/*
==========================================================
NOTIFICATION SOUND
==========================================================
*/

function playNotificationSound() {
  const audio = new Audio("/audio/notification.mp3");

  audio.volume = 0.35;

  audio.play().catch(() => {});
}

/*
==========================================================
COOKIE
==========================================================
*/

function getCookie(name) {
  const value = `; ${document.cookie}`;

  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    return parts.pop().split(";").shift();
  }

  return null;
}

/*
==========================================================
GLOBAL METHODS
==========================================================
*/

window.PlantoraHeader = {
  socket() {
    return socket;
  },

  reloadNotifications() {
    notificationsLoaded = false;

    return loadNotifications(true);
  },

  incrementBadge() {
    incrementNotificationBadge();
  },

  refreshBadge(count) {
    refreshNotificationBadge(count);
  },

  prepend(notification) {
    prependNotification(notification);
  },
};

/*
==========================================================
CLICK NOTIFICATION
==========================================================
*/

document.addEventListener("click", async (event) => {
  const link = event.target.closest(".notification-link");

  if (!link) return;

  const card = link.closest(".notification-item");

  if (!card.classList.contains("unread")) {
    return;
  }

  event.preventDefault();

  const notificationId = link.dataset.id;

  try {
    const response = await fetch(
      `/notifications/${notificationId}/read?_method=PATCH`,
      {
        method: "POST",
      },
    );

    const data = await response.json();

    if (data.success) {
      const badge = document.getElementById("notificationBadge");

      if (badge) {
        const count = Math.max(0, Number(badge.textContent || 0) - 1);
        refreshNotificationBadge(count);
      }

      const card = link.closest(".notification-item");

      if (card) {
        card.classList.remove("unread");
        link.style.pointerEvents = "none";
      }
    }
  } catch (error) {}
});
