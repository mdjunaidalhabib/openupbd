import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.admin_token;
    if (!token)
      return res.status(401).json({ message: "Not authorized, no token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = await Admin.findById(decoded.id).select("-password");

    if (!req.admin) return res.status(401).json({ message: "Admin not found" });
    next();
  } catch (error) {
    console.error("Auth Error:", error);
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Session expired, please log in again" });
    }
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const superAdminOnly = (req, res, next) => {
  if (req.admin && req.admin.role === "superadmin") next();
  else res.status(403).json({ message: "Access denied: Super admin only" });
};
