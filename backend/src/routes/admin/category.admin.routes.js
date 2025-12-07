import express from "express";
import upload from "../../../utils/upload.js";
import {
  createCategory,
  updateCategory,
  getCategoriesAdmin,
  getCategoryByIdAdmin,
  deleteCategory,
} from "../../../controllers/categoryController.js";

const router = express.Router();

router.post("/", upload.single("image"), createCategory);

// ✅ Admin: all categories (hidden সহ)
router.get("/", getCategoriesAdmin);

// ✅ Admin: single category (hidden হলেও show)
router.get("/:id", getCategoryByIdAdmin);

router.put("/:id", upload.single("image"), updateCategory);
router.delete("/:id", deleteCategory);

export default router;
