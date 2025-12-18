const { body, validationResult } = require("express-validator");

const validateProduct = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Name must be 3-100 characters"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 10, max: 500 })
    .withMessage("Description must be 10-500 characters"),
  body("quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isInt({ min: 0 })
    .withMessage("Quantity must be a non-negative integer"),
  body("categories")
    .isArray({ min: 1 })
    .withMessage("At least one category is required")
    .custom((arr) => {
      if (!Array.isArray(arr)) return false;
      return arr.every((id) => /^[0-9a-fA-F]{24}$/.test(id));
    })
    .withMessage("Invalid category ID format"),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

module.exports = { validateProduct, handleValidationErrors };
