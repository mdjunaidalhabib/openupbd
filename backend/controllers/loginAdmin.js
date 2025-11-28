import generateToken from "../utils/generateToken.js";
import Admin from "../src/models/Admin.js";

export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // ইমেইল আছে কিনা চেক
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: "❌ ভুল ইমেইল দেওয়া হয়েছে" });
    }

    // পাসওয়ার্ড মিলছে কিনা চেক
    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "🔒 ভুল পাসওয়ার্ড দেওয়া হয়েছে" });
    }

    // টোকেন তৈরি
    const token = generateToken(admin);
    const isProd = process.env.NODE_ENV === "production";

    // কুকি সেট
    res.cookie("admin_token", token, {
      httpOnly: true,
      secure: isProd, // HTTPS হলে true
      sameSite: isProd ? "none" : "lax", // লোকাল টেস্টে lax রাখো
      domain: isProd ? process.env.COOKIE_DOMAIN : "localhost",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // ৭ দিন
    });

    // সফল লগইন রেসপন্স
    return res.status(200).json({
      message: "✅ লগইন সফল হয়েছে!",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ message: "⚠️ সার্ভারে কিছু সমস্যা হয়েছে" });
  }
};
