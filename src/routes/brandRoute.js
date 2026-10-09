const express = require("express");

const BrandController = require("../controllers/BrandController");

const authMiddleware = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/authorizeRoles");

const router = express.Router();

/*
==========================================================
PUBLIC
==========================================================
*/

router.get("/shop/:slug", BrandController.showBrandProductsPage);

/*
==========================================================
ADMIN
==========================================================
*/

router.use(authMiddleware);

router.use(authorizeRoles("admin"));

/*
==========================================================
BRANDS
==========================================================
*/

// Brand List
router.get("/", BrandController.showBrandsPage);

// Brand Options (For Product Create/Edit Dropdown)
router.get("/options", BrandController.getBrandOptions);

// Create Brand Page
router.get("/create", BrandController.showCreateBrandPage);

// Create Brand
router.post("/create", BrandController.createBrand);

// Edit Brand Page
router.get("/:brandId/edit", BrandController.showEditBrandPage);

// Update Brand
router.post("/:brandId/edit", BrandController.updateBrand);

// Delete Brand
router.delete("/:brandId", BrandController.deleteBrand);

module.exports = router;
