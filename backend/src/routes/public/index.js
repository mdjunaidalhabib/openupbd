import express from "express";

import authRoutes from "./auth.routes.js";
import productRoutes from "./product.routes.js";
import categoryRoutes from "./category.routes.js";
import orderRoutes from "./order.routes.js";
import navbarRoutes from "./navbar.routes.js";
import footerRoutes from "./footer.routes.js";
import receiptRoutes from "./receipt.routes.js";
import sliderRoutes from "./slider.routes.js";
import invoiceRoute from "./invoice.js";
import deliveryFee from "./deliveryFee.js";



const router = express.Router();

router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/orders", orderRoutes);
router.use("/navbar", navbarRoutes);
router.use("/footer", footerRoutes);
router.use("/receipts", receiptRoutes);
router.use("/slider-images", sliderRoutes);
router.use("/api", invoiceRoute);
router.use("/delivery-fee", deliveryFee);



export default router;
