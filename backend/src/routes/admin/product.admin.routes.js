import express from "express";
import upload from "../../../utils/upload.js";
import {
  createProduct,
  getProductsAdmin,
  getProductByIdAdmin,
  updateProduct,
  deleteProduct,
} from "../../../controllers/productController.js";

const router = express.Router();

/**
 * কেন upload.any() ব্যবহার করা হয়েছে?
 * কালার ভেরিয়েন্টের ইমেজগুলো ডাইনামিক ফিল্ড নামে আসে (যেমন: color_images_0, color_images_1)।
 * upload.fields ব্যবহার করলে এই ডাইনামিক নামগুলো Multer ধরতে পারে না।
 * upload.any() সব ফাইল গ্রহণ করবে এবং কন্ট্রোলারে প্রসেস করার সুযোগ দিবে।
 */
const productUpload = upload.any();

// --- ADMIN ROUTES ---

// ১. নতুন প্রোডাক্ট তৈরি (Create)
router.post("/", productUpload, createProduct);

// ২. সব প্রোডাক্ট দেখা (Read All)
router.get("/", getProductsAdmin);

// ৩. নির্দিষ্ট একটি প্রোডাক্ট দেখা (Read Single)
router.get("/:id", getProductByIdAdmin);

// ৪. প্রোডাক্ট আপডেট করা (Update)
router.put("/:id", productUpload, updateProduct);

// ৫. প্রোডাক্ট ডিলিট করা (Delete)
router.delete("/:id", deleteProduct);

export default router;
