/* ==========================================================
   FEATURED PRODUCTS SWIPER
========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const slider = document.querySelector(".featured-swiper");

  if (!slider) return;

  new Swiper(slider, {
    /* Layout */

    slidesPerView: 4,

    slidesPerGroup: 1,

    spaceBetween: 24,

    loop: true,

    centeredSlides: false,

    speed: 1200,

    grabCursor: true,

    watchOverflow: true,

    preloadImages: true,

    observer: true,

    observeParents: true,

    /* Auto Scroll */

    autoplay: {
      delay: 2500,

      disableOnInteraction: false,

      pauseOnMouseEnter: true,

      reverseDirection: false,
    },

    /* Navigation */

    navigation: {
      nextEl: ".featured-swiper .swiper-button-next",

      prevEl: ".featured-swiper .swiper-button-prev",
    },

    /* Pagination */

    pagination: {
      el: ".featured-swiper .swiper-pagination",

      clickable: true,
    },

    /* Keyboard */

    keyboard: {
      enabled: true,
    },

    /* Mouse */

    mousewheel: {
      forceToAxis: true,
    },

    /* Desktop */

    breakpoints: {
      1200: {
        slidesPerView: 4,

        spaceBetween: 24,
      },

      992: {
        slidesPerView: 3,

        spaceBetween: 22,
      },

      768: {
        slidesPerView: 2,

        spaceBetween: 20,
      },

      0: {
        slidesPerView: 1,

        spaceBetween: 16,
      },
    },
  });
});
