/*
============================================================
PLANTORA CONTACT PAGE
============================================================
*/

document.addEventListener("DOMContentLoaded", () => {
  // ==========================================================
  // ELEMENTS
  // ==========================================================

  const form = document.getElementById("plantoraContactForm");

  const nameInput = document.getElementById("contactName");

  const emailInput = document.getElementById("contactEmail");

  const messageInput = document.getElementById("contactMessage");

  const nameError = document.getElementById("contactNameError");

  const emailError = document.getElementById("contactEmailError");

  const messageError = document.getElementById("contactMessageError");

  const formError = document.getElementById("contactFormError");

  const characterCount = document.getElementById("contactCharacterCount");

  const submitButton = document.getElementById("contactSubmitButton");

  const successModal = document.getElementById("contactSuccessModal");

  const successClose = document.getElementById("contactSuccessClose");

  const mapElement = document.getElementById("plantoraMap");

  // ==========================================================
  // ELEMENT CHECK
  // ==========================================================

  if (!form) {
    return;
  }

  // ==========================================================
  // CONFIGURATION
  // ==========================================================

  const MAX_MESSAGE_LENGTH = 500;

  // Plantora office — Salt Lake Sector V, Kolkata
  const PLANTORA_LAT = 22.5726;

  const PLANTORA_LNG = 88.4331;

  // ==========================================================
  // INITIALIZE
  // ==========================================================

  updateCharacterCount();

  initializeMap();

  // ==========================================================
  // NAME VALIDATION
  // ==========================================================

  function validateName() {
    const value = nameInput.value.trim();

    clearFieldError(nameInput, nameError);

    if (!value) {
      showFieldError(nameInput, nameError, "Please enter your name.");

      return false;
    }

    if (value.length < 3 || value.length > 32) {
      showFieldError(
        nameInput,
        nameError,
        "Name must be between 3 and 32 characters.",
      );

      return false;
    }

    const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s.'-]+$/;

    if (!nameRegex.test(value)) {
      showFieldError(nameInput, nameError, "Please enter a valid name.");

      return false;
    }

    return true;
  }

  // ==========================================================
  // EMAIL VALIDATION
  // ==========================================================

  function validateEmail() {
    const value = emailInput.value.trim();

    clearFieldError(emailInput, emailError);

    if (!value) {
      showFieldError(
        emailInput,
        emailError,
        "Please enter your email address.",
      );

      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (!emailRegex.test(value)) {
      showFieldError(
        emailInput,
        emailError,
        "Please enter a valid email address.",
      );

      return false;
    }

    return true;
  }

  // ==========================================================
  // MESSAGE VALIDATION
  // ==========================================================

  function validateMessage() {
    const value = messageInput.value.trim();

    clearFieldError(messageInput, messageError);

    if (!value) {
      showFieldError(messageInput, messageError, "Please enter your message.");

      return false;
    }

    if (value.length > MAX_MESSAGE_LENGTH) {
      showFieldError(
        messageInput,
        messageError,
        "Message cannot exceed 500 characters.",
      );

      return false;
    }

    return true;
  }

  // ==========================================================
  // FIELD ERROR
  // ==========================================================

  function showFieldError(input, errorElement, message) {
    const field = input.closest(".contact-field");

    if (field) {
      field.classList.add("has-error");
    }

    if (errorElement) {
      errorElement.textContent = message;
    }
  }

  // ==========================================================
  // CLEAR FIELD ERROR
  // ==========================================================

  function clearFieldError(input, errorElement) {
    const field = input.closest(".contact-field");

    if (field) {
      field.classList.remove("has-error");
    }

    if (errorElement) {
      errorElement.textContent = "";
    }
  }

  // ==========================================================
  // CLEAR ALL ERRORS
  // ==========================================================

  function clearAllErrors() {
    clearFieldError(nameInput, nameError);

    clearFieldError(emailInput, emailError);

    clearFieldError(messageInput, messageError);

    hideFormError();
  }

  // ==========================================================
  // MESSAGE CHARACTER COUNTER
  // ==========================================================

  function updateCharacterCount() {
    if (!messageInput || !characterCount) {
      return;
    }

    const length = messageInput.value.length;

    characterCount.textContent = `${length} / ${MAX_MESSAGE_LENGTH}`;

    characterCount.classList.remove("near-limit", "limit");

    if (length >= MAX_MESSAGE_LENGTH) {
      characterCount.classList.add("limit");
    } else if (length >= MAX_MESSAGE_LENGTH * 0.85) {
      characterCount.classList.add("near-limit");
    }
  }

  // ==========================================================
  // INPUT EVENTS
  // ==========================================================

  nameInput.addEventListener("input", () => {
    clearFieldError(nameInput, nameError);
  });

  emailInput.addEventListener("input", () => {
    clearFieldError(emailInput, emailError);
  });

  messageInput.addEventListener("input", () => {
    updateCharacterCount();

    clearFieldError(messageInput, messageError);
  });

  // ==========================================================
  // BLUR VALIDATION
  // ==========================================================

  nameInput.addEventListener("blur", validateName);

  emailInput.addEventListener("blur", validateEmail);

  messageInput.addEventListener("blur", validateMessage);

  // ==========================================================
  // FORM SUBMISSION
  // ==========================================================

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    clearAllErrors();

    // ------------------------------------------------------
    // VALIDATE
    // ------------------------------------------------------

    const isNameValid = validateName();

    const isEmailValid = validateEmail();

    const isMessageValid = validateMessage();

    if (!isNameValid || !isEmailValid || !isMessageValid) {
      return;
    }

    // ------------------------------------------------------
    // GET VALUES
    // ------------------------------------------------------

    const name = nameInput.value.trim();

    const email = emailInput.value.trim().toLowerCase();

    const message = messageInput.value.trim();

    // ------------------------------------------------------
    // LOADING
    // ------------------------------------------------------

    setSubmitLoading(true);

    try {
      // ----------------------------------------------------
      // SEND TO SERVER
      // ----------------------------------------------------

      const response = await fetch("/contact/send", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Accept: "application/json",
        },

        body: JSON.stringify({
          name,
          email,
          message,
        }),
      });

      // ----------------------------------------------------
      // SAFE JSON PARSING
      // ----------------------------------------------------

      let data;

      try {
        data = await response.json();
      } catch (error) {
        throw new Error("The server returned an invalid response.");
      }

      // ----------------------------------------------------
      // SERVER ERROR
      // ----------------------------------------------------

      if (!response.ok || !data.success) {
        const serverError = new Error(
          data.message || "Unable to send your message.",
        );

        serverError.field = data.field;

        throw serverError;
      }

      // ----------------------------------------------------
      // SUCCESS
      // ----------------------------------------------------

      form.reset();

      updateCharacterCount();

      clearAllErrors();

      showSuccessModal();
    } catch (error) {
      console.error("Plantora contact form error:", error);

      // ----------------------------------------------------
      // FIELD-SPECIFIC SERVER ERROR
      // ----------------------------------------------------

      if (error.field === "name") {
        showFieldError(nameInput, nameError, error.message);

        nameInput.focus();

        return;
      }

      if (error.field === "email") {
        showFieldError(emailInput, emailError, error.message);

        emailInput.focus();

        return;
      }

      if (error.field === "message") {
        showFieldError(messageInput, messageError, error.message);

        messageInput.focus();

        return;
      }

      // ----------------------------------------------------
      // GENERAL ERROR
      // ----------------------------------------------------

      showFormError(
        error.message ||
          "Something went wrong while sending your message. Please try again.",
      );
    } finally {
      setSubmitLoading(false);
    }
  });

  // ==========================================================
  // SUBMIT LOADING
  // ==========================================================

  function setSubmitLoading(loading) {
    if (!submitButton) {
      return;
    }

    submitButton.disabled = loading;

    submitButton.classList.toggle("is-loading", loading);
  }

  // ==========================================================
  // GENERAL FORM ERROR
  // ==========================================================

  function showFormError(message) {
    if (!formError) {
      return;
    }

    formError.textContent = message;

    formError.classList.add("show");
  }

  // ==========================================================
  // HIDE FORM ERROR
  // ==========================================================

  function hideFormError() {
    if (!formError) {
      return;
    }

    formError.textContent = "";

    formError.classList.remove("show");
  }

  // ==========================================================
  // SUCCESS MODAL
  // ==========================================================

  function showSuccessModal() {
    if (!successModal) {
      return;
    }

    successModal.classList.add("show");

    successModal.setAttribute("aria-hidden", "false");

    document.body.style.overflow = "hidden";
  }

  // ==========================================================
  // CLOSE SUCCESS MODAL
  // ==========================================================

  function closeSuccessModal() {
    if (!successModal) {
      return;
    }

    successModal.classList.remove("show");

    successModal.setAttribute("aria-hidden", "true");

    document.body.style.overflow = "";
  }

  // ==========================================================
  // SUCCESS MODAL EVENTS
  // ==========================================================

  if (successClose) {
    successClose.addEventListener("click", closeSuccessModal);
  }

  const successBackdrop = document.querySelector("[data-close-contact-modal]");

  if (successBackdrop) {
    successBackdrop.addEventListener("click", closeSuccessModal);
  }

  // ==========================================================
  // ESCAPE KEY
  // ==========================================================

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      successModal &&
      successModal.classList.contains("show")
    ) {
      closeSuccessModal();
    }
  });

  // ==========================================================
  // LEAFLET MAP
  // ==========================================================

  function initializeMap() {
    if (!mapElement) {
      return;
    }

    // --------------------------------------------------------
    // CHECK LEAFLET
    // --------------------------------------------------------

    if (typeof L === "undefined") {
      console.error("Leaflet is not loaded.");

      mapElement.innerHTML = `
        <div
          style="
            height:100%;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:30px;
            text-align:center;
            color:#647068;
            background:#edf3ed;
          "
        >
          <div>

            <i
              class="bi bi-map"
              style="
                display:block;
                font-size:35px;
                margin-bottom:12px;
                color:#2f6b45;
              "
            ></i>

            <strong>
              Plantora Office
            </strong>

            <p style="margin:6px 0 0;">
              Salt Lake Sector V,
              Kolkata, West Bengal
            </p>

          </div>
        </div>
      `;

      return;
    }

    // --------------------------------------------------------
    // CREATE MAP
    // --------------------------------------------------------

    const map = L.map(mapElement, {
      center: [PLANTORA_LAT, PLANTORA_LNG],

      zoom: 14,

      zoomControl: false,
    });

    // --------------------------------------------------------
    // ZOOM CONTROL
    // --------------------------------------------------------

    L.control
      .zoom({
        position: "topright",
      })
      .addTo(map);

    // ========================================================
    // MAP LAYERS
    // ========================================================

    // --------------------------------------------------------
    // STREET
    // --------------------------------------------------------

    const streetLayer = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,

        attribution: "&copy; OpenStreetMap contributors",
      },
    );

    // --------------------------------------------------------
    // SATELLITE
    // --------------------------------------------------------

    const satelliteLayer = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 19,

        attribution: "Tiles &copy; Esri",
      },
    );

    // --------------------------------------------------------
    // TOPOGRAPHIC
    // --------------------------------------------------------

    const terrainLayer = L.tileLayer(
      "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 17,

        attribution:
          "Map data &copy; OpenStreetMap contributors, SRTM | Map style &copy; OpenTopoMap",
      },
    );

    // --------------------------------------------------------
    // DEFAULT
    // --------------------------------------------------------

    streetLayer.addTo(map);

    // ========================================================
    // LAYER CONTROL
    // ========================================================

    const baseMaps = {
      "Street View": streetLayer,

      "Satellite View": satelliteLayer,

      "Terrain View": terrainLayer,
    };

    L.control
      .layers(baseMaps, null, {
        position: "topright",

        collapsed: false,
      })
      .addTo(map);

    // ========================================================
    // CUSTOM PLANTORA MARKER
    // ========================================================

    const plantoraIcon = L.divIcon({
      className: "plantora-map-marker-wrapper",

      html: `
          <div class="plantora-map-marker">

            <div class="plantora-map-marker-pulse"></div>

            <div class="plantora-map-marker-core">

              <i class="bi bi-flower1"></i>

            </div>

          </div>
        `,

      iconSize: [50, 50],

      iconAnchor: [25, 25],

      popupAnchor: [0, -28],
    });

    // ========================================================
    // MARKER
    // ========================================================

    const marker = L.marker([PLANTORA_LAT, PLANTORA_LNG], {
      icon: plantoraIcon,
    }).addTo(map);

    // ========================================================
    // POPUP
    // ========================================================

    marker.bindPopup(
      `
          <div
            style="
              min-width:210px;
              padding:4px;
            "
          >

            <div
              style="
                color:#b99655;
                font-size:9px;
                font-weight:800;
                letter-spacing:1.5px;
                margin-bottom:5px;
              "
            >
              PLANTORA OFFICE
            </div>

            <strong
              style="
                display:block;
                color:#163a28;
                font-family:Georgia,serif;
                font-size:17px;
                margin-bottom:4px;
              "
            >
              Salt Lake Sector V
            </strong>

            <span
              style="
                color:#727c74;
                font-size:11px;
                line-height:1.5;
              "
            >
              Kolkata, West Bengal 700091
            </span>

            <br>

            <a
              href="https://www.google.com/maps/search/?api=1&query=Salt+Lake+Sector+V+Kolkata"
              target="_blank"
              rel="noopener noreferrer"
              style="
                display:inline-block;
                margin-top:10px;
                color:#2f6b45;
                font-size:10px;
                font-weight:700;
                text-decoration:none;
              "
            >
              Get directions →
            </a>

          </div>
        `,
      {
        closeButton: true,
      },
    );

    // ========================================================
    // OPEN POPUP
    // ========================================================

    marker.openPopup();

    // ========================================================
    // FIX MAP SIZE
    // ========================================================

    setTimeout(() => {
      map.invalidateSize();
    }, 300);

    // ========================================================
    // STORE MAP INSTANCE
    // ========================================================

    window.plantoraContactMap = map;
  }
});
