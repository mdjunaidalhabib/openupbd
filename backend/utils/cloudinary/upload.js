import multer from "multer";
import path from "path";

/* ================== ✅ STORAGE ================== */
const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

/* ================== ✅ DEFAULT UPLOAD (GENERIC) ================== */
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 }, // ✅ 100KB
});

/* ================== ✅ CATEGORY UPLOAD ==================
   RULE: WEBP | 300×300 | max 100KB
================================================== */
export const categoryUpload = multer({
  storage,
  limits: { fileSize: 100 * 1024 }, // ✅ 100KB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "image/webp") {
      return cb(new Error("Only WEBP allowed (300×300, max 100KB)"), false);
    }
    cb(null, true);
  },
});

/* ================== ✅ PRODUCT UPLOAD ==================
   RULE: WEBP | 600×600 | max 100KB
================================================== */
export const productUpload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024, // ✅ 100KB per file
    files: 40, // ✅ gallery + variants safety
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "image/webp") {
      return cb(new Error("Only WEBP allowed (600×600, max 100KB)"), false);
    }
    cb(null, true);
  },
});

/* ================== ✅ SLIDER UPLOAD ==================
   RULE: WEBP | 1500×500 | max 100KB
================================================== */
export const sliderUpload = multer({
  storage,
  limits: { fileSize: 100 * 1024 }, // ✅ 100KB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "image/webp") {
      return cb(new Error("Only WEBP allowed (1500×500, max 100KB)"), false);
    }
    cb(null, true);
  },
});

export default upload;
