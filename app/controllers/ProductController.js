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
  async showProductsPage(req, res) {
    try {
      const { error, value } = productQueryValidation.validate(req.query);

      if (error) {
        req.flash(
          "error",
          error.details.map((detail) => detail.message).join(" "),
        );

        return res.redirect("/products");
      }

      const {
        page,
        limit,
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
      } = value;

      const matchStage = {
        isDeleted: false,
      };

      if (req.user.role === "seller") {
        matchStage.seller = req.user._id;
      }

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

      if (status) {
        matchStage.status = status;
      }

      if (approvalStatus) {
        matchStage.approvalStatus = approvalStatus;
      }

      if (typeof isFeatured === "boolean") {
        matchStage.isFeatured = isFeatured;
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        matchStage.price = {};

        if (minPrice !== undefined) {
          matchStage.price.$gte = minPrice;
        }

        if (maxPrice !== undefined) {
          matchStage.price.$lte = maxPrice;
        }
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
              discountPrice: 1,
              stock: 1,
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

        Category.find({
          isDeleted: false,
          status: "active",
        })
          .select("name")
          .sort({
            name: 1,
          })
          .lean(),

        Brand.find({
          isDeleted: false,
          status: "active",
        })
          .select("name")
          .sort({
            name: 1,
          })
          .lean(),
      ]);

      const products = result[0].products;

      const totalProducts = result[0].pagination[0]?.totalProducts || 0;

      const totalPages = Math.ceil(totalProducts / limit);

      return res.render("product/index", {
        title: "Products",

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
      logger.error(`Show products page failed: ${error.message}`);

      req.flash("error", "Unable to load products.");

      return res.redirect("/");
    }
  }
  // Show create product page
  async showCreateProductPage(req, res) {
    try {
      const [categories, brands] = await Promise.all([
        Category.aggregate([
          {
            $match: {
              isDeleted: false,
              status: "active",
            },
          },

          {
            $project: {
              name: 1,
              slug: 1,
            },
          },

          {
            $sort: {
              name: 1,
            },
          },
        ]),

        Brand.aggregate([
          {
            $match: {
              isDeleted: false,
              status: "active",
            },
          },

          {
            $project: {
              name: 1,
              slug: 1,
              logo: 1,
            },
          },

          {
            $sort: {
              name: 1,
            },
          },
        ]),
      ]);

      return res.render("product/create", {
        title: "Create Product",

        categories,

        brands,
      });
    } catch (error) {
      logger.error(`Show create product page failed: ${error.message}`);

      req.flash("error", "Unable to load create product page.");

      return res.redirect("/products");
    }
  }
  // Create product
  async createProduct(req, res) {
    const uploadedPublicIds = [];

    try {
      const { error, value } = createProductValidation.validate(req.body);

      if (error) {
        if (req.files?.length) {
          await Promise.all(
            req.files.map((file) => deleteLocalFile(file.path)),
          );
        }

        req.flash(
          "error",
          error.details.map((detail) => detail.message).join(" "),
        );

        return res.redirect("/products/create");
      }

      if (!req.files || req.files.length === 0) {
        req.flash("error", "At least one product image is required.");

        return res.redirect("/products/create");
      }

      const category = await Category.findOne({
        _id: value.category,
        isDeleted: false,
        status: "active",
      }).lean();

      if (!category) {
        await Promise.all(req.files.map((file) => deleteLocalFile(file.path)));

        req.flash("error", "Selected category does not exist.");

        return res.redirect("/products/create");
      }

      const brand = await Brand.findOne({
        _id: value.brand,
        isDeleted: false,
        status: "active",
      }).lean();

      if (!brand) {
        await Promise.all(req.files.map((file) => deleteLocalFile(file.path)));

        req.flash("error", "Selected brand does not exist.");

        return res.redirect("/products/create");
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

      req.flash("success", "Product created successfully.");

      return res.redirect(`/products/${product._id}/edit`);
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

      req.flash("error", "Unable to create product.");

      return res.redirect("/products/create");
    }
  }
  // Show edit product page
  async showEditProductPage(req, res) {
    try {
      const { error, value } = productIdValidation.validate(req.params);

      if (error) {
        req.flash(
          "error",
          error.details.map((detail) => detail.message).join(" "),
        );

        return res.redirect("/products");
      }

      const matchStage = {
        _id: value.productId,
        isDeleted: false,
      };

      if (req.user.role === "seller") {
        matchStage.seller = req.user._id;
      }

      const [products, categories, brands] = await Promise.all([
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
            $project: {
              name: 1,
              slug: 1,
              shortDescription: 1,
              description: 1,
              images: 1,
              price: 1,
              discountPrice: 1,
              stock: 1,
              lowStockThreshold: 1,
              sku: 1,
              status: 1,
              approvalStatus: 1,
              isFeatured: 1,
              metaTitle: 1,
              metaDescription: 1,
              adminRemark: 1,
              category: {
                _id: "$category._id",
                name: "$category.name",
              },
              brand: {
                _id: "$brand._id",
                name: "$brand.name",
              },
            },
          },
        ]),

        Category.aggregate([
          {
            $match: {
              isDeleted: false,
              status: "active",
            },
          },

          {
            $project: {
              name: 1,
            },
          },

          {
            $sort: {
              name: 1,
            },
          },
        ]),

        Brand.aggregate([
          {
            $match: {
              isDeleted: false,
              status: "active",
            },
          },

          {
            $project: {
              name: 1,
            },
          },

          {
            $sort: {
              name: 1,
            },
          },
        ]),
      ]);

      if (!products.length) {
        req.flash("error", "Product not found.");

        return res.redirect("/products");
      }

      return res.render("product/edit", {
        title: "Edit Product",

        product: products[0],

        categories,

        brands,
      });
    } catch (error) {
      logger.error(`Show edit product page failed: ${error.message}`);

      req.flash("error", "Unable to load product.");

      return res.redirect("/products");
    }
  }
  // Update product
  async updateProduct(req, res) {
    const uploadedPublicIds = [];

    try {
      const { error, value } = updateProductValidation.validate(req.body);

      if (error) {
        if (req.files?.length) {
          await Promise.all(
            req.files.map((file) => deleteLocalFile(file.path)),
          );
        }

        req.flash(
          "error",
          error.details.map((detail) => detail.message).join(" "),
        );

        return res.redirect(`/products/${req.params.productId}/edit`);
      }

      const { error: idError, value: params } = productIdValidation.validate(
        req.params,
      );

      if (idError) {
        if (req.files?.length) {
          await Promise.all(
            req.files.map((file) => deleteLocalFile(file.path)),
          );
        }

        req.flash(
          "error",
          idError.details.map((detail) => detail.message).join(" "),
        );

        return res.redirect("/products");
      }

      const product = await Product.findOne({
        _id: params.productId,
        isDeleted: false,
      });

      if (!product) {
        if (req.files?.length) {
          await Promise.all(
            req.files.map((file) => deleteLocalFile(file.path)),
          );
        }

        req.flash("error", "Product not found.");

        return res.redirect("/products");
      }

      if (
        req.user.role === "seller" &&
        product.seller.toString() !== req.user._id.toString()
      ) {
        if (req.files?.length) {
          await Promise.all(
            req.files.map((file) => deleteLocalFile(file.path)),
          );
        }

        req.flash("error", "You are not authorized to edit this product.");

        return res.redirect("/products");
      }

      if (value.category) {
        const category = await Category.findOne({
          _id: value.category,
          isDeleted: false,
          status: "active",
        }).lean();

        if (!category) {
          if (req.files?.length) {
            await Promise.all(
              req.files.map((file) => deleteLocalFile(file.path)),
            );
          }

          req.flash("error", "Selected category does not exist.");

          return res.redirect(`/products/${product._id}/edit`);
        }
      }

      if (value.brand) {
        const brand = await Brand.findOne({
          _id: value.brand,
          isDeleted: false,
          status: "active",
        }).lean();

        if (!brand) {
          if (req.files?.length) {
            await Promise.all(
              req.files.map((file) => deleteLocalFile(file.path)),
            );
          }

          req.flash("error", "Selected brand does not exist.");

          return res.redirect(`/products/${product._id}/edit`);
        }
      }

      let uploadedImages = [];

      if (req.files?.length) {
        for (let index = 0; index < req.files.length; index++) {
          const file = req.files[index];

          try {
            const uploadedImage = await cloudinaryImageUpload(file.path);

            uploadedPublicIds.push(uploadedImage.public_id);

            uploadedImages.push({
              publicId: uploadedImage.public_id,

              url: uploadedImage.secure_url,

              alt: `${value.name || product.name} Image ${index + 1}`,

              isPrimary: index === 0,
            });

            await deleteLocalFile(file.path);
          } catch (error) {
            await deleteLocalFile(file.path);

            throw error;
          }
        }
      }

      const updateData = {};

      if (value.name !== undefined) {
        updateData.name = value.name;
      }

      if (value.shortDescription !== undefined) {
        updateData.shortDescription = value.shortDescription;
      }

      if (value.description !== undefined) {
        updateData.description = value.description;
      }

      if (value.category !== undefined) {
        updateData.category = value.category;
      }

      if (value.brand !== undefined) {
        updateData.brand = value.brand;
      }

      if (value.price !== undefined) {
        updateData.price = value.price;
      }

      if (value.discountPrice !== undefined) {
        updateData.discountPrice = value.discountPrice;
      }

      if (value.stock !== undefined) {
        updateData.stock = value.stock;
      }

      if (value.lowStockThreshold !== undefined) {
        updateData.lowStockThreshold = value.lowStockThreshold;
      }

      if (value.metaTitle !== undefined) {
        updateData.metaTitle = value.metaTitle;
      }

      if (value.metaDescription !== undefined) {
        updateData.metaDescription = value.metaDescription;
      }

      if (value.isFeatured !== undefined) {
        updateData.isFeatured = value.isFeatured;
      }

      if (uploadedImages.length) {
        updateData.images = uploadedImages;
      }

      updateData.updatedBy = req.user._id;

      if (req.user.role === "admin") {
        updateData.approvalStatus = "approved";

        updateData.approvedBy = req.user._id;

        updateData.approvedAt = new Date();

        updateData.publishedAt = product.publishedAt || new Date();

        if (updateData.stock !== undefined) {
          updateData.status =
            updateData.stock === 0 ? "out-of-stock" : "active";
        }
      } else {
        if (
          product.approvalStatus === "approved" ||
          product.approvalStatus === "rejected"
        ) {
          updateData.approvalStatus = "pending";

          updateData.approvedBy = null;

          updateData.approvedAt = null;

          updateData.publishedAt = null;

          updateData.adminRemark = "";

          updateData.status = "inactive";

          updateData.resubmissionCount = product.resubmissionCount + 1;
        }
      }

      const oldImages = [...product.images];

      Object.assign(product, updateData);

      await product.save();

      if (uploadedImages.length) {
        for (const image of oldImages) {
          try {
            await cloudinaryImageDelete(image.publicId);
          } catch (deleteError) {
            logger.error(
              `Failed to delete old product image '${image.publicId}': ${deleteError.message}`,
            );
          }
        }
      }

      await createAuditLog({
        req,

        actor: req.user,

        module: "Product",

        action: "Update Product",

        target: {
          model: "Product",

          id: product._id,

          name: product.name,
        },

        description: `${req.user.name} updated product '${product.name}'.`,
      });

      logger.info(`Product '${product.name}' updated successfully.`);

      req.flash("success", "Product updated successfully.");

      return res.redirect(`/products/${product._id}/edit`);
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

      logger.error(`Update product failed: ${error.message}`);

      req.flash("error", "Unable to update product.");

      return res.redirect(`/products/${req.params.productId}/edit`);
    }
  }

  // Show pending products page
  async showPendingProductsPage(req, res) {
    try {
      const { error, value } = productQueryValidation.validate(req.query);

      if (error) {
        req.flash(
          "error",
          error.details.map((detail) => detail.message).join(" "),
        );

        return res.redirect("/products/pending");
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

        Category.aggregate([
          {
            $match: {
              isDeleted: false,
              status: "active",
            },
          },

          {
            $project: {
              name: 1,
            },
          },

          {
            $sort: {
              name: 1,
            },
          },
        ]),

        Brand.aggregate([
          {
            $match: {
              isDeleted: false,
              status: "active",
            },
          },

          {
            $project: {
              name: 1,
            },
          },

          {
            $sort: {
              name: 1,
            },
          },
        ]),
      ]);

      const products = result[0].products;

      const totalProducts = result[0].pagination[0]?.totalProducts || 0;

      const totalPages = Math.ceil(totalProducts / limit);

      return res.render("product/pending", {
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

      req.flash("error", "Unable to load pending products.");

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
        req.flash(
          "error",
          idError.details.map((detail) => detail.message).join(" "),
        );

        return res.redirect("/products/pending");
      }

      const { error, value } = approveProductValidation.validate(req.body);

      if (error) {
        req.flash(
          "error",
          error.details.map((detail) => detail.message).join(" "),
        );

        return res.redirect(`/products/${params.productId}/edit`);
      }

      const product = await Product.findOne({
        _id: params.productId,
        isDeleted: false,
      });

      if (!product) {
        req.flash("error", "Product not found.");

        return res.redirect("/products/pending");
      }

      if (product.approvalStatus === "approved") {
        req.flash("error", "Product is already approved.");

        return res.redirect("/products/pending");
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

      req.flash("success", "Product approved successfully.");

      return res.redirect("/products/pending");
    } catch (error) {
      logger.error(`Approve product failed: ${error.message}`);

      req.flash("error", "Unable to approve product.");

      return res.redirect("/products/pending");
    }
  }
  // Reject product
  async rejectProduct(req, res) {
    try {
      const { error: idError, value: params } = productIdValidation.validate(
        req.params,
      );

      if (idError) {
        req.flash(
          "error",
          idError.details.map((detail) => detail.message).join(" "),
        );

        return res.redirect("/products/pending");
      }

      const { error, value } = rejectProductValidation.validate(req.body);

      if (error) {
        req.flash(
          "error",
          error.details.map((detail) => detail.message).join(" "),
        );

        return res.redirect(`/products/${params.productId}/edit`);
      }

      const product = await Product.findOne({
        _id: params.productId,
        isDeleted: false,
      });

      if (!product) {
        req.flash("error", "Product not found.");

        return res.redirect("/products/pending");
      }

      if (product.approvalStatus === "rejected") {
        req.flash("error", "Product is already rejected.");

        return res.redirect("/products/pending");
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

      req.flash("success", "Product rejected successfully.");

      return res.redirect("/products/pending");
    } catch (error) {
      logger.error(`Reject product failed: ${error.message}`);

      req.flash("error", "Unable to reject product.");

      return res.redirect("/products/pending");
    }
  }
  // Toggle product status
  async toggleProductStatus(req, res) {
    try {
      const { error: idError, value: params } = productIdValidation.validate(
        req.params,
      );

      if (idError) {
        req.flash(
          "error",
          idError.details.map((detail) => detail.message).join(" "),
        );

        return res.redirect("/products");
      }

      const { error, value } = productStatusValidation.validate(req.body);

      if (error) {
        req.flash(
          "error",
          error.details.map((detail) => detail.message).join(" "),
        );

        return res.redirect("/products");
      }

      const product = await Product.findOne({
        _id: params.productId,
        isDeleted: false,
      });

      if (!product) {
        req.flash("error", "Product not found.");

        return res.redirect("/products");
      }

      if (value.status === "active" && product.approvalStatus !== "approved") {
        req.flash("error", "Only approved products can be activated.");

        return res.redirect("/products");
      }

      if (value.status === "out-of-stock" && product.stock > 0) {
        req.flash("error", "Product still has available stock.");

        return res.redirect("/products");
      }

      if (value.status === "active" && product.stock === 0) {
        req.flash("error", "Cannot activate a product with zero stock.");

        return res.redirect("/products");
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

      req.flash("success", "Product status updated successfully.");

      return res.redirect("/products");
    } catch (error) {
      logger.error(`Toggle product status failed: ${error.message}`);

      req.flash("error", "Unable to update product status.");

      return res.redirect("/products");
    }
  }
  // Toggle featured product
  async toggleFeaturedProduct(req, res) {
    try {
      const { error, value } = productIdValidation.validate(req.params);

      if (error) {
        req.flash(
          "error",
          error.details.map((detail) => detail.message).join(" "),
        );

        return res.redirect("/products");
      }

      const product = await Product.findOne({
        _id: value.productId,
        isDeleted: false,
      });

      if (!product) {
        req.flash("error", "Product not found.");

        return res.redirect("/products");
      }

      if (product.approvalStatus !== "approved") {
        req.flash("error", "Only approved products can be featured.");

        return res.redirect("/products");
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

      req.flash(
        "success",
        `Product ${
          product.isFeatured ? "featured" : "removed from featured"
        } successfully.`,
      );

      return res.redirect("/products");
    } catch (error) {
      logger.error(`Toggle featured product failed: ${error.message}`);

      req.flash("error", "Unable to update featured status.");

      return res.redirect("/products");
    }
  }
  // Soft delete product
  async softDeleteProduct(req, res) {
    try {
      const { error, value } = productIdValidation.validate(req.params);

      if (error) {
        req.flash(
          "error",
          error.details.map((detail) => detail.message).join(" "),
        );

        return res.redirect("/products");
      }

      const product = await Product.findOne({
        _id: value.productId,
        isDeleted: false,
      });

      if (!product) {
        req.flash("error", "Product not found.");

        return res.redirect("/products");
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

      req.flash("success", "Product moved to trash successfully.");

      return res.redirect("/products");
    } catch (error) {
      logger.error(`Soft delete product failed: ${error.message}`);

      req.flash("error", "Unable to delete product.");

      return res.redirect("/products");
    }
  }
  // Restore product
  async restoreProduct(req, res) {
    try {
      const { error, value } = productIdValidation.validate(req.params);

      if (error) {
        req.flash(
          "error",
          error.details.map((detail) => detail.message).join(" "),
        );

        return res.redirect("/products/trash");
      }

      const product = await Product.findOne({
        _id: value.productId,
        isDeleted: true,
      });

      if (!product) {
        req.flash("error", "Product not found.");

        return res.redirect("/products/trash");
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

      req.flash("success", "Product restored successfully.");

      return res.redirect("/products/trash");
    } catch (error) {
      logger.error(`Restore product failed: ${error.message}`);

      req.flash("error", "Unable to restore product.");

      return res.redirect("/products/trash");
    }
  }
  // Delete product permanently
  async deleteProduct(req, res) {
    try {
      const { error, value } = productIdValidation.validate(req.params);

      if (error) {
        req.flash(
          "error",
          error.details.map((detail) => detail.message).join(" "),
        );

        return res.redirect("/products/trash");
      }

      const product = await Product.findOne({
        _id: value.productId,
        isDeleted: true,
      });

      if (!product) {
        req.flash("error", "Product not found or has not been moved to trash.");

        return res.redirect("/products/trash");
      }

      for (const image of product.images) {
        if (image.publicId) {
          await cloudinaryImageDelete(image.publicId);
        }
      }

      await Product.findByIdAndDelete(product._id);

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

      logger.info(
        `Product '${product.name}' permanently deleted successfully.`,
      );

      req.flash("success", "Product deleted permanently.");

      return res.redirect("/products/trash");
    } catch (error) {
      logger.error(`Delete product failed: ${error.message}`);

      req.flash("error", "Unable to delete product.");

      return res.redirect("/products/trash");
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
        req.flash("error", "Product not found.");

        return res.redirect("/products");
      }

      return res.render("product/details", {
        title: product.name,
        product,
      });
    } catch (error) {
      logger.error(`Get product failed: ${error.message}`);

      req.flash("error", "Unable to load product.");

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

      req.flash("error", "Unable to load featured products.");

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

      req.flash("error", "Unable to load latest products.");

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
  async showTrashProductsPage(req, res) {
    try {
      const { error, value } = productQueryValidation.validate(req.query);

      if (error) {
        req.flash(
          "error",
          error.details.map((detail) => detail.message).join(" "),
        );

        return res.redirect("/products/trash");
      }

      const { page, limit, search, category, brand, sortBy, sortOrder } = value;

      const matchStage = {
        isDeleted: true,
      };

      if (req.user.role === "seller") {
        matchStage.seller = req.user._id;
      }

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

        Category.find({
          isDeleted: false,
          status: "active",
        })
          .select("name")
          .sort({
            name: 1,
          })
          .lean(),

        Brand.find({
          isDeleted: false,
          status: "active",
        })
          .select("name")
          .sort({
            name: 1,
          })
          .lean(),
      ]);

      const products = result[0].products;

      const totalProducts = result[0].pagination[0]?.totalProducts || 0;

      const totalPages = Math.ceil(totalProducts / limit);

      return res.render("product/trash", {
        title: "Product Trash",

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
      logger.error(`Show product trash page failed: ${error.message}`);

      req.flash("error", "Unable to load product trash.");

      return res.redirect("/products");
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

      return res.render("product/analytics", {
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

      req.flash("error", "Unable to load product analytics.");

      return res.redirect("/products");
    }
  }
}

module.exports = new ProductController();
