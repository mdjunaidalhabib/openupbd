import express from "express";

// admin auth routes (login/logout/verify/register/me/profile)
import adminAuthRoutes from "./admin.routes.js";

// locked admin modules
import productAdminRoutes from "./product.admin.routes.js";
import orderAdminRoutes from "./order.admin.routes.js";
import usersAdminRoutes from "./users.admin.routes.js";
import navbarAdminRoutes from "./navbar.admin.routes.js";
import footerAdminRoutes from "./footer.admin.routes.js";
import courierSettingsAdminRoutes from "./courierSettings.admin.routes.js";
import sendOrderAdminRoutes from "./sendOrder.admin.routes.js";
import steadfastAdminRoutes from "./steadfast.admin.routes.js";
import categoryAdminRoutes from "./category.admin.routes.js";
import slidersAdminRoutes from "./slider.admin.routes.js";

const router = express.Router();

// ✅ Auth + Profile routes (/login, /logout, /verify, /register, /me, /me/password)
router.use("/", adminAuthRoutes);

// ✅ other admin modules
router.use("/products", productAdminRoutes);
router.use("/orders", orderAdminRoutes);
router.use("/users", usersAdminRoutes);
router.use("/navbar", navbarAdminRoutes);
router.use("/footer", footerAdminRoutes);
router.use("/sliders", slidersAdminRoutes);



// এগুলোর ভেতরে নিজস্ব path আছে:
router.use("/", courierSettingsAdminRoutes);
router.use("/", sendOrderAdminRoutes);
router.use("/steadfast", steadfastAdminRoutes);
router.use("/categories", categoryAdminRoutes);

export default router;
