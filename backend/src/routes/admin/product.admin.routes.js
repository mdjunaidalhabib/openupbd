import express from "express";
import upload from "../../../utils/upload.js";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../../../controllers/productController.js";

const router = express.Router();

// 🔧 শুধুমাত্র প্রয়োজনীয় ফাইল ফিল্ড
const productUpload = upload.fields([
  { name: "image", maxCount: 1 }, // প্রধান ছবি
  { name: "images" }, // গ্যালারি ছবি
]);

// 🟢 নতুন পণ্য যোগ (Admin only)
router.post("/", productUpload, createProduct);

// 📦 সব পণ্য লোড
router.get("/", getProducts);

// 🔍 নির্দিষ্ট পণ্য
router.get("/:id", getProductById);

// 🟡 পণ্য আপডেট (Admin only)
router.put("/:id", productUpload, updateProduct);

// 🔴 পণ্য মুছে ফেলা (Admin only)
router.delete("/:id", deleteProduct);

export default router;
