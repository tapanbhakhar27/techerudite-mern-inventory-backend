const mongoose = require("mongoose");
const Category = require("../models/Category");
require("dotenv").config();

const categories = [
  { name: "Electronics" },
  { name: "Clothing" },
  { name: "Books" },
  { name: "Home & Garden" },
  { name: "Sports" },
  { name: "Beauty" },
  { name: "Toys" },
  { name: "Food & Beverages" },
];

async function seedCategories() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/inventory"
    );
    console.log("✓ Connected to MongoDB");

    await Category.deleteMany({});
    console.log("✓ Cleared existing categories");

    const result = await Category.insertMany(categories);
    console.log(`✓ ${result.length} categories seeded successfully`);

    process.exit(0);
  } catch (error) {
    console.error("✗ Error seeding categories:", error.message);
    process.exit(1);
  }
}

seedCategories();
