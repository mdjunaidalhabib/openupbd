import Product from "../src/models/Product.js";
import Category from "../src/models/Category.js";
import cloudinary from "../utils/cloudinary.js";
import fs from "fs";
import { deleteFromCloudinary } from "../utils/cloudinaryHelpers.js";

// =================== ORDER HELPERS ===================

// Slider-style serial shift on insert/move
const shiftOrdersForInsert = async (newOrder, excludeId = null) => {
  const filter = excludeId
    ? { _id: { $ne: excludeId }, order: { $gte: newOrder } }
    : { order: { $gte: newOrder } };

  await Product.updateMany(filter, { $inc: { order: 1 } });
};

// normalize sequence to 1..n (safe after insert/update/delete)
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

// =====================================================
// =================== ADMIN APIs =======================
// =====================================================

// =================== CREATE PRODUCT (ADMIN) ===================
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      oldPrice,
      stock,
      rating,
      description,
      additionalInfo,
      category,
      order,
      isActive,
    } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({
        error: "Name, Price & Category required",
      });
    }

    // ✅ serial default last
    const total = await Product.countDocuments();
    const serial = Number(order) > 0 ? Number(order) : total + 1;

    // ✅ serial conflict shift
    await shiftOrdersForInsert(serial);

    let primaryImage = "";
    let galleryImages = [];
    let reviews = [];

    // ---- Primary Image ----
    if (req.files?.image?.[0]) {
      const uploaded = await cloudinary.uploader.upload(
        req.files.image[0].path,
        { folder: "products" }
      );
      fs.unlinkSync(req.files.image[0].path);
      primaryImage = uploaded.secure_url;
    }

    // ---- Gallery Images ----
    if (req.files?.images) {
      for (let file of req.files.images) {
        const uploaded = await cloudinary.uploader.upload(file.path, {
          folder: "products/gallery",
        });
        fs.unlinkSync(file.path);
        galleryImages.push(uploaded.secure_url);
      }
    }

    // ---- Reviews ----
    if (req.body.reviews) {
      reviews = Array.isArray(req.body.reviews)
        ? req.body.reviews
        : JSON.parse(req.body.reviews);
    }

    const product = new Product({
      name,
      price: Number(price) || 0,
      oldPrice: Number(oldPrice) || 0,
      stock: Number(stock) || 0,
      rating: Number(rating) || 0,
      description: description || "",
      additionalInfo: additionalInfo || "",
      category,

      image: primaryImage,
      images: galleryImages,
      reviews,

      // ✅ NEW
      order: serial,
      isActive:
        isActive !== undefined
          ? isActive === "true" || isActive === true
          : true,
    });

    await product.save();
    await normalizeOrders();

    res.status(201).json(product);
  } catch (err) {
    console.error("❌ Error creating product:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// =================== UPDATE PRODUCT (ADMIN) ===================
export const updateProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      oldPrice,
      stock,
      rating,
      description,
      additionalInfo,
      category,
      order,
      isActive,

      // ✅ NEW from frontend
      existingImages,
      removedImages,
    } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    // ✅ serial update + shift (ignore invalid/0)
    const newOrder = Number(order);
    if (newOrder > 0 && newOrder !== product.order) {
      await shiftOrdersForInsert(newOrder, product._id);
      product.order = newOrder;
    }

    // ---- Primary Image ----
    if (req.files?.image?.[0]) {
      if (product.image) await deleteFromCloudinary(product.image, "products");

      const uploaded = await cloudinary.uploader.upload(
        req.files.image[0].path,
        { folder: "products" }
      );

      product.image = uploaded.secure_url;
      fs.unlinkSync(req.files.image[0].path);
    }

    // ======================================================
    // ✅ Gallery Images Proper Update (KEEP + DELETE + ADD)
    // ======================================================

    // Parse keep list
    let keepImages = [];
    if (existingImages) {
      keepImages = Array.isArray(existingImages)
        ? existingImages
        : JSON.parse(existingImages);
    } else {
      keepImages = product.images || [];
    }

    // Parse remove list
    let removeList = [];
    if (removedImages) {
      removeList = Array.isArray(removedImages)
        ? removedImages
        : JSON.parse(removedImages);
    }

    // ✅ delete removed urls from cloudinary
    if (removeList.length > 0) {
      for (let url of removeList) {
        await deleteFromCloudinary(url, "products/gallery");
      }
    }

    // ✅ upload new gallery files
    let newUploaded = [];
    if (req.files?.images?.length) {
      for (let file of req.files.images) {
        const uploaded = await cloudinary.uploader.upload(file.path, {
          folder: "products/gallery",
        });
        newUploaded.push(uploaded.secure_url);
        fs.unlinkSync(file.path);
      }
    }

    // ✅ final gallery list
    product.images = [...keepImages, ...newUploaded];

    // ---- Reviews ----
    if (req.body.reviews) {
      product.reviews = Array.isArray(req.body.reviews)
        ? req.body.reviews
        : JSON.parse(req.body.reviews);
    }

    // ---- Other fields ----
    product.name = name || product.name;
    if (price !== undefined) product.price = Number(price) || 0;
    if (oldPrice !== undefined) product.oldPrice = Number(oldPrice) || 0;
    if (stock !== undefined) product.stock = Number(stock) || 0;
    if (rating !== undefined) product.rating = Number(rating) || 0;

    product.description = description ?? product.description;
    product.additionalInfo = additionalInfo ?? product.additionalInfo;
    product.category = category || product.category;

    // ✅ active/hidden update
    if (isActive !== undefined) {
      product.isActive = isActive === "true" || isActive === true;
    }

    await product.save();
    await normalizeOrders();

    res.json(product);
  } catch (err) {
    console.error("❌ Error updating product:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// =================== DELETE PRODUCT (ADMIN) ===================
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    if (product.image) await deleteFromCloudinary(product.image, "products");

    for (let url of product.images || [])
      await deleteFromCloudinary(url, "products/gallery");

    await product.deleteOne();
    await normalizeOrders();

    res.json({ message: "🗑️ Product deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting product:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Admin: সব পণ্য (hidden category ও product সহ)
export const getProductsAdmin = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("category")
      .sort({ order: 1, createdAt: 1 });

    res.json(products);
  } catch (err) {
    console.error("❌ Admin getProducts error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Admin: single product (hidden হলেও দেখাবে)
export const getProductByIdAdmin = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category");
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    console.error("❌ Admin getProductById error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// =====================================================
// =================== PUBLIC APIs ======================
// =====================================================

// ✅ Public: শুধু active category + active product, serial wise
export const getProductsPublic = async (req, res) => {
  try {
    const activeCategories = await Category.find({ isActive: true }).select(
      "_id"
    );
    const activeIds = activeCategories.map((c) => c._id);

    const products = await Product.find({
      category: { $in: activeIds },
      isActive: true,
    })
      .populate("category")
      .sort({ order: 1, createdAt: 1 });

    res.json(products);
  } catch (err) {
    console.error("❌ Public getProducts error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Public: single product (hidden product/category হলে block)
export const getProductByIdPublic = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category");
    if (!product) return res.status(404).json({ error: "Product not found" });

    if (product.isActive === false) {
      return res.status(403).json({ error: "Product is hidden" });
    }

    if (product.category && product.category.isActive === false) {
      return res.status(403).json({ error: "Category is hidden" });
    }

    res.json(product);
  } catch (err) {
    console.error("❌ Public getProductById error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Public: category wise products (hidden category/product হলে block)
export const getProductsByCategoryPublic = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await Category.findById(categoryId);
    if (!category || category.isActive === false) {
      return res.status(403).json({ error: "This category is hidden" });
    }

    const products = await Product.find({
      category: categoryId,
      isActive: true,
    })
      .populate("category")
      .sort({ order: 1, createdAt: 1 });

    res.json(products);
  } catch (err) {
    console.error("❌ Public getProductsByCategory error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
