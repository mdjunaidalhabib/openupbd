import express from "express";
import {
  getProductsPublic,
  getProductByIdPublic,
  getProductsByCategoryPublic,
} from "../../../controllers/productController.js";

const router = express.Router();

router.get("/", getProductsPublic);
router.get("/category/:categoryId", getProductsByCategoryPublic);
router.get("/:id", getProductByIdPublic);

export default router;
