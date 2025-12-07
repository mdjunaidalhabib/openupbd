import express from "express";
import {
  getCategoriesPublic,
  getCategoryByIdPublic,
} from "../../../controllers/categoryController.js";

const router = express.Router();

// ✅ Public: only active + serial sorted
router.get("/", getCategoriesPublic);

// ✅ Public: single (hidden হলে block)
router.get("/:id", getCategoryByIdPublic);

export default router;
