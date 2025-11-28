import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import passport from "passport";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dbConnect from "./src/lib/db.js";
import { configurePassport } from "./src/auth/passport.js";

// Routes
import authRoutes from "./src/routes/auth.js";
import locationRoutes from "./src/routes/locationRoutes.js";
import ordersRoute from "./src/routes/orders.js";
import receiptRoutes from "./src/routes/receiptRoutes.js";
import usersRoute from "./src/routes/users.js";
import productRoutes from "./src/routes/productRoutes.js";
import categoryRoutes from "./src/routes/categoryRoutes.js";
import footerRoutes from "./src/routes/footerRoutes.js";
import navbarRoutes from "./src/routes/navbarRoutes.js";
import courierSettingsRoute from "./src/routes/courierSettingsRoute.js";
import sendOrderRoute from "./src/routes/sendOrderRoute.js";
import courierRoute from "./src/routes/courierRoute.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import createSuperAdmin from "./src/config/createSuperAdmin.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const isProd = process.env.NODE_ENV === "production";

// ✅ নিরাপত্তা ও CORS
app.set("trust proxy", 1);
app.use(cookieParser());

app.use(
  helmet({
    contentSecurityPolicy: isProd ? undefined : false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// ✅ CORS কনফিগারেশন
const allowedOrigins = (
  process.env.CLIENT_URLS
)
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // ✅ কুকি পাঠানোর জন্য অত্যাবশ্যক
  })
);

app.use(express.json());
configurePassport();
app.use(passport.initialize());

// ✅ Routes
app.use("/auth", authRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/orders", ordersRoute);
app.use("/api/receipts", receiptRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/users", usersRoute);
app.use("/api/footer", footerRoutes);
app.use("/api/navbar", navbarRoutes);
app.use(courierSettingsRoute);
app.use(sendOrderRoute);
app.use(courierRoute);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => res.send("✅ Admin API is running..."));
app.use("/uploads", express.static("uploads"));

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "✅ API is running",
    timestamp: new Date().toISOString(),
  });
});

app.use((err, req, res, next) => {
  console.error("❌ Uncaught error:", err);
  res.status(500).json({
    error: "Internal server error",
    details: isProd ? undefined : String(err),
  });
});

// ✅ Start Server
const startServer = async () => {
  try {
    await dbConnect(process.env.MONGO_URI);
    await createSuperAdmin();
    app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
  } catch (err) {
    console.error("❌ Failed to connect DB:", err);
    process.exit(1);
  }
};

startServer();
export default app;
