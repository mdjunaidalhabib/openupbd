import express from "express";
import upload from "../../../utils/upload.js";
import {
  createCategory,
  updateCategory,
  getCategories,
  getCategoryById,
  deleteCategory,
} from "../../../controllers/categoryController.js";

const router = express.Router();

// 🟢 নতুন ক্যাটাগরি যোগ (Admin only)
router.post("/", upload.single("image"), createCategory);

// 📂 সব ক্যাটাগরি
router.get("/", getCategories);

// 🔍 নির্দিষ্ট ক্যাটাগরি
router.get("/:id", getCategoryById);


// 🟡 ক্যাটাগরি আপডেট (Admin only)
router.put("/:id", upload.single("image"), updateCategory);

// 🔴 ক্যাটাগরি ডিলিট (Admin only)
router.delete("/:id", deleteCategory);

export default router;
