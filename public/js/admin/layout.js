/*
==========================================================
PLANTORA ADMIN LAYOUT
==========================================================
*/

document.addEventListener("DOMContentLoaded", () => {
  initializeBackgroundGlow();

  initializeRippleEffect();

  initializeCardAnimation();

  initializeSidebarAnimation();

  initializeButtonHover();

  initializeNotificationBell();

  initializeCounterAnimation();
});

/*
==========================================================
BACKGROUND GLOW
==========================================================
*/

function initializeBackgroundGlow() {
  const glow = document.createElement("div");

  glow.className = "mouse-glow";

  document.body.appendChild(glow);

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;

  let currentX = mouseX;
  let currentY = mouseY;

  document.addEventListener("mousemove", (event) => {
    mouseX = event.clientX;

    mouseY = event.clientY;
  });

  function animate() {
    currentX += (mouseX - currentX) * 0.08;

    currentY += (mouseY - currentY) * 0.08;

    glow.style.transform = `translate(${currentX - 250}px, ${currentY - 250}px)`;

    requestAnimationFrame(animate);
  }

  animate();
}

/*
==========================================================
RIPPLE BUTTON
==========================================================
*/

function initializeRippleEffect() {
  document.addEventListener("click", (event) => {
    const button = event.target.closest("button, .admin-btn");

    if (!button) return;

    const ripple = document.createElement("span");

    ripple.className = "ripple";

    const rect = button.getBoundingClientRect();

    ripple.style.left = `${event.clientX - rect.left}px`;

    ripple.style.top = `${event.clientY - rect.top}px`;

    button.appendChild(ripple);

    setTimeout(() => ripple.remove(), 650);
  });
}

/*
==========================================================
CARD ANIMATION
==========================================================
*/

function initializeCardAnimation() {
  const cards = document.querySelectorAll(".admin-card,.stat-card,.table-card");

  cards.forEach((card, index) => {
    card.style.opacity = "0";

    card.style.transform = "translateY(30px)";

    setTimeout(() => {
      card.style.transition = "all .6s cubic-bezier(.22,.61,.36,1)";

      card.style.opacity = "1";

      card.style.transform = "translateY(0)";
    }, index * 120);
  });
}

/*
==========================================================
SIDEBAR ACTIVE
==========================================================
*/

function initializeSidebarAnimation() {
  const links = document.querySelectorAll(".admin-sidebar-nav a");

  links.forEach((link) => {
    link.addEventListener("mouseenter", () => {
      link.style.transform = "translateX(8px)";
    });

    link.addEventListener("mouseleave", () => {
      if (!link.classList.contains("active")) {
        link.style.transform = "";
      }
    });
  });
}

/*
==========================================================
BUTTON HOVER
==========================================================
*/

function initializeButtonHover() {
  document.querySelectorAll("button,.admin-btn").forEach((button) => {
    button.addEventListener("mouseenter", () => {
      button.style.transition = ".25s ease";
    });
  });
}

/*
==========================================================
NOTIFICATION BELL
==========================================================
*/

function initializeNotificationBell() {
  const bell = document.getElementById("notificationDropdownButton");

  if (!bell) return;

  window.animateNotificationBell = function () {
    bell.classList.remove("bell-shake");

    void bell.offsetWidth;

    bell.classList.add("bell-shake");
  };
}

/*
==========================================================
COUNTER
==========================================================
*/

function initializeCounterAnimation() {
  document.querySelectorAll("[data-counter]").forEach((counter) => {
    const target = Number(counter.dataset.counter);

    let current = 0;

    const increment = Math.ceil(target / 40);

    const timer = setInterval(() => {
      current += increment;

      if (current >= target) {
        current = target;

        clearInterval(timer);
      }

      counter.textContent = current.toLocaleString();
    }, 25);
  });
}
