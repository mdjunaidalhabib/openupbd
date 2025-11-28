import express from "express";
import upload from "../../utils/upload.js";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategories,
  getCategoryById
} from "../../controllers/categoryController.js";

const router = express.Router();

router.post("/", upload.single("image"), createCategory);
router.get("/", getCategories);
router.get("/:id", getCategoryById);
router.put("/:id", upload.single("image"), updateCategory);
router.delete("/:id", deleteCategory);

export default router;
