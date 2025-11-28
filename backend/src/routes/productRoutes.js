import express from "express";
import upload from "../../utils/upload.js";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  getProductById,
  getProductsByCategory,
} from "../../controllers/productController.js";

const router = express.Router();

// 🔧 শুধুমাত্র প্রয়োজনীয় ফাইল ফিল্ড
const productUpload = upload.fields([
  { name: "image", maxCount: 1 }, // প্রধান ছবি
  { name: "images" }, // গ্যালারি ছবি
]);

// ------------------- Routes -------------------

// 🟢 নতুন পণ্য যোগ
router.post("/", productUpload, createProduct);

// 🟡 পণ্য আপডেট
router.put("/:id", productUpload, updateProduct);

// 🔴 পণ্য মুছে ফেলা
router.delete("/:id", deleteProduct);

// 📦 সব পণ্য লোড
router.get("/", getProducts);

// 📂 ক্যাটাগরি অনুযায়ী পণ্য
router.get("/category/:categoryId", getProductsByCategory);

// 🔍 নির্দিষ্ট পণ্য
router.get("/:id", getProductById);

export default router;
