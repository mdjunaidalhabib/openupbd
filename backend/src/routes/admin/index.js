import express from "express";

import adminAuthRoutes from "./admin.routes.js";
import productAdminRoutes from "./product.admin.routes.js";
import orderAdminRoutes from "./order.admin.routes.js";
import usersAdminRoutes from "./users.admin.routes.js";
import navbarAdminRoutes from "./navbar.admin.routes.js";
import footerAdminRoutes from "./footer.admin.routes.js";
import courierSettingsAdminRoutes from "./courierSettings.admin.routes.js";
import categoryAdminRoutes from "./category.admin.routes.js";
import slidersAdminRoutes from "./slider.admin.routes.js";
import steadfastRoutes from "./steadfast.admin.routes.js";



const router = express.Router();

router.use("/", adminAuthRoutes);
router.use("/products", productAdminRoutes);
router.use("/orders", orderAdminRoutes);
router.use("/users", usersAdminRoutes);
router.use("/navbar", navbarAdminRoutes);
router.use("/footer", footerAdminRoutes);
router.use("/sliders", slidersAdminRoutes);
router.use("/", courierSettingsAdminRoutes);
router.use("/categories", categoryAdminRoutes);
router.use("/api", steadfastRoutes);












export default router;
