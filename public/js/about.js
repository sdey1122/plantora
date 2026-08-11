/*
============================================================
PLANTORA AI GUIDE
============================================================
*/

document.addEventListener("DOMContentLoaded", () => {
  const questionList = document.getElementById("plantoraQuestionList");

  const questionError = document.getElementById("plantoraQuestionError");

  const answerPanel = document.getElementById("plantoraAnswerPanel");

  // ==========================================================
  // ELEMENT CHECK
  // ==========================================================

  if (!questionList || !answerPanel) {
    return;
  }

  // ==========================================================
  // STATE
  // ==========================================================

  let isGenerating = false;

  // ==========================================================
  // INITIALIZE
  // ==========================================================

  loadPlantoraQuestions();

  // ==========================================================
  // LOAD QUESTIONS
  // ==========================================================

  async function loadPlantoraQuestions() {
    try {
      // --------------------------------------------------------
      // SHOW LOADING STATE
      // --------------------------------------------------------

      showQuestionLoading();

      hideQuestionError();

      // --------------------------------------------------------
      // RECORD START TIME
      // --------------------------------------------------------

      const loadingStart = Date.now();

      // --------------------------------------------------------
      // REQUEST QUESTIONS
      // --------------------------------------------------------

      const response = await fetch("/about/questions", {
        method: "GET",

        headers: {
          Accept: "application/json",
        },
      });

      const data = await response.json();

      // --------------------------------------------------------
      // RESPONSE VALIDATION
      // --------------------------------------------------------

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load Plantora questions.");
      }

      if (!Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error("No Plantora questions are currently available.");
      }

      // --------------------------------------------------------
      // MINIMUM QUESTION LOADING TIME
      //
      // 2.5 - 3.5 seconds
      // --------------------------------------------------------

      const minimumLoadingTime = 2500 + Math.floor(Math.random() * 1000);

      const elapsed = Date.now() - loadingStart;

      const remainingTime = Math.max(0, minimumLoadingTime - elapsed);

      if (remainingTime > 0) {
        await wait(remainingTime);
      }

      // --------------------------------------------------------
      // RENDER QUESTIONS
      // --------------------------------------------------------

      renderQuestions(data.questions);
    } catch (error) {
      console.error("Plantora questions error:", error);

      showQuestionError(
        error.message || "Unable to load Plantora questions. Please try again.",
      );
    }
  }

  // ==========================================================
  // RENDER QUESTIONS
  // ==========================================================

  function renderQuestions(questions) {
    questionList.innerHTML = "";

    let validQuestions = [];

    // --------------------------------------------------------
    // CLEAN QUESTIONS
    // --------------------------------------------------------

    questions.forEach((item) => {
      let questionText = "";

      /*
      Backend can return:

      {
        question: "What is Plantora?"
      }

      OR:

      "What is Plantora?"
      */

      if (
        item &&
        typeof item === "object" &&
        typeof item.question === "string"
      ) {
        questionText = item.question.trim();
      }

      // ------------------------------------------------------
      // STRING FALLBACK
      // ------------------------------------------------------

      if (!questionText && typeof item === "string") {
        questionText = item.trim();
      }

      // ------------------------------------------------------
      // VALID QUESTION
      // ------------------------------------------------------

      if (questionText) {
        validQuestions.push(questionText);
      }
    });

    // --------------------------------------------------------
    // REMOVE DUPLICATES
    // --------------------------------------------------------

    validQuestions = [...new Set(validQuestions)];

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!validQuestions.length) {
      showQuestionError("No valid Plantora questions were received.");

      return;
    }

    // --------------------------------------------------------
    // RENDER QUESTIONS
    // --------------------------------------------------------

    validQuestions.forEach((questionText, index) => {
      const button = document.createElement("button");

      button.type = "button";

      button.className = "plantora-question";

      button.dataset.question = questionText;

      button.innerHTML = `
          <span class="plantora-question-icon">

            <i class="bi bi-flower1"></i>

          </span>

          <span class="plantora-question-text">

            ${escapeHtml(questionText)}

          </span>

          <span class="plantora-question-number">

          </span>

          <i
            class="bi bi-arrow-right plantora-question-arrow"
          ></i>
        `;

      // ------------------------------------------------------
      // QUESTION CLICK
      // ------------------------------------------------------

      button.addEventListener("click", () => {
        handleQuestionClick(button, questionText);
      });

      questionList.appendChild(button);
    });
  }

  // ==========================================================
  // QUESTION CLICK
  // ==========================================================

  async function handleQuestionClick(button, question) {
    // --------------------------------------------------------
    // PREVENT MULTIPLE REQUESTS
    // --------------------------------------------------------

    if (isGenerating) {
      return;
    }

    isGenerating = true;

    // --------------------------------------------------------
    // ACTIVE QUESTION
    // --------------------------------------------------------

    document.querySelectorAll(".plantora-question").forEach((item) => {
      item.classList.remove("active");
    });

    button.classList.add("active");

    // --------------------------------------------------------
    // DISABLE QUESTIONS
    // --------------------------------------------------------

    document.querySelectorAll(".plantora-question").forEach((item) => {
      item.disabled = true;
    });

    try {
      // ------------------------------------------------------
      // SHOW ANSWER LOADING
      // ------------------------------------------------------

      showAnswerLoading(question);

      // ------------------------------------------------------
      // START API REQUEST
      // ------------------------------------------------------

      const response = await fetch("/about/answer", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Accept: "application/json",
        },

        body: JSON.stringify({
          question,
        }),
      });

      const data = await response.json();

      // ------------------------------------------------------
      // RESPONSE VALIDATION
      // ------------------------------------------------------

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to generate Plantora answer.");
      }

      // ------------------------------------------------------
      // ANSWER VALIDATION
      //
      // Expected:
      //
      // answer: {
      //   intro: "...",
      //   points: [...]
      // }
      // ------------------------------------------------------

      if (!data.answer || typeof data.answer !== "object") {
        throw new Error("Plantora Guide returned an invalid answer.");
      }

      // ------------------------------------------------------
      // KEEP LOADER VISIBLE
      //
      // 3.5 - 4.5 seconds
      // ------------------------------------------------------

      const answerDelay = 3500 + Math.floor(Math.random() * 1000);

      await wait(answerDelay);

      // ------------------------------------------------------
      // RENDER ANSWER
      // ------------------------------------------------------

      renderAnswer(question, data.answer);
    } catch (error) {
      console.error("Plantora Guide answer error:", error);

      showAnswerError(
        question,
        error.message || "Unable to prepare the Plantora guide right now.",
      );
    } finally {
      // ------------------------------------------------------
      // RESET STATE
      // ------------------------------------------------------

      isGenerating = false;

      // ------------------------------------------------------
      // ENABLE QUESTIONS
      // ------------------------------------------------------

      document.querySelectorAll(".plantora-question").forEach((item) => {
        item.disabled = false;
      });
    }
  }

  // ==========================================================
  // ANSWER LOADING
  // ==========================================================

  function showAnswerLoading(question) {
    const loadingMessages = [
      "Preparing your Plantora guide...",

      "Reviewing Plantora information...",

      "Preparing a helpful Plantora insight...",

      "Building your Plantora guide...",

      "Preparing a detailed answer for you...",

      "Connecting the pieces of your Plantora guide...",

      "Creating your personalized Plantora explanation...",
    ];

    const randomMessage =
      loadingMessages[Math.floor(Math.random() * loadingMessages.length)];

    answerPanel.innerHTML = `
      <div class="plantora-answer-loading">

        <!-- ============================================
             AI ORBIT
        ============================================= -->

        <div class="plantora-answer-loading-orbit">

          <div class="plantora-loading-core">

            <i class="bi bi-stars"></i>

          </div>

        </div>


        <!-- ============================================
             KICKER
        ============================================= -->

        <span class="plantora-loading-kicker">

          PLANTORA GUIDE

        </span>


        <!-- ============================================
             MAIN MESSAGE
        ============================================= -->

        <strong>

          ${escapeHtml(randomMessage)}

        </strong>


        <!-- ============================================
             DESCRIPTION
        ============================================= -->

        <span class="plantora-loading-description">

          Preparing information specifically
          around the Plantora experience.

        </span>


        <!-- ============================================
             ANIMATED DOTS
        ============================================= -->

        <div class="plantora-ai-dots">

          <span></span>

          <span></span>

          <span></span>

        </div>

      </div>
    `;
  }

  // ==========================================================
  // RENDER ANSWER
  // ==========================================================

  function renderAnswer(question, answer) {
    const formattedAnswer = formatAnswer(answer);

    answerPanel.innerHTML = `
      <div class="plantora-generated-answer">

        <!-- ==========================================
             KICKER
        =========================================== -->

        <div class="plantora-generated-kicker">

          <span class="plantora-kicker-icon">

            <i class="bi bi-stars"></i>

          </span>

          PLANTORA GUIDE

        </div>


        <!-- ==========================================
             QUESTION
        =========================================== -->

        <h3>

          ${escapeHtml(question)}

        </h3>


        <!-- ==========================================
             DIVIDER
        =========================================== -->

        <div class="plantora-answer-divider">

          <span></span>

        </div>


        <!-- ==========================================
             ANSWER
        =========================================== -->

        <div class="plantora-generated-content">

          ${formattedAnswer}

        </div>


        <!-- ==========================================
             TRUST / SOURCE
        =========================================== -->

        <div class="plantora-answer-source">

          <span>

            <i class="bi bi-shield-check"></i>

          </span>

          <div>

            <strong>
              Plantora Guide
            </strong>

            <small>
              Information prepared specifically
              for the Plantora experience.
            </small>

          </div>

        </div>

      </div>
    `;

    // --------------------------------------------------------
    // MOBILE SCROLL
    // --------------------------------------------------------

    if (window.innerWidth < 992) {
      setTimeout(() => {
        answerPanel.scrollIntoView({
          behavior: "smooth",

          block: "start",
        });
      }, 100);
    }
  }

  // ==========================================================
  // FORMAT ANSWER OBJECT
  // ==========================================================

  function formatAnswer(answer) {
    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!answer || typeof answer !== "object") {
      return `
        <div class="plantora-answer-invalid">

          <i class="bi bi-info-circle"></i>

          <p>
            Unable to display the generated
            Plantora guide.
          </p>

        </div>
      `;
    }

    let html = "";

    // ========================================================
    // INTRODUCTION
    // ========================================================

    if (typeof answer.intro === "string" && answer.intro.trim()) {
      html += `
        <p class="plantora-answer-intro">

          ${escapeHtml(answer.intro.trim())}

        </p>
      `;
    }

    // ========================================================
    // BULLET POINTS
    // ========================================================

    if (Array.isArray(answer.points) && answer.points.length) {
      const validPoints = answer.points.filter(
        (point) => typeof point === "string" && point.trim(),
      );

      if (validPoints.length) {
        html += `
          <div class="plantora-answer-section">

            <div class="plantora-answer-section-title">

              <i class="bi bi-flower1"></i>

              <span>
                Plantora Guide
              </span>

            </div>


            <ul class="plantora-answer-points">

              ${validPoints
                .map(
                  (point) => `
                    <li>

                      <span
                        class="plantora-point-icon"
                      >

                        <i
                          class="bi bi-check2"
                        ></i>

                      </span>

                      <span
                        class="plantora-point-text"
                      >

                        ${escapeHtml(point.trim())}

                      </span>

                    </li>
                  `,
                )
                .join("")}

            </ul>

          </div>
        `;
      }
    }

    // ========================================================
    // FALLBACK
    // ========================================================

    if (!html.trim()) {
      html = `
        <div class="plantora-answer-invalid">

          <i class="bi bi-info-circle"></i>

          <p>
            No detailed Plantora information
            is currently available for this
            question.
          </p>

        </div>
      `;
    }

    return html;
  }

  // ==========================================================
  // ANSWER ERROR
  // ==========================================================

  function showAnswerError(question, message) {
    answerPanel.innerHTML = `
      <div class="plantora-answer-empty">

        <!-- ==========================================
             ERROR ORB
        =========================================== -->

        <div class="plantora-answer-orb">

          <div
            class="plantora-answer-orb-inner"
          >

            <i
              class="bi bi-exclamation-lg"
            ></i>

          </div>

        </div>


        <!-- ==========================================
             KICKER
        =========================================== -->

        <span class="plantora-answer-kicker">

          PLANTORA GUIDE

        </span>


        <!-- ==========================================
             TITLE
        =========================================== -->

        <h3>

          We couldn't prepare that guide.

        </h3>


        <!-- ==========================================
             ERROR MESSAGE
        =========================================== -->

        <p>

          ${escapeHtml(message)}

        </p>


        <!-- ==========================================
             RETRY
        =========================================== -->

        <button
          type="button"
          class="plantora-guide-retry"
          id="plantoraRetryAnswer"
        >

          <i class="bi bi-arrow-repeat"></i>

          Try Again

        </button>

      </div>
    `;

    // --------------------------------------------------------
    // RETRY BUTTON
    // --------------------------------------------------------

    const retryButton = document.getElementById("plantoraRetryAnswer");

    if (retryButton) {
      retryButton.addEventListener("click", () => {
        const questionButton = [
          ...document.querySelectorAll(".plantora-question"),
        ].find((item) => item.dataset.question === question);

        if (questionButton) {
          handleQuestionClick(questionButton, question);
        }
      });
    }
  }

  // ==========================================================
  // QUESTION LOADING
  // ==========================================================

  function showQuestionLoading() {
    questionList.innerHTML = `
      <div class="plantora-ai-loading">

        <!-- ========================================
             LOADING ORBIT
        ========================================= -->

        <div class="plantora-loading-orbit">

          <div class="plantora-loading-core">

            <i class="bi bi-stars"></i>

          </div>

        </div>


        <!-- ========================================
             LOADING COPY
        ========================================= -->

        <div class="plantora-loading-copy">

          <strong>

            Preparing your Plantora guide...

          </strong>

          <small>

            Curating helpful topics for you.

          </small>


          <!-- ======================================
               DOTS
          ======================================= -->

          <div class="plantora-ai-dots">

            <span></span>

            <span></span>

            <span></span>

          </div>

        </div>

      </div>
    `;
  }

  // ==========================================================
  // QUESTION ERROR
  // ==========================================================

  function showQuestionError(message) {
    questionList.innerHTML = `
      <button
        type="button"
        class="plantora-question"
        id="plantoraRetryQuestions"
      >

        <span class="plantora-question-icon">

          <i
            class="bi bi-arrow-repeat"
          ></i>

        </span>


        <span class="plantora-question-text">

          Try loading Plantora questions again

        </span>


        <i
          class="bi bi-arrow-right plantora-question-arrow"
        ></i>

      </button>
    `;

    // --------------------------------------------------------
    // ERROR MESSAGE
    // --------------------------------------------------------

    if (questionError) {
      questionError.textContent = message;

      questionError.classList.add("show");
    }

    // --------------------------------------------------------
    // RETRY
    // --------------------------------------------------------

    const retryButton = document.getElementById("plantoraRetryQuestions");

    if (retryButton) {
      retryButton.addEventListener("click", loadPlantoraQuestions);
    }
  }

  // ==========================================================
  // HIDE QUESTION ERROR
  // ==========================================================

  function hideQuestionError() {
    if (!questionError) {
      return;
    }

    questionError.textContent = "";

    questionError.classList.remove("show");
  }

  // ==========================================================
  // WAIT HELPER
  // ==========================================================

  function wait(milliseconds) {
    return new Promise((resolve) => {
      setTimeout(resolve, milliseconds);
    });
  }

  // ==========================================================
  // HTML ESCAPE
  // ==========================================================

  function escapeHtml(value) {
    const div = document.createElement("div");

    div.textContent = String(value ?? "");

    return div.innerHTML;
  }
});
