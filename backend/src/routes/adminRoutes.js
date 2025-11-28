import express from "express";
import { protect, superAdminOnly } from "../middlewares/adminAuthMiddleware.js";
import { loginAdmin } from "../../controllers/loginAdmin.js";
import { logoutAdmin } from "../../controllers/logoutAdmin.js";
import Admin from "../models/Admin.js";

const router = express.Router();

router.post("/login", loginAdmin);
router.post("/logout", logoutAdmin);

// Verify admin session
router.get("/verify", protect, async (req, res) => {
  try {
    res.json({
      message: "✅ Auth verified",
      admin: req.admin,
    });
  } catch (error) {
    console.error("Verify Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create new admin (Super Admin only)
router.post("/register", protect, superAdminOnly, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const exists = await Admin.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "❌ Admin already exists" });

    const newAdmin = await Admin.create({ name, email, password, role });
    res.status(201).json({
      message: "✅ New admin created successfully",
      admin: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
      },
    });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
