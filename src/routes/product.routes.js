const express = require("express");
const router = express.Router();
const {
  createProduct,
  getProducts,
  deleteProduct,
} = require("../controllers/product.controller");
const {
  validateProduct,
  handleValidationErrors,
} = require("../middlewares/validateProduct");

router.post("/", validateProduct, handleValidationErrors, createProduct);
router.get("/", getProducts);
router.delete("/:id", deleteProduct);

module.exports = router;
