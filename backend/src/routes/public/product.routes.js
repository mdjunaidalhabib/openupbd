import express from "express";
import {
  getProducts,
  getProductById,
  getProductsByCategory,
} from "../../../controllers/productController.js";

const router = express.Router();
router.get("/", getProducts);
router.get("/category/:categoryId", getProductsByCategory);
router.get("/:id", getProductById);

export default router;
