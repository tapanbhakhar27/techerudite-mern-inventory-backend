const Category = require("../models/Category");
const { AppErrorHandler } = require("../common/errorHandler.util");

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    const errorResponse = AppErrorHandler.handle(
      error,
      "CategoryController",
      "getCategories"
    );
    res.status(errorResponse.statusCode).json(errorResponse);
  }
};
