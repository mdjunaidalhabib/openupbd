import express from "express";
import {
  getCategories,
  getCategoryById,
} from "../../../controllers/categoryController.js";

const router = express.Router();

// 📂 সব ক্যাটাগরি
router.get("/", getCategories);

// 🔍 নির্দিষ্ট ক্যাটাগরি
router.get("/:id", getCategoryById);

export default router;
