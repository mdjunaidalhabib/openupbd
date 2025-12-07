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

const productUpload = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "images" },
]);

router.post("/", productUpload, createProduct);
router.get("/", getProductsAdmin);
router.get("/:id", getProductByIdAdmin);
router.put("/:id", productUpload, updateProduct);
router.delete("/:id", deleteProduct);

export default router;
