/* ==========================================================
   WHY CHOOSE
========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const section = document.querySelector(".why-section");

  if (!section) return;

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        section.classList.add("active");

        obs.unobserve(entry.target);
      });
    },
    {
      threshold: 0.25,
    },
  );

  observer.observe(section);

  /* =====================================
       IMAGE PARALLAX
    ===================================== */

  const banner = document.querySelector(".why-banner");

  if (!banner) return;

  banner.addEventListener("mousemove", (e) => {
    const rect = banner.getBoundingClientRect();

    const x = (e.clientX - rect.left) / rect.width;

    const y = (e.clientY - rect.top) / rect.height;

    const img = banner.querySelector(".why-banner-image");

    img.style.transform = `scale(1.05) translate(${(x - 0.5) * 12}px, ${(y - 0.5) * 12}px)`;
  });

  banner.addEventListener("mouseleave", () => {
    const img = banner.querySelector(".why-banner-image");

    img.style.transform = "";
  });
});
