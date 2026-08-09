const express = require("express");

const CategoryController = require("../controllers/CategoryController");

const authMiddleware = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/authorizeRoles");

const router = express.Router();

router.use(authMiddleware);

router.use(authorizeRoles("admin"));

/*
==========================================================
CATEGORY LIST
==========================================================
*/

router.get("/", CategoryController.showCategoriesPage);

/*
==========================================================
CREATE
==========================================================
*/

router.get("/create", CategoryController.showCreateCategoryPage);

router.post("/create", CategoryController.createCategory);

/*
==========================================================
EDIT
==========================================================
*/

router.get("/:categoryId/edit", CategoryController.showEditCategoryPage);

router.post("/:categoryId/edit", CategoryController.updateCategory);

/*
==========================================================
DELETE
==========================================================
*/

router.delete("/:categoryId", CategoryController.deleteCategory);

/*
==========================================================
OPTIONS
==========================================================
*/

router.get("/options/list", CategoryController.getCategoryOptions);

module.exports = router;
