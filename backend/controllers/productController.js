import Product from "../src/models/Product.js";
import Category from "../src/models/Category.js";
import cloudinary from "../utils/cloudinary.js";
import fs from "fs";
import streamifier from "streamifier";
import { deleteFromCloudinary } from "../utils/cloudinaryHelpers.js";

/* -------------------------------- Helpers -------------------------------- */

const toNumber = (val, fallback = 0) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
};

// ✅ Upload helper (works for BOTH memoryStorage(buffer) and diskStorage(path))
const uploadToCloudinary = async (file, folder) => {
  // 1) If multer memoryStorage -> file.buffer exists
  if (file?.buffer) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      streamifier.createReadStream(file.buffer).pipe(stream);
    });
  }

  // 2) If diskStorage -> file.path exists
  if (file?.path) {
    const result = await cloudinary.uploader.upload(file.path, { folder });

    // ✅ delete local file safely
    try {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    } catch (e) {
      console.warn("⚠️ Could not delete local file:", file.path);
    }

    return result;
  }

  throw new Error("Invalid file: missing buffer/path");
};

// ✅ Variant-aware soldout calculation
const computeIsSoldOut = ({ hasVariants, stock, colors }) => {
  const baseStock = toNumber(stock, 0);

  // No variants → base stock
  if (!hasVariants) return baseStock <= 0;

  const list = Array.isArray(colors) ? colors : [];
  if (list.length === 0) return baseStock <= 0;

  // ✅ SOLD OUT only if ALL variant stock <= 0
  const anyInStock = list.some((c) => toNumber(c?.stock, 0) > 0);
  return !anyInStock;
};

// ✅ Sum variant stock
const computeVariantTotalStock = (colors) => {
  const list = Array.isArray(colors) ? colors : [];
  return list.reduce((sum, c) => sum + toNumber(c?.stock, 0), 0);
};

const shiftOrdersForInsert = async (newOrder, excludeId = null) => {
  const filter = excludeId
    ? { _id: { $ne: excludeId }, order: { $gte: newOrder } }
    : { order: { $gte: newOrder } };
  await Product.updateMany(filter, { $inc: { order: 1 } });
};

const normalizeOrders = async () => {
  const items = await Product.find().sort({ order: 1, createdAt: 1 });
  for (let i = 0; i < items.length; i++) {
    const expected = i + 1;
    if (items[i].order !== expected) {
      items[i].order = expected;
      await items[i].save();
    }
  }
};

/* -------------------------------- Controllers -------------------------------- */

export const createProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      oldPrice,
      stock,
      sold,
      isSoldOut,
      rating,
      description,
      additionalInfo,
      category,
      order,
      isActive,
      colors,
    } = req.body;

    if (!name || price === undefined || !category) {
      return res.status(400).json({ error: "Name, Price & Category required" });
    }

    const total = await Product.countDocuments();
    const serial = toNumber(order, 0) > 0 ? toNumber(order, 0) : total + 1;
    await shiftOrdersForInsert(serial);

    let parsedColors = colors ? JSON.parse(colors) : [];
    const hasVariants = Array.isArray(parsedColors) && parsedColors.length > 0;

    let primaryImage = "";
    let galleryImages = [];
    const allFiles = req.files || [];

    /* ------------------- NO VARIANTS (Gallery Upload) ------------------- */
    if (!hasVariants) {
      const galleryFiles = allFiles.filter((f) => f.fieldname === "images");

      for (let file of galleryFiles) {
        const uploaded = await uploadToCloudinary(file, "products/gallery");
        galleryImages.push(uploaded.secure_url);
      }

      primaryImage = galleryImages[0] || "";
    } else {

    /* ------------------- VARIANTS (Variant Upload) ------------------- */
      parsedColors = parsedColors.map((c) => ({
        ...c,
        price:
          c.price !== undefined && c.price !== null && c.price !== ""
            ? toNumber(c.price, 0)
            : toNumber(price, 0),
        oldPrice:
          c.oldPrice && toNumber(c.oldPrice, 0) > 0
            ? toNumber(c.oldPrice, 0)
            : null,
        stock: c.stock !== undefined ? toNumber(c.stock, 0) : 0,
        sold: c.sold !== undefined ? toNumber(c.sold, 0) : 0,
        images: Array.isArray(c.images) ? c.images : [],
      }));

      for (let i = 0; i < parsedColors.length; i++) {
        const fieldName = `color_images_${i}`;
        const colorFiles = allFiles.filter((f) => f.fieldname === fieldName);

        if (colorFiles.length > 0) {
          const urls = [];
          for (let file of colorFiles) {
            const uploaded = await uploadToCloudinary(
              file,
              "products/variants"
            );
            urls.push(uploaded.secure_url);
          }
          parsedColors[i].images = urls;
        }
      }

      primaryImage = parsedColors?.[0]?.images?.[0] || "";
    }

    // ✅ Sync stock (variants -> total)
    const finalStock = hasVariants
      ? computeVariantTotalStock(parsedColors)
      : toNumber(stock, 0);

    // ✅ Compute soldOut correctly
    const computedSoldOut = computeIsSoldOut({
      hasVariants,
      stock: finalStock,
      colors: parsedColors,
    });

    const product = new Product({
      name,
      price: toNumber(price, 0),
      oldPrice:
        oldPrice && toNumber(oldPrice, 0) > 0 ? toNumber(oldPrice, 0) : null,

      stock: finalStock,
      sold: toNumber(sold, 0),

      // ✅ SoldOut fix
      isSoldOut: isSoldOut === "true" ? true : computedSoldOut,

      rating: toNumber(rating, 0),
      description,
      additionalInfo,
      category,

      image: primaryImage,
      images: galleryImages,

      colors: parsedColors,
      reviews: req.body.reviews ? JSON.parse(req.body.reviews) : [],

      order: serial,
      isActive: isActive === "true",
    });

    await product.save();
    await normalizeOrders();
    res.status(201).json(product);
  } catch (err) {
    console.error("Create Error:", err);
    res.status(500).json({ error: err?.message || "Server error" });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const {
      name,
      price,
      oldPrice,
      stock,
      sold,
      isSoldOut,
      rating,
      description,
      additionalInfo,
      category,
      order,
      isActive,
      existingImages,
      colors,
    } = req.body;

    const newOrder = toNumber(order, 0);
    if (newOrder > 0 && newOrder !== product.order) {
      await shiftOrdersForInsert(newOrder, product._id);
      product.order = newOrder;
    }

    let incomingColors = colors ? JSON.parse(colors) : [];
    const allFiles = req.files || [];

    /* ---------------- VARIANT UPDATE MODE ---------------- */
    if (Array.isArray(incomingColors) && incomingColors.length > 0) {
      incomingColors = incomingColors.map((c) => ({
        ...c,
        price:
          c.price !== undefined && c.price !== null && c.price !== ""
            ? toNumber(c.price, 0)
            : price !== undefined
            ? toNumber(price, 0)
            : toNumber(product.price, 0),
        oldPrice:
          c.oldPrice && toNumber(c.oldPrice, 0) > 0
            ? toNumber(c.oldPrice, 0)
            : null,
        stock: c.stock !== undefined ? toNumber(c.stock, 0) : 0,
        sold: c.sold !== undefined ? toNumber(c.sold, 0) : 0,
        images: Array.isArray(c.images) ? c.images : [],
      }));

      // ✅ remove old base images if switching to variants
      if (product.image) await deleteFromCloudinary(product.image, "products");
      for (let url of product.images) {
        await deleteFromCloudinary(url, "products/gallery");
      }
      product.image = "";
      product.images = [];

      // ✅ upload variant images (append)
      for (let i = 0; i < incomingColors.length; i++) {
        const fieldName = `color_images_${i}`;
        const colorFiles = allFiles.filter((f) => f.fieldname === fieldName);

        if (colorFiles.length > 0) {
          const urls = [];
          for (let file of colorFiles) {
            const uploaded = await uploadToCloudinary(
              file,
              "products/variants"
            );
            urls.push(uploaded.secure_url);
          }
          incomingColors[i].images = [
            ...(incomingColors[i].images || []),
            ...urls,
          ];
        }
      }

      product.colors = incomingColors;

      // ✅ Sync stock with total variants
      product.stock = computeVariantTotalStock(product.colors);

      // ✅ Optional: primary image from first variant image
      product.image = product.colors?.[0]?.images?.[0] || product.image;
    } else {

    /* ---------------- NORMAL PRODUCT UPDATE MODE ---------------- */
      // If previously had variants -> delete all variant images
      if (product.colors && product.colors.length > 0) {
        for (let color of product.colors) {
          for (let url of color.images) {
            await deleteFromCloudinary(url, "products/variants");
          }
        }
        product.colors = [];
      }

      let keepImages = existingImages ? JSON.parse(existingImages) : [];
      keepImages = Array.isArray(keepImages) ? keepImages : [];

      const imagesToRemove = product.images.filter(
        (img) => !keepImages.includes(img)
      );
      for (let url of imagesToRemove) {
        await deleteFromCloudinary(url, "products/gallery");
      }

      const galleryFiles = allFiles.filter((f) => f.fieldname === "images");
      let newUploads = [];

      for (let file of galleryFiles) {
        const uploaded = await uploadToCloudinary(file, "products/gallery");
        newUploads.push(uploaded.secure_url);
      }

      product.images = [...keepImages, ...newUploads];
      product.image = product.images[0] || product.image;

      product.stock =
        stock !== undefined ? toNumber(stock, product.stock) : product.stock;
    }

    /* ---------------- Other fields ---------------- */
    product.name = name || product.name;
    product.price =
      price !== undefined ? toNumber(price, product.price) : product.price;
    product.oldPrice =
      oldPrice && toNumber(oldPrice, 0) > 0 ? toNumber(oldPrice, 0) : null;
    product.sold =
      sold !== undefined ? toNumber(sold, product.sold) : product.sold;
    product.rating =
      rating !== undefined ? toNumber(rating, product.rating) : product.rating;
    product.description = description ?? product.description;
    product.additionalInfo = additionalInfo ?? product.additionalInfo;
    product.category = category || product.category;
    product.isActive =
      isActive !== undefined ? isActive === "true" : product.isActive;

    if (req.body.reviews) product.reviews = JSON.parse(req.body.reviews);

    // ✅ soldOut compute (variant-aware)
    const hasVariantsNow =
      Array.isArray(product.colors) && product.colors.length > 0;

    const computedSoldOut = computeIsSoldOut({
      hasVariants: hasVariantsNow,
      stock: product.stock,
      colors: product.colors,
    });

    product.isSoldOut =
      isSoldOut !== undefined ? isSoldOut === "true" : computedSoldOut;

    await product.save();
    await normalizeOrders();
    res.json(product);
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ error: err?.message || "Server error" });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    if (product.image) await deleteFromCloudinary(product.image, "products");
    for (let url of product.images)
      await deleteFromCloudinary(url, "products/gallery");
    for (let color of product.colors) {
      for (let url of color.images)
        await deleteFromCloudinary(url, "products/variants");
    }

    await product.deleteOne();
    await normalizeOrders();
    res.json({ message: "🗑️ Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err?.message || "Server error" });
  }
};

export const getProductsAdmin = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("category")
      .sort({ order: 1, createdAt: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err?.message || "Server error" });
  }
};

export const getProductByIdAdmin = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category");
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err?.message || "Server error" });
  }
};

export const getProductsPublic = async (req, res) => {
  try {
    const activeCats = await Category.find({ isActive: true }).select("_id");
    const products = await Product.find({
      category: { $in: activeCats.map((c) => c._id) },
      isActive: true,
    })
      .populate("category")
      .sort({ order: 1, createdAt: 1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err?.message || "Server error" });
  }
};

export const getProductByIdPublic = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category");
    if (
      !product ||
      !product.isActive ||
      (product.category && !product.category.isActive)
    ) {
      return res.status(403).json({ error: "Product is hidden or inactive" });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err?.message || "Server error" });
  }
};

export const getProductsByCategoryPublic = async (req, res) => {
  try {
    const category = await Category.findById(req.params.categoryId);
    if (!category || !category.isActive) {
      return res.status(403).json({ error: "Category hidden or inactive" });
    }

    const products = await Product.find({
      category: category._id,
      isActive: true,
    })
      .populate("category")
      .sort({ order: 1, createdAt: 1 });

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err?.message || "Server error" });
  }
};
