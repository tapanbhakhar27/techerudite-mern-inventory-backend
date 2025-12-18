const Product = require("../models/Product");
const Category = require("../models/Category");
const { AppErrorHandler } = require("../common/errorHandler.util");

exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, quantity, categories } = req.body;

    const existingProduct = await Product.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
    });

    if (existingProduct) {
      AppErrorHandler.conflict("A product with this name already exists");
    }

    const validCategories = await Category.find({ _id: { $in: categories } });
    if (validCategories.length !== categories.length) {
      AppErrorHandler.badRequest("One or more categories do not exist");
    }

    const product = new Product({
      name: name.trim(),
      description: description.trim(),
      quantity: parseInt(quantity),
      categories,
    });

    await product.save();
    await product.populate("categories", "name");

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      data: product,
    });
  } catch (error) {
    const errorResponse = AppErrorHandler.handle(
      error,
      "ProductController",
      "createProduct"
    );
    res.status(errorResponse.statusCode).json(errorResponse);
  }
};

exports.getProducts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 10;
    const search = req.query.search ? req.query.search.trim() : "";
    const categoryIds = req.query.categories
      ? req.query.categories.split(",")
      : [];

    let filter = {};
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }
    if (categoryIds.length > 0) {
      filter.categories = { $in: categoryIds };
    }

    const total = await Product.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    if (page > totalPages && totalPages > 0) {
      AppErrorHandler.badRequest(
        `Page ${page} does not exist. Total pages: ${totalPages}`
      );
    }

    const products = await Product.find(filter)
      .populate("categories", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data: products,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts: total,
        limit,
      },
    });
  } catch (error) {
    const errorResponse = AppErrorHandler.handle(
      error,
      "ProductController",
      "getProducts"
    );
    res.status(errorResponse.statusCode).json(errorResponse);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      AppErrorHandler.badRequest("Invalid product ID format");
    }

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      AppErrorHandler.notFound("Product not found");
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
      data: product,
    });
  } catch (error) {
    const errorResponse = AppErrorHandler.handle(
      error,
      "ProductController",
      "deleteProduct"
    );
    res.status(errorResponse.statusCode).json(errorResponse);
  }
};
