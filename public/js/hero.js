document.addEventListener("DOMContentLoaded", () => {
  const heroSection = document.querySelector(".hero-section");
  const counters = document.querySelectorAll(".hero-counter");

  if (!heroSection || counters.length === 0) {
    return;
  }

  let animationFrame = null;

  // ==========================================================
  // RESET COUNTERS
  // ==========================================================

  const resetCounters = () => {
    counters.forEach((counter) => {
      const suffix = counter.dataset.suffix || "";

      const divisor = Number(counter.dataset.divisor || 1);

      if (divisor > 1) {
        counter.textContent = `1${suffix}`;
      } else {
        counter.textContent = `1${suffix}`;
      }
    });
  };

  // ==========================================================
  // ANIMATE COUNTERS
  // ==========================================================

  const animateCounters = () => {
    // Cancel previous animation if one is running
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }

    const duration = 1800;

    const startTime = performance.now();

    const updateCounters = (currentTime) => {
      const elapsed = currentTime - startTime;

      const progress = Math.min(elapsed / duration, 1);

      // Ease-out effect
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      counters.forEach((counter) => {
        const target = Number(counter.dataset.target);

        const divisor = Number(counter.dataset.divisor || 1);

        const suffix = counter.dataset.suffix || "";

        const currentValue = Math.floor(target * easedProgress);

        if (divisor > 1) {
          const displayValue = currentValue / divisor;

          counter.textContent = `${
            displayValue % 1 === 0 ? displayValue : displayValue.toFixed(1)
          }${suffix}`;
        } else {
          counter.textContent = `${currentValue}${suffix}`;
        }
      });

      if (progress < 1) {
        animationFrame = requestAnimationFrame(updateCounters);
      } else {
        // Make sure final values are exact
        counters.forEach((counter) => {
          const target = Number(counter.dataset.target);

          const divisor = Number(counter.dataset.divisor || 1);

          const suffix = counter.dataset.suffix || "";

          if (divisor > 1) {
            const finalValue = target / divisor;

            counter.textContent = `${
              finalValue % 1 === 0 ? finalValue : finalValue.toFixed(1)
            }${suffix}`;
          } else {
            counter.textContent = `${target}${suffix}`;
          }
        });
      }
    };

    animationFrame = requestAnimationFrame(updateCounters);
  };

  // ==========================================================
  // INTERSECTION OBSERVER
  // ==========================================================

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Section entered viewport
          animateCounters();
        } else {
          // Section left viewport
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

  observer.observe(heroSection);

  // ==========================================================
  // INITIAL STATE
  // ==========================================================

  resetCounters();
});
