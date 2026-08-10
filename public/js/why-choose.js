/* ==========================================================
   WHY CHOOSE
========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const section = document.querySelector(".why-section");

  if (!section) {
    return;
  }

  /* ==========================================================
     SECTION ANIMATION
  ========================================================== */

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          section.classList.add("active");
        } else {
          section.classList.remove("active");
        }
      });
    },
    {
      threshold: 0.25,
    },
  );

  sectionObserver.observe(section);

  /* ==========================================================
     IMAGE PARALLAX
  ========================================================== */

  const banner = section.querySelector(".why-banner");

  if (banner) {
    const img = banner.querySelector(".why-banner-image");

    banner.addEventListener("mousemove", (e) => {
      const rect = banner.getBoundingClientRect();

      const x = (e.clientX - rect.left) / rect.width;

      const y = (e.clientY - rect.top) / rect.height;

      img.style.transform = `scale(1.05) translate(
          ${(x - 0.5) * 12}px,
          ${(y - 0.5) * 12}px
        )`;
    });

    banner.addEventListener("mouseleave", () => {
      img.style.transform = "";
    });
  }

  /* ==========================================================
     COUNTERS
  ========================================================== */

  const counters = section.querySelectorAll(".why-counter");

  if (counters.length === 0) {
    return;
  }

  let animationFrame = null;

  /* ==========================================================
     RESET COUNTERS
  ========================================================== */

  const resetCounters = () => {
    counters.forEach((counter) => {
      const suffix = counter.dataset.suffix || "";

      counter.textContent = `0${suffix}`;
    });
  };

  /* ==========================================================
     ANIMATE COUNTERS
  ========================================================== */

  const animateCounters = () => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }

    const duration = 1800;

    const startTime = performance.now();

    const updateCounters = (currentTime) => {
      const elapsed = currentTime - startTime;

      const progress = Math.min(elapsed / duration, 1);

      // Smooth ease-out
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      counters.forEach((counter) => {
        const target = Number(counter.dataset.target);

        const divisor = Number(counter.dataset.divisor || 1);

        const suffix = counter.dataset.suffix || "";

        const currentValue = Math.floor(target * easedProgress);

        /* ==============================================
           10,000 -> 10K+
        ============================================== */

        if (divisor > 1) {
          const displayValue = currentValue / divisor;

          counter.textContent = `${
            displayValue % 1 === 0 ? displayValue : displayValue.toFixed(1)
          }${suffix}`;
        } else {

        /* ==============================================
           500 -> 500+
           100 -> 100%
           10 -> 10+
        ============================================== */
          counter.textContent = `${currentValue}${suffix}`;
        }
      });

      /* ==============================================
         CONTINUE ANIMATION
      ============================================== */

      if (progress < 1) {
        animationFrame = requestAnimationFrame(updateCounters);
      } else {

      /* ==============================================
         FINAL VALUES
      ============================================== */
        counters.forEach((counter) => {
          const target = Number(counter.dataset.target);

          const divisor = Number(counter.dataset.divisor || 1);

          const suffix = counter.dataset.suffix || "";

          const finalValue = target / divisor;

          counter.textContent = `${
            finalValue % 1 === 0 ? finalValue : finalValue.toFixed(1)
          }${suffix}`;
        });
      }
    };

    animationFrame = requestAnimationFrame(updateCounters);
  };

  /* ==========================================================
     COUNTER OBSERVER
  ========================================================== */

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounters();
        } else {
          if (animationFrame) {
            cancelAnimationFrame(animationFrame);
          }

          resetCounters();
        }
      });
    },
    {
      threshold: 0.35,
    },
  );

  counterObserver.observe(section);

  /* ==========================================================
     INITIAL STATE
  ========================================================== */

  resetCounters();
});
