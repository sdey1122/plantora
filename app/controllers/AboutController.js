const logger = require("../config/logger");
const httpStatusCode = require("../utils/httpStatusCode");

class AboutController {
  // ==========================================================
  // PLANTORA GUIDE
  // ==========================================================

  static PLANTORA_GUIDE = [
    {
      question: "What is Plantora?",
      answer: {
        intro:
          "Plantora is an online plant shopping platform created to make discovering and purchasing plants simple, convenient and enjoyable. The platform brings plant products, shopping tools and customer services together in one place.",
        points: [
          "Browse plants and explore available products.",
          "Discover plants through categories and product information.",
          "Save interesting plants to your wishlist for later.",
          "Add products to your cart and review your order before checkout.",
          "Place orders through the Plantora checkout system.",
          "Manage your profile, addresses and previous orders.",
          "Track order information after placing a purchase.",
        ],
      },
    },

    {
      question: "How can I find the right plant on Plantora?",
      answer: {
        intro:
          "Plantora makes plant discovery easier by allowing you to browse available products and explore their information before making a purchase.",
        points: [
          "Open the Plantora Shop and explore available plants.",
          "Use categories and available filters to narrow your choices.",
          "Open a product to inspect its images, price and available information.",
          "Check stock availability before adding a product to your cart.",
          "Compare products that interest you before making your decision.",
          "Use the wishlist to save plants you may want to purchase later.",
        ],
      },
    },

    {
      question: "What plant categories are available on Plantora?",
      answer: {
        intro:
          "Plantora organizes its plant products into categories so customers can discover suitable products more easily.",
        points: [
          "Visit the Plantora Shop to view available categories.",
          "Select a category to explore products belonging to it.",
          "Use available filters and search options to narrow your results.",
          "Open individual products to learn more before purchasing.",
          "Category availability can change as new products are added to Plantora.",
        ],
      },
    },

    {
      question: "How should I care for a plant purchased from Plantora?",
      answer: {
        intro:
          "Plant care depends on the particular plant, so the correct care routine should always be based on the plant you purchased.",
        points: [
          "Check the product information for available care guidance.",
          "Consider the amount of sunlight the plant requires.",
          "Follow an appropriate watering routine rather than overwatering.",
          "Keep the plant in a suitable environment for its needs.",
          "Use suitable soil and drainage where required.",
          "Observe the plant regularly and adjust its care when necessary.",
        ],
      },
    },

    {
      question: "How does the Plantora cart work?",
      answer: {
        intro:
          "The Plantora cart collects the products you intend to purchase and allows you to review your selection before proceeding to checkout.",
        points: [
          "Add a plant to your cart from its product page.",
          "Open the cart to review your selected products.",
          "Check product quantities and applicable prices.",
          "Update quantities when necessary.",
          "Remove products you no longer want.",
          "Continue to checkout once your cart is ready.",
        ],
      },
    },

    {
      question: "How do I add a plant to my Plantora wishlist?",
      answer: {
        intro:
          "The Plantora wishlist allows you to save products that interest you without immediately purchasing them.",
        points: [
          "Open a Plantora product you are interested in.",
          "Use the wishlist option available for the product.",
          "The selected plant will be saved to your wishlist.",
          "Open your Wishlist section whenever you want to review saved products.",
          "You can later move your interest toward purchasing the product through the normal shopping flow.",
        ],
      },
    },

    {
      question: "How does Plantora delivery work?",
      answer: {
        intro:
          "After you complete checkout and successfully place an order, the order moves through Plantora's order and delivery process.",
        points: [
          "Complete your cart and proceed to checkout.",
          "Provide or select the appropriate delivery address.",
          "Complete the available payment process.",
          "After successful order placement, the order receives its corresponding status.",
          "You can view the order through your My Orders section.",
          "Delivery information can be checked through the available order details.",
        ],
      },
    },

    {
      question: "Is free shipping available on Plantora?",
      answer: {
        intro:
          "Yes. Plantora provides free shipping on orders over ₹999, making larger eligible purchases more convenient for customers.",
        points: [
          "Orders above ₹999 are eligible for free shipping.",
          "The applicable shipping information is reflected during the shopping and checkout process.",
          "Review your checkout summary before placing the order.",
          "Shipping charges, when applicable, are displayed as part of the order calculation.",
          "The final checkout summary should always be treated as the definitive amount for your order.",
        ],
      },
    },

    {
      question: "How can I track my Plantora order?",
      answer: {
        intro:
          "Plantora provides order information through your account so you can keep track of purchases after placing them.",
        points: [
          "Log in to your Plantora account.",
          "Open the My Orders section.",
          "Select the order you want to inspect.",
          "Review its current order status and available details.",
          "Keep your order information available if you need support regarding the purchase.",
        ],
      },
    },

    {
      question: "How can I view my Plantora order details?",
      answer: {
        intro:
          "You can view your Plantora orders and their available details directly from your customer account.",
        points: [
          "Log in to your Plantora account.",
          "Open the profile menu from the Plantora header.",
          "Select the My Orders option.",
          "Find the order you want to check from your order history.",
          "Open the order to view its available products, order information and current status.",
          "Keep your order details available if you need assistance from Plantora support.",
        ],
      },
    },

    {
      question: "What payment methods are available on Plantora?",
      answer: {
        intro:
          "Plantora supports online payments through its checkout and payment gateway system.",
        points: [
          "Credit card payments can be used where supported.",
          "Debit card payments can be used where supported.",
          "Online payment options are presented during checkout.",
          "Payments are processed through the integrated payment gateway.",
          "Always verify the final payment amount before confirming the transaction.",
        ],
      },
    },

    {
      question: "Can I pay for my Plantora order using a credit or debit card?",
      answer: {
        intro:
          "Yes. Plantora's online checkout can support credit and debit card payments through the integrated payment gateway.",
        points: [
          "Proceed to checkout after preparing your cart.",
          "Select the available card payment option.",
          "Enter the required card information through the secure payment interface.",
          "Complete any additional verification requested by the payment provider.",
          "Wait for payment confirmation before leaving the payment flow.",
        ],
      },
    },

    {
      question: "Does Plantora use Razorpay for payments?",
      answer: {
        intro:
          "Yes. Plantora uses Razorpay as its online payment gateway for supported online transactions.",
        points: [
          "Razorpay handles the online payment interaction during checkout.",
          "Customers can select an available payment method presented by the gateway.",
          "Credit and debit card payments can be supported through the gateway.",
          "The payment process takes place through the secure payment interface.",
          "After successful payment, the Plantora order can proceed through the normal order process.",
        ],
      },
    },

    {
      question: "Does Plantora offer discounts?",
      answer: {
        intro:
          "Plantora may provide discounts on eligible products or purchases. Available discounts depend on the offers currently configured on the platform.",
        points: [
          "Check product pages for applicable promotional pricing.",
          "Review the cart before proceeding to checkout.",
          "Look at the final order summary for applicable discounts.",
          "The exact discount can depend on the product or order eligibility.",
          "The checkout summary should be used to verify the final payable amount.",
        ],
      },
    },

    {
      question: "How can I become a Plantora seller?",
      answer: {
        intro:
          "Plantora provides seller functionality for users who want to participate as sellers on the platform.",
        points: [
          "Use the seller functionality available through your Plantora account.",
          "Complete the required seller information or application process.",
          "Wait for the applicable seller approval process.",
          "After approval, access the available seller dashboard functionality.",
          "Use the seller dashboard to manage your products and seller activities.",
        ],
      },
    },

    {
      question: "What can a Plantora seller do from the seller dashboard?",
      answer: {
        intro:
          "The Plantora seller dashboard provides sellers with tools for managing products and monitoring their seller activities.",
        points: [
          "Manage products associated with the seller account.",
          "Add and maintain product information.",
          "Monitor product-related information.",
          "Manage available inventory through the provided product tools.",
          "Use the dashboard to keep the seller's Plantora catalogue organized.",
        ],
      },
    },

    {
      question: "How can I manage my Plantora account?",
      answer: {
        intro:
          "Your Plantora account provides access to several customer features that help you manage your shopping experience.",
        points: [
          "Open your profile from the Plantora header.",
          "Manage your personal profile information.",
          "View your previous orders.",
          "Manage saved addresses.",
          "Review your wishlist.",
          "Access other account features available to your account.",
        ],
      },
    },

    {
      question: "How can I view my Plantora orders?",
      answer: {
        intro:
          "Your Plantora orders are available through the My Orders section of your customer account.",
        points: [
          "Log in to your Plantora account.",
          "Open the profile menu.",
          "Select My Orders.",
          "Browse your previous purchases.",
          "Open an individual order to inspect its available details and status.",
        ],
      },
    },

    {
      question: "Can I review a product on Plantora?",
      answer: {
        intro:
          "Yes. Plantora includes product review functionality so customers can share their experience with products.",
        points: [
          "Open the relevant Plantora product.",
          "Use the available review functionality when eligible.",
          "Share your experience with the purchased product.",
          "Reviews can help other customers understand the product experience.",
          "Keep reviews relevant to the actual Plantora product and shopping experience.",
        ],
      },
    },

    {
      question: "How can I get help with Plantora?",
      answer: {
        intro:
          "If you need assistance with Plantora, you can use the support and contact options provided by the website.",
        points: [
          "Visit the Plantora Contact section for available support information.",
          "For order-related issues, keep your order details available.",
          "Clearly explain the issue you are experiencing.",
          "Include relevant information that can help identify your order or account.",
          "Follow the support instructions provided by Plantora.",
        ],
      },
    },
  ];

  // ==========================================================
  // ABOUT PAGE
  // ==========================================================

  async showAboutPage(req, res) {
    try {
      return res.render("partials/main/about", {
        title: "About Plantora",
      });
    } catch (error) {
      logger.error(`Show about page failed: ${error.stack || error.message}`);

      if (req.flash) {
        req.flash("error", "Failed to load About Plantora page.");
      }

      return res.redirect("/");
    }
  }

  // ==========================================================
  // GET RANDOM PLANTORA QUESTIONS
  // ==========================================================

  async getQuestions(req, res) {
    try {
      const shuffled = [...AboutController.PLANTORA_GUIDE];

      // Fisher-Yates shuffle
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      // Only show 10 out of the 20 questions
      const questions = shuffled.slice(0, 10).map((item) => ({
        question: item.question,
      }));

      return res.status(httpStatusCode.OK).json({
        success: true,
        questions,
      });
    } catch (error) {
      logger.error(
        `Get Plantora questions failed: ${error.stack || error.message}`,
      );

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to load Plantora questions.",
      });
    }
  }

  // ==========================================================
  // GET STORED PLANTORA ANSWER
  // ==========================================================

  async getAnswer(req, res) {
    try {
      const { question } = req.body;

      if (typeof question !== "string" || !question.trim()) {
        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "A valid Plantora question is required.",
        });
      }

      const cleanQuestion = question.trim();

      const guideItem = AboutController.PLANTORA_GUIDE.find(
        (item) => item.question === cleanQuestion,
      );

      if (!guideItem) {
        return res.status(httpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Please select a valid Plantora question.",
        });
      }

      return res.status(httpStatusCode.OK).json({
        success: true,
        question: guideItem.question,
        answer: guideItem.answer,
      });
    } catch (error) {
      logger.error(
        `Get Plantora answer failed: ${error.stack || error.message}`,
      );

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to load the Plantora answer.",
      });
    }
  }
}

module.exports = new AboutController();
