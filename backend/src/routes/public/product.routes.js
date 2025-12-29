import express from "express";
import {
  getProductsPublic,
  getProductByIdPublic,
  getProductsByCategoryPublic,
  addReviewToProduct,
  updateProductReview, // ✅ ADD
  deleteProductReview, // ✅ ADD
} from "../../../controllers/productController.js";

import { userProtect } from "../../middlewares/userProtect.js";

const router = express.Router();

router.get("/", getProductsPublic);
router.get("/category/:categoryId", getProductsByCategoryPublic);
router.get("/:id", getProductByIdPublic);

// ✅ Reviews
router.post("/:id/review", userProtect, addReviewToProduct);
router.put("/:id/review/:reviewId", userProtect, updateProductReview); // ✅ EDIT
router.delete("/:id/review/:reviewId", userProtect, deleteProductReview); // ✅ DELETE

export default router;
