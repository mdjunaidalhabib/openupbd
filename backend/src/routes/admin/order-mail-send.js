import express from "express";
import { getOrderMailSendSettings } from "../../../utils/mail/index.js";

const router = express.Router();

// ✅ GET admin email
router.get("/", async (req, res) => {
  try {
    const settings = await getOrderMailSendSettings();
    res.json({ adminEmail: settings.adminEmail || "" });
  } catch (e) {
    res.status(500).json({ error: "Failed to load admin email settings" });
  }
});

// ✅ PATCH admin email
router.patch("/", async (req, res) => {
  try {
    const { adminEmail } = req.body;

    if (adminEmail !== undefined && typeof adminEmail !== "string") {
      return res.status(400).json({ error: "Invalid adminEmail" });
    }

    const settings = await getOrderMailSendSettings();
    settings.adminEmail = adminEmail?.trim() || "";
    await settings.save();

    res.json({
      message: "Admin email updated",
      adminEmail: settings.adminEmail,
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to update admin email settings" });
  }
});

export default router;
