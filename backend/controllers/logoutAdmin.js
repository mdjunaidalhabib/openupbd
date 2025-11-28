export const logoutAdmin = async (req, res) => {
  try {
    const isProd = process.env.NODE_ENV === "production";

    res.clearCookie("admin_token", {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      domain: isProd ? process.env.COOKIE_DOMAIN : "localhost",
      path: "/",
    });

    console.log("🧹 Cookie cleared successfully");
    return res.status(200).json({ message: "✅ Logged out successfully" });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
