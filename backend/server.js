import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import passport from "passport";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import dbConnect from "./src/lib/db.js";
import { configurePassport } from "./src/auth/passport.js";
import createSuperAdmin from "./src/config/createSuperAdmin.js";

import publicRoutes from "./src/routes/public/index.js";
import adminRoutes from "./src/routes/admin/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const isProd = process.env.NODE_ENV === "production";

// ✅ trust nginx / proxy for secure cookies
app.set("trust proxy", 1);

app.use(cookieParser());

// ✅ Helmet
app.use(
  helmet({
    contentSecurityPolicy: isProd ? undefined : false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// ✅ normalize helper
const normalize = (url = "") => url.replace(/\/$/, "").trim();

// ✅ CORS allow list
const allowedOrigins = (process.env.CLIENT_URLS || "")
  .split(",")
  .map(normalize)
  .filter(Boolean);

console.log("✅ Allowed CORS Origins:", allowedOrigins);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // allow Postman/curl

      const normalizedOrigin = normalize(origin);
      if (allowedOrigins.includes(normalizedOrigin)) {
        return cb(null, true);
      }

      console.log("❌ Blocked by CORS Origin:", origin);
      return cb(new Error(`Not allowed by CORS: ${origin}`), false);
    },
    credentials: true, // ✅ allow cookies
    exposedHeaders: ["Content-Disposition"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

configurePassport();
app.use(passport.initialize());

app.use("/", publicRoutes);
app.use("/admin", adminRoutes);

app.get("/", (req, res) => res.send("✅ HabibsFashion API is running..."));
app.use("/uploads", express.static("uploads"));

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "✅ API is running",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Uncaught error:", err);
  res.status(500).json({
    error: "Internal server error",
    details: isProd ? undefined : String(err),
  });
});

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
