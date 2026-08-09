const mongoose = require("mongoose");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Brand = require("../models/Brand");

const logger = require("../config/logger");

const {
  createProductValidation,
  updateProductValidation,
  productIdValidation,
  productQueryValidation,
  approveProductValidation,
  rejectProductValidation,
  productStatusValidation,
} = require("../validations/productValidation");

const cloudinaryImageUpload = require("../utils/cloudinaryImageUpload");
const cloudinaryImageDelete = require("../utils/cloudinaryImageDelete");

const deleteLocalFile = require("../utils/deleteLocalFile");

const generateSKU = require("../utils/generateSKU");

const createAuditLog = require("../utils/createAuditLog");

const httpStatusCode = require("../utils/httpStatusCode");

class ProductController {
  // Show products page
  // Show products page
  async showProductsPage(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        category = "",
        brand = "",
        status = "",
        approvalStatus = "",
        isFeatured = "",
        minPrice = "",
        maxPrice = "",
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      const currentPage = Math.max(Number(page) || 1, 1);

      const allowedLimits = [10, 30, 50, 100];
      const requestedLimit = Number(limit) || 10;
      const perPage = allowedLimits.includes(requestedLimit)
        ? requestedLimit
        : 10;

      const matchStage = {
        isDeleted: false,
      };

      // Seller can only see his own products
      if (req.user.role === "seller") {
        matchStage.seller = req.user._id;
      }

      // Category filter
      if (category) {
        matchStage.category = category;
      }

      // Brand filter
      if (brand) {
        matchStage.brand = brand;
      }

      // Status filter
      if (status) {
        matchStage.status = status;
      }

      // Approval status filter
      if (approvalStatus) {
        matchStage.approvalStatus = approvalStatus;
      }

      // Featured filter
      if (isFeatured !== "") {
        matchStage.isFeatured = isFeatured === "true";
      }

      // Price filter
      if (minPrice !== "" || maxPrice !== "") {
        matchStage.price = {};

        if (minPrice !== "") {
          matchStage.price.$gte = Number(minPrice);
        }

        if (maxPrice !== "") {
          matchStage.price.$lte = Number(maxPrice);
        }
      }

      /*
    ==========================================================
    SEARCH
    Product ID + Product Name + Category
    ==========================================================
    */

      const escapedSearch = search
        ? search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        : "";

      /*
    ==========================================================
    SORT
    ==========================================================
    */

      let sortStage;

      if (sortBy === "name") {
        sortStage = {
          name: sortOrder === "asc" ? 1 : -1,
        };
      } else {
        sortStage = {
          createdAt: sortOrder === "asc" ? 1 : -1,
        };
      }

      const [result, categories, brands] = await Promise.all([
        Product.aggregate([
          {
            $match: matchStage,
          },

          // Category
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "_id",
              as: "category",
            },
          },

          {
            $unwind: {
              path: "$category",
              preserveNullAndEmptyArrays: true,
            },
          },

          // Brand
          {
            $lookup: {
              from: "brands",
              localField: "brand",
              foreignField: "_id",
              as: "brand",
            },
          },

          {
            $unwind: {
              path: "$brand",
              preserveNullAndEmptyArrays: true,
            },
          },

          // Seller
          {
            $lookup: {
              from: "users",
              localField: "seller",
              foreignField: "_id",
              as: "seller",
            },
          },

          {
            $unwind: {
              path: "$seller",
              preserveNullAndEmptyArrays: true,
            },
          },

          /*
        ======================================================
        SEARCH AFTER LOOKUP
        ======================================================
        */

          ...(search
            ? [
                {
                  $match: {
                    $or: [
                      {
                        name: {
                          $regex: escapedSearch,
                          $options: "i",
                        },
                      },

                      {
                        "category.name": {
                          $regex: escapedSearch,
                          $options: "i",
                        },
                      },

                      {
                        sku: {
                          $regex: escapedSearch,
                          $options: "i",
                        },
                      },

                      {
                        $expr: {
                          $regexMatch: {
                            input: {
                              $toString: "$_id",
                            },
                            regex: escapedSearch,
                            options: "i",
                          },
                        },
                      },
                    ],
                  },
                },
              ]
            : []),

          {
            $project: {
              _id: 1,

              name: 1,
              slug: 1,
              images: 1,

              sku: 1,

              shortDescription: 1,
              description: 1,

              price: 1,
              discountPrice: 1,

              stock: 1,
              lowStockThreshold: 1,

              status: 1,
              approvalStatus: 1,
              isFeatured: 1,

              soldCount: 1,
              views: 1,
              averageRating: 1,

              createdAt: 1,

              "category._id": 1,
              "category.name": 1,

              "brand._id": 1,
              "brand.name": 1,

              "seller._id": 1,
              "seller.name": 1,
            },
          },

          {
            $sort: sortStage,
          },

          {
            $facet: {
              products: [
                {
                  $skip: (currentPage - 1) * perPage,
                },

                {
                  $limit: perPage,
                },
              ],

              pagination: [
                {
                  $count: "totalProducts",
                },
              ],
            },
          },
        ]),

        Category.find({}).select("name").sort({ name: 1 }).lean(),

        Brand.find({}).select("name").sort({ name: 1 }).lean(),
      ]);

      const products = result[0]?.products || [];

      const totalProducts = result[0]?.pagination[0]?.totalProducts || 0;

      const totalPages = Math.ceil(totalProducts / perPage);

      return res.render("admin/products/index", {
        title: "Products",

        products,

        categories,

        brands,

        filters: {
          page: currentPage,
          limit: perPage,
          search,
          category,
          brand,
          status,
          approvalStatus,
          isFeatured,
          minPrice,
          maxPrice,
          sortBy,
          sortOrder,
        },

        pagination: {
          page: currentPage,
          limit: perPage,
          totalProducts,
          totalPages,
        },
      });
    } catch (error) {
      logger.error(`Show products page failed: ${error.message}`);

      return res.redirect("/");
    }
  }
  // Show create product page
  async showCreateProductPage(req, res) {
    try {
      const [categories, brands] = await Promise.all([
        Category.find({}).select("name").sort({ name: 1 }).lean(),

        Brand.find({}).select("name").sort({ name: 1 }).lean(),
      ]);

      return res.render("admin/products/create", {
        title: "Create Product",

        categories,

        brands,
      });
    } catch (error) {
      logger.error(`Show create product page failed: ${error.message}`);

      return res.redirect("/admin/products");
    }
  }
  // Create product
  async createProduct(req, res) {
    const uploadedPublicIds = [];

    try {
      // const { error, value } = createProductValidation.validate(req.body);

      // if (error) {
      //   if (req.files?.length) {
      //     await Promise.all(
      //       req.files.map((file) => deleteLocalFile(file.path)),
      //     );
      //   }

      //   logger.error(error.details.map((detail) => detail.message).join(" "));

      //   return res.redirect("/admin/products/create");
      // }

      const value = {
        ...req.body,
        price: Number(req.body.price) || 0,
        discountPrice: req.body.discountPrice
          ? Number(req.body.discountPrice)
          : null,
        stock: Number(req.body.stock) || 0,
        lowStockThreshold: Number(req.body.lowStockThreshold) || 0,
        isFeatured:
          req.body.isFeatured === "true" || req.body.isFeatured === "on",
      };

      if (!req.files || req.files.length === 0) {
        logger.error("At least one product image is required.");

        return res.redirect("/admin/products/create");
      }

      const category = await Category.findById(value.category).lean();

      if (!category) {
        await Promise.all(req.files.map((file) => deleteLocalFile(file.path)));

        logger.error("Selected category does not exist.");

        return res.redirect("/admin/products/create");
      }

      const brand = await Brand.findById(value.brand).lean();

      if (!brand) {
        await Promise.all(req.files.map((file) => deleteLocalFile(file.path)));

        logger.error("Selected brand does not exist.");

        return res.redirect("/admin/products/create");
      }

      let sku;
      let skuExists = true;

      while (skuExists) {
        sku = generateSKU(value.name);

        skuExists = await Product.exists({
          sku,
        });
      }

      const images = [];

      for (let index = 0; index < req.files.length; index++) {
        const file = req.files[index];

        try {
          const uploadedImage = await cloudinaryImageUpload(file.path);

          uploadedPublicIds.push(uploadedImage.public_id);

          images.push({
            publicId: uploadedImage.public_id,

            url: uploadedImage.secure_url,

            alt: `${value.name} Image ${index + 1}`,

            isPrimary: index === 0,
          });

          await deleteLocalFile(file.path);
        } catch (error) {
          await deleteLocalFile(file.path);

          throw error;
        }
      }

      const productData = {
        name: value.name,

        shortDescription: value.shortDescription,

        description: value.description,

        category: value.category,

        brand: value.brand,

        seller: req.user._id,

        images,

        price: value.price,

        discountPrice: value.discountPrice ?? null,

        stock: value.stock,

        lowStockThreshold: value.lowStockThreshold,

        sku,

        metaTitle: value.metaTitle || "",

        metaDescription: value.metaDescription || "",

        isFeatured: value.isFeatured,
      };

      if (req.user.role === "admin") {
        productData.approvalStatus = "approved";

        productData.status = "active";

        productData.approvedBy = req.user._id;

        productData.approvedAt = new Date();

        productData.publishedAt = new Date();
      } else {
        productData.approvalStatus = "pending";

        productData.status = "inactive";

        productData.publishedAt = null;
      }

      const product = await Product.create(productData);

      await createAuditLog({
        req,

        actor: req.user,

        module: "Product",

        action: "Create Product",

        target: {
          model: "Product",

          id: product._id,

          name: product.name,
        },

        description: `${req.user.name} created product '${product.name}'.`,
      });

      logger.info(`Product '${product.name}' created successfully.`);

      // return res.redirect(`/admin/products/${product._id}/edit`);
      return res.redirect("/admin/products");
    } catch (error) {
      for (const publicId of uploadedPublicIds) {
        try {
          await cloudinaryImageDelete(publicId);
        } catch (deleteError) {
          logger.error(
            `Rollback failed for image '${publicId}': ${deleteError.message}`,
          );
        }
      }

      if (req.files?.length) {
        await Promise.all(req.files.map((file) => deleteLocalFile(file.path)));
      }

      logger.error(`Create product failed: ${error.message}`);

      return res.redirect("/admin/products/create");
    }
  }

  // Show edit product page
  async showEditProductPage(req, res) {
    try {
      const { productId } = req.params;

      logger.info(`Opening edit page for product: ${productId}`);

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        logger.warn(`Invalid product ID: ${productId}`);

        return res.redirect("/admin/products");
      }

      // Find product
      const productQuery = {
        _id: productId,
        isDeleted: false,
      };

      // Seller can only edit his own products
      if (req.user.role === "seller") {
        productQuery.seller = req.user._id;
      }

      const [product, categories, brands] = await Promise.all([
        Product.findOne(productQuery).lean(),

        Category.find({}).select("name").sort({ name: 1 }).lean(),

        Brand.find({}).select("name").sort({ name: 1 }).lean(),
      ]);

      // Product doesn't exist
      if (!product) {
        logger.warn(`Product not found for edit: ${productId}`);

        return res.redirect("/admin/products");
      }

      // Find category
      const category = await Category.findById(product.category)
        .select("name")
        .lean();

      // Find brand
      const brand = await Brand.findById(product.brand).select("name").lean();

      // Convert ObjectIds into the same structure
      // expected by edit.ejs
      product.category = category || null;
      product.brand = brand || null;

      logger.info(`Opening edit page for product '${product.name}'.`);

      return res.render("admin/products/edit", {
        title: "Edit Product",
        product,
        categories,
        brands,
      });
    } catch (error) {
      logger.error(
        `Show edit product page failed: ${error.stack || error.message}`,
      );

      return res.redirect("/admin/products");
    }
  }

  // Update product
  // async updateProduct(req, res) {
  //   const uploadedPublicIds = [];

  //   try {
  //     const { productId } = req.params;

  //     // Find existing product
  //     const product = await Product.findOne({
  //       _id: productId,
  //       isDeleted: false,
  //     });

  //     if (!product) {
  //       logger.warn(`Product not found: ${productId}`);

  //       if (req.files?.length) {
  //         await Promise.all(
  //           req.files.map((file) => deleteLocalFile(file.path)),
  //         );
  //       }

  //       return res.redirect("/admin/products");
  //     }

  //     // Seller can edit only his own product
  //     if (
  //       req.user.role === "seller" &&
  //       product.seller.toString() !== req.user._id.toString()
  //     ) {
  //       if (req.files?.length) {
  //         await Promise.all(
  //           req.files.map((file) => deleteLocalFile(file.path)),
  //         );
  //       }

  //       logger.warn(
  //         `Seller ${req.user._id} attempted to edit product ${productId}`,
  //       );

  //       return res.redirect("/admin/products");
  //     }

  //     // --------------------------------------------------
  //     // Basic values
  //     // --------------------------------------------------

  //     const name = req.body.name?.trim();
  //     const shortDescription = req.body.shortDescription?.trim() || "";

  //     const description = req.body.description?.trim() || "";

  //     const category = req.body.category;
  //     const brand = req.body.brand;

  //     const price = Number(req.body.price) || 0;

  //     const discountPrice =
  //       req.body.discountPrice !== undefined && req.body.discountPrice !== ""
  //         ? Number(req.body.discountPrice)
  //         : null;

  //     const stock = Number(req.body.stock) || 0;

  //     const lowStockThreshold = Number(req.body.lowStockThreshold) || 0;

  //     const metaTitle = req.body.metaTitle?.trim() || "";

  //     const metaDescription = req.body.metaDescription?.trim() || "";

  //     const isFeatured =
  //       req.body.isFeatured === "true" || req.body.isFeatured === "on";

  //     // --------------------------------------------------
  //     // Required fields
  //     // --------------------------------------------------

  //     if (!name) {
  //       if (req.files?.length) {
  //         await Promise.all(
  //           req.files.map((file) => deleteLocalFile(file.path)),
  //         );
  //       }

  //       return res.redirect(`/admin/products/${productId}/edit`);
  //     }

  //     if (!category || !brand) {
  //       if (req.files?.length) {
  //         await Promise.all(
  //           req.files.map((file) => deleteLocalFile(file.path)),
  //         );
  //       }

  //       return res.redirect(`/admin/products/${productId}/edit`);
  //     }

  //     // --------------------------------------------------
  //     // Check category
  //     // --------------------------------------------------

  //     const categoryExists = await Category.findById(category).lean();

  //     if (!categoryExists) {
  //       if (req.files?.length) {
  //         await Promise.all(
  //           req.files.map((file) => deleteLocalFile(file.path)),
  //         );
  //       }

  //       logger.warn("Selected category does not exist.");

  //       return res.redirect(`/admin/products/${productId}/edit`);
  //     }

  //     // --------------------------------------------------
  //     // Check brand
  //     // --------------------------------------------------

  //     const brandExists = await Brand.findById(brand).lean();

  //     if (!brandExists) {
  //       if (req.files?.length) {
  //         await Promise.all(
  //           req.files.map((file) => deleteLocalFile(file.path)),
  //         );
  //       }

  //       logger.warn("Selected brand does not exist.");

  //       return res.redirect(`/admin/products/${productId}/edit`);
  //     }

  //     // --------------------------------------------------
  //     // Upload new images
  //     // --------------------------------------------------

  //     if (uploadedImages.length) {
  //       const combinedImages = [...product.images, ...uploadedImages];

  //       // Maximum 5 images
  //       product.images = combinedImages.slice(0, 5);

  //       // Make sure exactly one image is primary
  //       const hasPrimary = product.images.some(
  //         (image) => image.isPrimary === true,
  //       );

  //       if (!hasPrimary && product.images.length > 0) {
  //         product.images[0].isPrimary = true;
  //       }
  //     }
  //     // --------------------------------------------------
  //     // Update product fields
  //     // --------------------------------------------------

  //     product.name = name;
  //     product.shortDescription = shortDescription;
  //     product.description = description;

  //     product.category = category;
  //     product.brand = brand;

  //     product.price = price;
  //     product.discountPrice = discountPrice;

  //     product.stock = stock;
  //     product.lowStockThreshold = lowStockThreshold;

  //     product.metaTitle = metaTitle;
  //     product.metaDescription = metaDescription;

  //     product.isFeatured = isFeatured;

  //     product.updatedBy = req.user._id;

  //     // --------------------------------------------------
  //     // Images
  //     // --------------------------------------------------

  //     if (uploadedImages.length) {
  //       const oldImages = [...product.images];

  //       product.images = uploadedImages;

  //       // Delete old Cloudinary images
  //       for (const image of oldImages) {
  //         if (image.publicId) {
  //           try {
  //             await cloudinaryImageDelete(image.publicId);
  //           } catch (deleteError) {
  //             logger.error(
  //               `Failed to delete old image ${image.publicId}: ${deleteError.message}`,
  //             );
  //           }
  //         }
  //       }
  //     }

  //     // --------------------------------------------------
  //     // Admin / Seller status
  //     // --------------------------------------------------

  //     if (req.user.role === "admin") {
  //       product.approvalStatus = "approved";
  //       product.approvedBy = req.user._id;
  //       product.approvedAt = new Date();

  //       if (product.stock === 0) {
  //         product.status = "out-of-stock";
  //       } else {
  //         product.status =
  //           req.body.status === "inactive" ? "inactive" : "active";
  //       }

  //       if (!product.publishedAt) {
  //         product.publishedAt = new Date();
  //       }
  //     } else {
  //       // Seller update
  //       if (
  //         product.approvalStatus === "approved" ||
  //         product.approvalStatus === "rejected"
  //       ) {
  //         product.approvalStatus = "pending";
  //         product.approvedBy = null;
  //         product.approvedAt = null;
  //         product.publishedAt = null;
  //         product.adminRemark = "";
  //         product.status = "inactive";

  //         product.resubmissionCount = (product.resubmissionCount || 0) + 1;
  //       }
  //     }

  //     // --------------------------------------------------
  //     // Save
  //     // --------------------------------------------------

  //     await product.save();

  //     // --------------------------------------------------
  //     // Audit
  //     // --------------------------------------------------

  //     await createAuditLog({
  //       req,
  //       actor: req.user,
  //       module: "Products",
  //       action: "Update Product",
  //       target: {
  //         model: "Product",
  //         id: product._id,
  //         name: product.name,
  //       },
  //       description: `${req.user.name} updated product '${product.name}'.`,
  //     });

  //     logger.info(`Product '${product.name}' updated successfully.`);

  //     // Stay on edit page
  //     return res.redirect(`/admin/products/${product._id}/edit`);
  //   } catch (error) {
  //     for (const publicId of uploadedPublicIds) {
  //       try {
  //         await cloudinaryImageDelete(publicId);
  //       } catch (deleteError) {
  //         logger.error(
  //           `Rollback failed for image '${publicId}': ${deleteError.message}`,
  //         );
  //       }
  //     }

  //     if (req.files?.length) {
  //       await Promise.all(req.files.map((file) => deleteLocalFile(file.path)));
  //     }

  //     logger.error(`Update product failed: ${error.stack || error.message}`);

  //     return res.redirect(`/admin/products/${req.params.productId}/edit`);
  //   }
  // }

  // Update product
  async updateProduct(req, res) {
    const uploadedPublicIds = [];

    try {
      const { productId } = req.params;

      // --------------------------------------------------
      // Find existing product
      // --------------------------------------------------

      const product = await Product.findOne({
        _id: productId,
        isDeleted: false,
      });

      if (!product) {
        logger.warn(`Product not found: ${productId}`);

        if (req.files?.length) {
          await Promise.all(
            req.files.map((file) => deleteLocalFile(file.path)),
          );
        }

        return res.redirect("/admin/products");
      }

      // --------------------------------------------------
      // Seller can edit only his own product
      // --------------------------------------------------

      if (
        req.user.role === "seller" &&
        product.seller.toString() !== req.user._id.toString()
      ) {
        if (req.files?.length) {
          await Promise.all(
            req.files.map((file) => deleteLocalFile(file.path)),
          );
        }

        logger.warn(
          `Seller ${req.user._id} attempted to edit product ${productId}`,
        );

        return res.redirect("/admin/products");
      }

      // --------------------------------------------------
      // Basic values
      // --------------------------------------------------

      const name = req.body.name?.trim();

      const shortDescription = req.body.shortDescription?.trim() || "";

      const description = req.body.description?.trim() || "";

      const category = req.body.category;

      const brand = req.body.brand;

      const price = Number(req.body.price) || 0;

      const discountPrice =
        req.body.discountPrice !== undefined && req.body.discountPrice !== ""
          ? Number(req.body.discountPrice)
          : null;

      const stock = Number(req.body.stock) || 0;

      const lowStockThreshold = Number(req.body.lowStockThreshold) || 0;

      const metaTitle = req.body.metaTitle?.trim() || "";

      const metaDescription = req.body.metaDescription?.trim() || "";

      const isFeatured =
        req.body.isFeatured === "true" || req.body.isFeatured === "on";

      // --------------------------------------------------
      // Required fields
      // --------------------------------------------------

      if (!name) {
        if (req.files?.length) {
          await Promise.all(
            req.files.map((file) => deleteLocalFile(file.path)),
          );
        }

        return res.redirect(`/admin/products/${productId}/edit`);
      }

      if (!category || !brand) {
        if (req.files?.length) {
          await Promise.all(
            req.files.map((file) => deleteLocalFile(file.path)),
          );
        }

        return res.redirect(`/admin/products/${productId}/edit`);
      }

      // --------------------------------------------------
      // Check category
      // --------------------------------------------------

      const categoryExists = await Category.findById(category).lean();

      if (!categoryExists) {
        if (req.files?.length) {
          await Promise.all(
            req.files.map((file) => deleteLocalFile(file.path)),
          );
        }

        logger.warn("Selected category does not exist.");

        return res.redirect(`/admin/products/${productId}/edit`);
      }

      // --------------------------------------------------
      // Check brand
      // --------------------------------------------------

      const brandExists = await Brand.findById(brand).lean();

      if (!brandExists) {
        if (req.files?.length) {
          await Promise.all(
            req.files.map((file) => deleteLocalFile(file.path)),
          );
        }

        logger.warn("Selected brand does not exist.");

        return res.redirect(`/admin/products/${productId}/edit`);
      }

      // ==================================================
      // IMAGE MANAGEMENT
      // ==================================================

      /*
       * existingImages[] contains the publicId of every
       * existing image that the user wants to KEEP.
       *
       * If an old image was removed from the edit page,
       * its publicId will not be present here.
       */

      let existingImages = req.body.existingImages || [];

      // Always convert to array
      if (!Array.isArray(existingImages)) {
        existingImages = [existingImages];
      }

      // Remove empty values
      existingImages = existingImages.filter(
        (publicId) => publicId && publicId.trim() !== "",
      );

      // --------------------------------------------------
      // Existing images from database
      // --------------------------------------------------

      const oldImages = Array.isArray(product.images)
        ? [...product.images]
        : [];

      // --------------------------------------------------
      // Keep only images selected by the user
      // --------------------------------------------------

      const imagesToKeep = oldImages.filter((image) =>
        existingImages.includes(image.publicId),
      );

      // --------------------------------------------------
      // New uploaded images
      // --------------------------------------------------

      const newImageFiles = req.files || [];

      // --------------------------------------------------
      // Check maximum 5 images
      // --------------------------------------------------

      const totalImageCount = imagesToKeep.length + newImageFiles.length;

      if (totalImageCount > 5) {
        if (newImageFiles.length) {
          await Promise.all(
            newImageFiles.map((file) => deleteLocalFile(file.path)),
          );
        }

        logger.warn(`Product ${productId} cannot have more than 5 images.`);

        return res.redirect(`/admin/products/${productId}/edit`);
      }

      // --------------------------------------------------
      // Check minimum 1 image
      // --------------------------------------------------

      if (totalImageCount < 1) {
        if (newImageFiles.length) {
          await Promise.all(
            newImageFiles.map((file) => deleteLocalFile(file.path)),
          );
        }

        logger.warn(`Product ${productId} must have at least one image.`);

        return res.redirect(`/admin/products/${productId}/edit`);
      }

      // --------------------------------------------------
      // Upload new images
      // --------------------------------------------------

      const uploadedImages = [];

      for (let index = 0; index < newImageFiles.length; index++) {
        const file = newImageFiles[index];

        try {
          const uploadedImage = await cloudinaryImageUpload(file.path);

          uploadedPublicIds.push(uploadedImage.public_id);

          uploadedImages.push({
            publicId: uploadedImage.public_id,

            url: uploadedImage.secure_url,

            alt: `${name} Image ${index + 1}`,

            isPrimary: false,
          });

          await deleteLocalFile(file.path);
        } catch (error) {
          await deleteLocalFile(file.path);

          throw error;
        }
      }

      // --------------------------------------------------
      // Combine existing + new images
      // --------------------------------------------------

      const finalImages = [...imagesToKeep, ...uploadedImages];

      // --------------------------------------------------
      // Make first image primary
      // --------------------------------------------------

      finalImages.forEach((image, index) => {
        image.isPrimary = index === 0;
      });

      // --------------------------------------------------
      // Update product images
      // --------------------------------------------------

      product.images = finalImages;

      // --------------------------------------------------
      // Delete removed old Cloudinary images
      // --------------------------------------------------

      const removedImages = oldImages.filter(
        (oldImage) => !existingImages.includes(oldImage.publicId),
      );

      for (const image of removedImages) {
        if (!image.publicId) {
          continue;
        }

        try {
          await cloudinaryImageDelete(image.publicId);
        } catch (deleteError) {
          logger.error(
            `Failed to delete removed image ${image.publicId}: ${deleteError.message}`,
          );
        }
      }

      // ==================================================
      // UPDATE PRODUCT FIELDS
      // ==================================================

      product.name = name;

      product.shortDescription = shortDescription;

      product.description = description;

      product.category = category;

      product.brand = brand;

      product.price = price;

      product.discountPrice = discountPrice;

      product.stock = stock;

      product.lowStockThreshold = lowStockThreshold;

      product.metaTitle = metaTitle;

      product.metaDescription = metaDescription;

      product.isFeatured = isFeatured;

      product.updatedBy = req.user._id;

      // ==================================================
      // ADMIN / SELLER STATUS
      // ==================================================

      if (req.user.role === "admin") {
        product.approvalStatus = "approved";

        product.approvedBy = req.user._id;

        product.approvedAt = new Date();

        // Out of stock automatically
        // takes priority over active/inactive.

        if (product.stock === 0) {
          product.status = "out-of-stock";
        } else {
          product.status =
            req.body.status === "inactive" ? "inactive" : "active";
        }

        if (!product.publishedAt) {
          product.publishedAt = new Date();
        }
      } else {
        // ------------------------------------------------
        // Seller update
        // ------------------------------------------------

        if (
          product.approvalStatus === "approved" ||
          product.approvalStatus === "rejected"
        ) {
          product.approvalStatus = "pending";

          product.approvedBy = null;

          product.approvedAt = null;

          product.publishedAt = null;

          product.adminRemark = "";

          product.status = "inactive";

          product.resubmissionCount = (product.resubmissionCount || 0) + 1;
        }
      }

      // ==================================================
      // SAVE
      // ==================================================

      await product.save();

      // ==================================================
      // AUDIT LOG
      // ==================================================

      await createAuditLog({
        req,

        actor: req.user,

        module: "Products",

        action: "Update Product",

        target: {
          model: "Product",

          id: product._id,

          name: product.name,
        },

        description: `${req.user.name} updated product '${product.name}'.`,
      });

      logger.info(`Product '${product.name}' updated successfully.`);

      // Redirect to Product Management after successful update
      return res.redirect("/admin/products");
    } catch (error) {
      // ==================================================
      // ROLLBACK NEW CLOUDINARY IMAGES
      // ==================================================

      for (const publicId of uploadedPublicIds) {
        try {
          await cloudinaryImageDelete(publicId);
        } catch (deleteError) {
          logger.error(
            `Rollback failed for image '${publicId}': ${deleteError.message}`,
          );
        }
      }

      // ==================================================
      // DELETE TEMPORARY LOCAL FILES
      // ==================================================

      if (req.files?.length) {
        await Promise.all(req.files.map((file) => deleteLocalFile(file.path)));
      }

      // ==================================================
      // LOG ERROR
      // ==================================================

      logger.error(`Update product failed: ${error.stack || error.message}`);

      return res.redirect(`/admin/products/${req.params.productId}/edit`);
    }
  }

  // Show pending products page
  async showPendingProductsPage(req, res) {
    try {
      const { error, value } = productQueryValidation.validate(req.query);

      if (error) {
        logger.warn(error.details.map((detail) => detail.message).join(" "));

        return res.redirect("/admin/products/pending");
      }

      const { page, limit, search, category, brand, sortBy, sortOrder } = value;

      const matchStage = {
        isDeleted: false,
        approvalStatus: "pending",
      };

      if (search) {
        matchStage.$text = {
          $search: search,
        };
      }

      if (category) {
        matchStage.category = category;
      }

      if (brand) {
        matchStage.brand = brand;
      }

      const sortStage = {
        [sortBy]: sortOrder === "asc" ? 1 : -1,
      };

      const [result, categories, brands] = await Promise.all([
        Product.aggregate([
          {
            $match: matchStage,
          },

          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "_id",
              as: "category",
            },
          },

          {
            $unwind: "$category",
          },

          {
            $lookup: {
              from: "brands",
              localField: "brand",
              foreignField: "_id",
              as: "brand",
            },
          },

          {
            $unwind: "$brand",
          },

          {
            $lookup: {
              from: "users",
              localField: "seller",
              foreignField: "_id",
              as: "seller",
            },
          },

          {
            $unwind: "$seller",
          },

          {
            $project: {
              name: 1,
              slug: 1,
              images: 1,
              price: 1,
              stock: 1,
              createdAt: 1,

              "category._id": 1,
              "category.name": 1,

              "brand._id": 1,
              "brand.name": 1,

              "seller._id": 1,
              "seller.name": 1,
              "seller.email": 1,
            },
          },

          {
            $sort: sortStage,
          },

          {
            $facet: {
              products: [
                {
                  $skip: (page - 1) * limit,
                },

                {
                  $limit: limit,
                },
              ],

              pagination: [
                {
                  $count: "totalProducts",
                },
              ],
            },
          },
        ]),

        Category.find({}).select("name").sort({ name: 1 }).lean(),

        Brand.find({}).select("name").sort({ name: 1 }).lean(),
      ]);

      const products = result[0].products;

      const totalProducts = result[0].pagination[0]?.totalProducts || 0;

      const totalPages = Math.ceil(totalProducts / limit);

      return res.render("admin/products/pending", {
        title: "Pending Products",

        products,

        categories,

        brands,

        filters: value,

        pagination: {
          page,
          limit,
          totalProducts,
          totalPages,
        },
      });
    } catch (error) {
      logger.error(`Show pending products page failed: ${error.message}`);

      return res.redirect("/admin/dashboard");
    }
  }

  // Approve product
  async approveProduct(req, res) {
    try {
      const { error: idError, value: params } = productIdValidation.validate(
        req.params,
      );

      if (idError) {
        logger.warn(idError.details.map((detail) => detail.message).join(" "));

        return res.redirect("/admin/products/pending");
      }

      const { error, value } = approveProductValidation.validate(req.body);

      if (error) {
        logger.warn(error.details.map((detail) => detail.message).join(" "));

        return res.redirect(`/admin/products/${params.productId}/edit`);
      }

      const product = await Product.findOne({
        _id: params.productId,
        isDeleted: false,
      });

      if (!product) {
        logger.warn("Product not found.");

        return res.redirect("/admin/products/pending");
      }

      if (product.approvalStatus === "approved") {
        logger.warn("Product is already approved.");

        return res.redirect("/admin/products/pending");
      }

      product.approvalStatus = "approved";

      product.status = product.stock === 0 ? "out-of-stock" : "active";

      product.approvedBy = req.user._id;

      product.approvedAt = new Date();

      product.publishedAt = new Date();

      product.adminRemark = value.adminRemark || "";

      product.updatedBy = req.user._id;

      await product.save();

      // TODO:
      // Create seller notification

      await createAuditLog({
        req,

        actor: req.user,

        module: "Product",

        action: "Approve Product",

        target: {
          model: "Product",

          id: product._id,

          name: product.name,
        },

        description: `${req.user.name} approved product '${product.name}'.`,
      });

      logger.info(`Product '${product.name}' approved successfully.`);

      return res.redirect("/admin/products/pending");
    } catch (error) {
      logger.error(`Approve product failed: ${error.message}`);

      return res.redirect("/admin/products/pending");
    }
  }
  // Reject product
  async rejectProduct(req, res) {
    try {
      const { error: idError, value: params } = productIdValidation.validate(
        req.params,
      );

      if (idError) {
        logger.warn(idError.details.map((detail) => detail.message).join(" "));

        return res.redirect("/admin/products/pending");
      }

      const { error, value } = rejectProductValidation.validate(req.body);

      if (error) {
        logger.warn(error.details.map((detail) => detail.message).join(" "));

        return res.redirect(`/products/${params.productId}/edit`);
      }

      const product = await Product.findOne({
        _id: params.productId,
        isDeleted: false,
      });

      if (!product) {
        logger.warn("Product not found.");

        return res.redirect("/admin/products/pending");
      }

      if (product.approvalStatus === "rejected") {
        logger.warn("Product is already rejected.");

        return res.redirect("/admin/products/pending");
      }

      product.approvalStatus = "rejected";

      product.status = "inactive";

      product.approvedBy = null;

      product.approvedAt = null;

      product.publishedAt = null;

      product.adminRemark = value.adminRemark;

      product.updatedBy = req.user._id;

      await product.save();

      // TODO:
      // Create seller notification

      await createAuditLog({
        req,

        actor: req.user,

        module: "Product",

        action: "Reject Product",

        target: {
          model: "Product",

          id: product._id,

          name: product.name,
        },

        description: `${req.user.name} rejected product '${product.name}'.`,
      });

      logger.info(`Product '${product.name}' rejected successfully.`);

      return res.redirect("/admin/products/pending");
    } catch (error) {
      logger.error(`Reject product failed: ${error.message}`);

      return res.redirect("/admin/products/pending");
    }
  }
  // Toggle product status
  async toggleProductStatus(req, res) {
    try {
      const { error: idError, value: params } = productIdValidation.validate(
        req.params,
      );

      if (idError) {
        logger.warn(idError.details.map((detail) => detail.message).join(" "));

        return res.redirect("/admin/products");
      }

      const { error, value } = productStatusValidation.validate(req.body);

      if (error) {
        logger.warn(error.details.map((detail) => detail.message).join(" "));

        return res.redirect("/admin/products");
      }

      const product = await Product.findOne({
        _id: params.productId,
        isDeleted: false,
      });

      if (!product) {
        logger.warn("Product not found.");

        return res.redirect("/admin/products");
      }

      if (value.status === "active" && product.approvalStatus !== "approved") {
        logger.warn("Only approved products can be activated.");

        return res.redirect("/admin/products");
      }

      if (value.status === "out-of-stock" && product.stock > 0) {
        logger.warn("Product still has available stock.");

        return res.redirect("/admin/products");
      }

      if (value.status === "active" && product.stock === 0) {
        logger.warn("Cannot activate a product with zero stock.");

        return res.redirect("/admin/products");
      }

      product.status = value.status;

      product.updatedBy = req.user._id;

      await product.save();

      await createAuditLog({
        req,

        actor: req.user,

        module: "Product",

        action: "Update Product Status",

        target: {
          model: "Product",
          id: product._id,
          name: product.name,
        },

        description: `${req.user.name} changed product status to '${product.status}'.`,
      });

      logger.info(
        `Product '${product.name}' status updated to '${product.status}'.`,
      );

      return res.redirect("/admin/products");
    } catch (error) {
      logger.error(`Toggle product status failed: ${error.message}`);

      return res.redirect("/admin/products");
    }
  }
  // Toggle featured product
  async toggleFeaturedProduct(req, res) {
    try {
      const { error, value } = productIdValidation.validate(req.params);

      if (error) {
        logger.warn(error.details.map((detail) => detail.message).join(" "));

        return res.redirect("/admin/products");
      }

      const product = await Product.findOne({
        _id: value.productId,
        isDeleted: false,
      });

      if (!product) {
        logger.warn("Product not found.");

        return res.redirect("/admin/products");
      }

      if (product.approvalStatus !== "approved") {
        logger.warn("Only approved products can be featured.");

        return res.redirect("/admin/products");
      }

      product.isFeatured = !product.isFeatured;

      product.updatedBy = req.user._id;

      await product.save();

      await createAuditLog({
        req,

        actor: req.user,

        module: "Product",

        action: product.isFeatured ? "Feature Product" : "Unfeature Product",

        target: {
          model: "Product",

          id: product._id,

          name: product.name,
        },

        description: `${req.user.name} ${
          product.isFeatured ? "featured" : "removed from featured"
        } product '${product.name}'.`,
      });

      logger.info(
        `Product '${product.name}' featured status changed to ${product.isFeatured}.`,
      );

      return res.redirect("/admin/products");
    } catch (error) {
      logger.error(`Toggle featured product failed: ${error.message}`);

      return res.redirect("/admin/products");
    }
  }
  // Soft delete product
  async softDeleteProduct(req, res) {
    try {
      const { error, value } = productIdValidation.validate(req.params);

      if (error) {
        logger.warn(error.details.map((detail) => detail.message).join(" "));

        return res.redirect("/admin/products");
      }

      const product = await Product.findOne({
        _id: value.productId,
        isDeleted: false,
      });

      if (!product) {
        logger.warn("Product not found.");

        return res.redirect("/admin/products");
      }

      product.isDeleted = true;

      product.deletedAt = new Date();

      product.status = "inactive";

      product.updatedBy = req.user._id;

      await product.save();

      await createAuditLog({
        req,

        actor: req.user,

        module: "Product",

        action: "Soft Delete Product",

        target: {
          model: "Product",

          id: product._id,

          name: product.name,
        },

        description: `${req.user.name} soft deleted product '${product.name}'.`,
      });

      logger.info(`Product '${product.name}' soft deleted successfully.`);

      return res.redirect("/admin/products/trash");
    } catch (error) {
      logger.error(`Soft delete product failed: ${error.message}`);

      return res.redirect("/admin/products");
    }
  }
  // Restore product
  async restoreProduct(req, res) {
    try {
      const { error, value } = productIdValidation.validate(req.params);

      if (error) {
        logger.warn(error.details.map((detail) => detail.message).join(" "));

        return res.redirect("/admin/products/trash");
      }

      const product = await Product.findOne({
        _id: value.productId,
        isDeleted: true,
      });

      if (!product) {
        logger.warn("Product not found.");

        return res.redirect("/admin/products/trash");
      }

      product.isDeleted = false;

      product.deletedAt = null;

      if (product.approvalStatus === "approved") {
        product.status = product.stock === 0 ? "out-of-stock" : "active";
      } else {
        product.status = "inactive";
      }

      product.updatedBy = req.user._id;

      await product.save();

      await createAuditLog({
        req,

        actor: req.user,

        module: "Product",

        action: "Restore Product",

        target: {
          model: "Product",

          id: product._id,

          name: product.name,
        },

        description: `${req.user.name} restored product '${product.name}'.`,
      });

      logger.info(`Product '${product.name}' restored successfully.`);

      return res.redirect("/admin/products/trash");
    } catch (error) {
      logger.error(`Restore product failed: ${error.message}`);

      return res.redirect("/products/trash");
    }
  }
  // Delete product permanently
  // Delete product permanently
  async deleteProduct(req, res) {
    try {
      const { error, value } = productIdValidation.validate(req.params);

      // --------------------------------------------------
      // Validate Product ID
      // --------------------------------------------------

      if (error) {
        logger.warn(error.details.map((detail) => detail.message).join(" "));

        return res.redirect("/admin/products/trash");
      }

      // --------------------------------------------------
      // Find deleted product
      // --------------------------------------------------

      const product = await Product.findOne({
        _id: value.productId,
        isDeleted: true,
      });

      if (!product) {
        logger.warn("Product not found or has not been moved to trash.");

        return res.redirect("/admin/products/trash");
      }

      // --------------------------------------------------
      // Delete Cloudinary images
      // --------------------------------------------------

      for (const image of product.images || []) {
        if (image.publicId) {
          try {
            await cloudinaryImageDelete(image.publicId);
          } catch (imageError) {
            logger.error(
              `Failed to delete Cloudinary image ${image.publicId}: ${imageError.message}`,
            );
          }
        }
      }

      // --------------------------------------------------
      // Permanently delete product
      // --------------------------------------------------

      await Product.findByIdAndDelete(product._id);

      // --------------------------------------------------
      // Audit log
      // --------------------------------------------------

      await createAuditLog({
        req,

        actor: req.user,

        module: "Product",

        action: "Delete Product",

        target: {
          model: "Product",
          id: product._id,
          name: product.name,
        },

        description: `${req.user.name} permanently deleted product '${product.name}'.`,
      });

      // --------------------------------------------------
      // Logger
      // --------------------------------------------------

      logger.info(
        `Product '${product.name}' permanently deleted successfully.`,
      );

      // --------------------------------------------------
      // Redirect back to Product Trash
      // --------------------------------------------------

      return res.redirect("/admin/products/trash");
    } catch (error) {
      logger.error(`Delete product failed: ${error.stack || error.message}`);

      return res.redirect("/admin/products/trash");
    }
  }
  // Product details
  async getProductBySlug(req, res) {
    try {
      const { slug } = req.params;

      await Product.updateOne(
        {
          slug,
          approvalStatus: "approved",
          isDeleted: false,
        },
        {
          $inc: {
            views: 1,
          },
        },
      );

      const products = await Product.aggregate([
        {
          $match: {
            slug,
            approvalStatus: "approved",
            isDeleted: false,
          },
        },

        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category",
          },
        },

        {
          $unwind: {
            path: "$category",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $lookup: {
            from: "brands",
            localField: "brand",
            foreignField: "_id",
            as: "brand",
          },
        },

        {
          $unwind: {
            path: "$brand",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $lookup: {
            from: "users",
            localField: "seller",
            foreignField: "_id",
            as: "seller",
          },
        },

        {
          $unwind: {
            path: "$seller",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $project: {
            "seller.password": 0,
            "seller.refreshToken": 0,
            "seller.emailVerificationToken": 0,
            "seller.passwordResetToken": 0,
          },
        },
      ]);

      const product = products[0];

      if (!product) {
        logger.warn("Product not found.");

        return res.redirect("/admin/products");
      }

      return res.render("admin/products/details", {
        title: product.name,
        product,
      });
    } catch (error) {
      logger.error(`Get product failed: ${error.message}`);

      return res.redirect("/products");
    }
  }
  // Featured products
  async getFeaturedProducts(req, res) {
    try {
      const featuredProducts = await Product.aggregate([
        {
          $match: {
            isFeatured: true,
            approvalStatus: "approved",
            status: "active",
            isDeleted: false,
          },
        },

        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category",
          },
        },

        {
          $unwind: {
            path: "$category",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $lookup: {
            from: "brands",
            localField: "brand",
            foreignField: "_id",
            as: "brand",
          },
        },

        {
          $unwind: {
            path: "$brand",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $sort: {
            publishedAt: -1,
          },
        },

        {
          $limit: 8,
        },
      ]);

      return res.render("product/featured", {
        title: "Featured Products",
        products: featuredProducts,
      });
    } catch (error) {
      logger.error(`Get featured products failed: ${error.message}`);

      return res.redirect("/");
    }
  }
  // Latest products
  async getLatestProducts(req, res) {
    try {
      const latestProducts = await Product.aggregate([
        {
          $match: {
            approvalStatus: "approved",
            status: "active",
            isDeleted: false,
          },
        },

        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category",
          },
        },

        {
          $unwind: {
            path: "$category",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $lookup: {
            from: "brands",
            localField: "brand",
            foreignField: "_id",
            as: "brand",
          },
        },

        {
          $unwind: {
            path: "$brand",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $sort: {
            publishedAt: -1,
          },
        },

        {
          $limit: 12,
        },
      ]);

      return res.render("product/latest", {
        title: "Latest Products",
        products: latestProducts,
      });
    } catch (error) {
      logger.error(`Get latest products failed: ${error.message}`);

      return res.redirect("/");
    }
  }
  // Related products
  async getRelatedProducts(req, res) {
    try {
      const { productId } = req.params;

      const product = await Product.findOne({
        _id: productId,
        approvalStatus: "approved",
        isDeleted: false,
      }).select("category");

      if (!product) {
        return res.status(httpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Product not found.",
        });
      }

      const relatedProducts = await Product.aggregate([
        {
          $match: {
            _id: {
              $ne: product._id,
            },
            category: product.category,
            approvalStatus: "approved",
            status: "active",
            isDeleted: false,
          },
        },

        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category",
          },
        },

        {
          $unwind: {
            path: "$category",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $lookup: {
            from: "brands",
            localField: "brand",
            foreignField: "_id",
            as: "brand",
          },
        },

        {
          $unwind: {
            path: "$brand",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $sort: {
            soldCount: -1,
            averageRating: -1,
            views: -1,
          },
        },

        {
          $limit: 8,
        },
      ]);

      return res.status(httpStatusCode.OK).json({
        success: true,
        products: relatedProducts,
      });
    } catch (error) {
      logger.error(`Get related products failed: ${error.message}`);

      return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Unable to load related products.",
      });
    }
  }

  // Show product trash page
  // Show product trash page
  async showTrashProductsPage(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        category = "",
        brand = "",
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      const currentPage = Math.max(Number(page) || 1, 1);

      const allowedLimits = [10, 30, 50, 100];

      const requestedLimit = Number(limit) || 10;

      const perPage = allowedLimits.includes(requestedLimit)
        ? requestedLimit
        : 10;

      const matchStage = {
        isDeleted: true,
      };

      // Seller can only see his own products
      if (req.user.role === "seller") {
        matchStage.seller = req.user._id;
      }

      // Category filter
      if (category) {
        matchStage.category = category;
      }

      // Brand filter
      if (brand) {
        matchStage.brand = brand;
      }

      /*
    ==========================================================
    SEARCH
    Product ID + Product Name + Category
    ==========================================================
    */

      const escapedSearch = search
        ? search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        : "";

      /*
    ==========================================================
    SORT
    ==========================================================
    */

      let sortStage;

      if (sortBy === "name") {
        sortStage = {
          name: sortOrder === "asc" ? 1 : -1,
        };
      } else {
        sortStage = {
          createdAt: sortOrder === "asc" ? 1 : -1,
        };
      }

      const [result, categories, brands] = await Promise.all([
        Product.aggregate([
          {
            $match: matchStage,
          },

          // Category
          {
            $lookup: {
              from: "categories",
              localField: "category",
              foreignField: "_id",
              as: "category",
            },
          },

          {
            $unwind: {
              path: "$category",
              preserveNullAndEmptyArrays: true,
            },
          },

          // Brand
          {
            $lookup: {
              from: "brands",
              localField: "brand",
              foreignField: "_id",
              as: "brand",
            },
          },

          {
            $unwind: {
              path: "$brand",
              preserveNullAndEmptyArrays: true,
            },
          },

          // Seller
          {
            $lookup: {
              from: "users",
              localField: "seller",
              foreignField: "_id",
              as: "seller",
            },
          },

          {
            $unwind: {
              path: "$seller",
              preserveNullAndEmptyArrays: true,
            },
          },

          /*
        ======================================================
        SEARCH
        ======================================================
        */

          ...(search
            ? [
                {
                  $match: {
                    $or: [
                      {
                        name: {
                          $regex: escapedSearch,
                          $options: "i",
                        },
                      },

                      {
                        "category.name": {
                          $regex: escapedSearch,
                          $options: "i",
                        },
                      },

                      {
                        sku: {
                          $regex: escapedSearch,
                          $options: "i",
                        },
                      },

                      {
                        $expr: {
                          $regexMatch: {
                            input: {
                              $toString: "$_id",
                            },
                            regex: escapedSearch,
                            options: "i",
                          },
                        },
                      },
                    ],
                  },
                },
              ]
            : []),

          {
            $project: {
              _id: 1,

              name: 1,
              slug: 1,
              images: 1,

              price: 1,
              discountPrice: 1,

              stock: 1,

              status: 1,
              approvalStatus: 1,

              deletedAt: 1,
              createdAt: 1,

              "category._id": 1,
              "category.name": 1,

              "brand._id": 1,
              "brand.name": 1,

              "seller._id": 1,
              "seller.name": 1,
            },
          },

          {
            $sort: sortStage,
          },

          {
            $facet: {
              products: [
                {
                  $skip: (currentPage - 1) * perPage,
                },

                {
                  $limit: perPage,
                },
              ],

              pagination: [
                {
                  $count: "totalProducts",
                },
              ],
            },
          },
        ]),

        Category.find({}).select("name").sort({ name: 1 }).lean(),

        Brand.find({}).select("name").sort({ name: 1 }).lean(),
      ]);

      const products = result[0]?.products || [];

      const totalProducts = result[0]?.pagination[0]?.totalProducts || 0;

      const totalPages = Math.ceil(totalProducts / perPage);

      return res.render("admin/products/trash", {
        title: "Product Trash",

        products,

        categories,

        brands,

        filters: {
          page: currentPage,
          limit: perPage,
          search,
          category,
          brand,
          sortBy,
          sortOrder,
        },

        pagination: {
          page: currentPage,
          limit: perPage,
          totalProducts,
          totalPages,
        },
      });
    } catch (error) {
      logger.error(`Show product trash page failed: ${error.message}`);

      return res.redirect("/admin/products");
    }
  }
  // Product analytics
  async getProductAnalytics(req, res) {
    try {
      const [analytics] = await Product.aggregate([
        {
          $group: {
            _id: null,

            totalProducts: {
              $sum: 1,
            },

            activeProducts: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$status", "active"],
                  },
                  1,
                  0,
                ],
              },
            },

            inactiveProducts: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$status", "inactive"],
                  },
                  1,
                  0,
                ],
              },
            },

            outOfStockProducts: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$status", "out-of-stock"],
                  },
                  1,
                  0,
                ],
              },
            },

            pendingProducts: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$approvalStatus", "pending"],
                  },
                  1,
                  0,
                ],
              },
            },

            approvedProducts: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$approvalStatus", "approved"],
                  },
                  1,
                  0,
                ],
              },
            },

            rejectedProducts: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$approvalStatus", "rejected"],
                  },
                  1,
                  0,
                ],
              },
            },

            featuredProducts: {
              $sum: {
                $cond: ["$isFeatured", 1, 0],
              },
            },

            deletedProducts: {
              $sum: {
                $cond: ["$isDeleted", 1, 0],
              },
            },

            totalViews: {
              $sum: "$views",
            },

            totalSoldProducts: {
              $sum: "$soldCount",
            },

            totalInventory: {
              $sum: "$stock",
            },

            totalInventoryValue: {
              $sum: {
                $multiply: [
                  "$stock",
                  {
                    $cond: [
                      {
                        $gt: ["$discountPrice", 0],
                      },
                      "$discountPrice",
                      "$price",
                    ],
                  },
                ],
              },
            },
          },
        },
      ]);

      return res.render("admin/products/analytics", {
        title: "Product Analytics",
        analytics: analytics || {
          totalProducts: 0,
          activeProducts: 0,
          inactiveProducts: 0,
          outOfStockProducts: 0,
          pendingProducts: 0,
          approvedProducts: 0,
          rejectedProducts: 0,
          featuredProducts: 0,
          deletedProducts: 0,
          totalViews: 0,
          totalSoldProducts: 0,
          totalInventory: 0,
          totalInventoryValue: 0,
        },
      });
    } catch (error) {
      logger.error(`Get product analytics failed: ${error.message}`);

      return res.redirect("/products");
    }
  }
}

module.exports = new ProductController();
