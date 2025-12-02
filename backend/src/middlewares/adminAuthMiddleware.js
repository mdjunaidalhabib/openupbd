import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

export const protect = async (req, res, next) => {
  try {
    // ✅ token cookie বা header দুই জায়গা থেকেই নাও
    const cookieToken = req.cookies?.admin_token;
    const headerToken = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null;

    const token = cookieToken || headerToken;

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    // ✅ verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ full admin data (password বাদে)
    const admin = await Admin.findById(decoded.id).select("-password");

    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    req.admin = admin;
    next();
  } catch (error) {
    if (error?.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Session expired, please log in again" });
    }

    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const superAdminOnly = (req, res, next) => {
  if (req.admin && req.admin.role === "superadmin") return next();
  return res.status(403).json({ message: "Access denied: Super admin only" });
};
