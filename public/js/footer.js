document.addEventListener("DOMContentLoaded", () => {
  const footer = document.querySelector(".footer");

  if (!footer) return;

  const observer = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        footer.classList.add("active");

        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.15,
    },
  );

  observer.observe(footer);
});
