/*
==========================================================
PLANTORA HEADER
==========================================================
*/

document.addEventListener("DOMContentLoaded", () => {
  initializeStickyHeader();
  initializeActiveNavigation();
  initializeNotificationBadge();
});

/*
==========================================================
STICKY HEADER
==========================================================
*/

function initializeStickyHeader() {
  const header = document.querySelector(".plantora-header");

  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 10) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  };

  handleScroll();

  window.addEventListener("scroll", handleScroll);
}

/*
==========================================================
ACTIVE NAVIGATION
==========================================================
*/

function initializeActiveNavigation() {
  const links = document.querySelectorAll(".header-nav a");

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
  const badge = document.querySelector(".header-badge");

  if (!badge) return;

  badge.classList.add("pulse");

  badge.addEventListener("animationend", () => {
    badge.classList.remove("pulse");
  });
}

/*
==========================================================
HELPERS
==========================================================
*/

window.PlantoraHeader = {
  refreshNotificationBadge(count) {
    const badge = document.querySelector(".header-badge");

    if (!badge) return;

    badge.textContent = count;

    badge.classList.remove("pulse");

    void badge.offsetWidth;

    badge.classList.add("pulse");
  },
};
