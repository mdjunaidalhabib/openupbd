"use client";
import { useEffect, useState } from "react";

export default function ProductForm({ product, onClose, onSaved }) {
  const [categories, setCategories] = useState([]);
  const [processing, setProcessing] = useState(false);

  const [form, setForm] = useState({
    name: "",
    price: "",
    oldPrice: "",
    stock: 0,
    rating: "",
    description: "",
    additionalInfo: "",
    category: "",
    image: null,
    images: [],
    reviews: [],
  });

  const [previewImage, setPreviewImage] = useState("");

  // 🗂️ ক্যাটাগরি ফেচ
  const loadCategories = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/categories`
      );
      if (!res.ok) throw new Error("ক্যাটাগরি লোড করতে সমস্যা হয়েছে!");
      setCategories(await res.json());
    } catch (err) {
      console.error("Category load error:", err);
      setCategories([]);
    }
  };

  // 🧭 ক্যাটাগরি লোড + প্রোডাক্ট সেট (React19 safe)
  useEffect(() => {
    const init = async () => {
      await loadCategories();

      if (product) {
        setForm({
          name: product.name || "",
          price: Number(product.price) || 0,
          oldPrice: Number(product.oldPrice) || 0,
          stock: Number(product.stock) || 0,
          rating: Number(product.rating) || 0,
          description: product.description || "",
          additionalInfo: product.additionalInfo || "",
          category: product.category?._id || "",
          image: null,
          images: product.images || [],
          reviews: product.reviews || [],
        });

        setPreviewImage(product.image || "");
      } else {
        // নতুন প্রোডাক্ট খুললে ফর্ম reset
        setForm((prev) => ({
          ...prev,
          name: "",
          price: "",
          oldPrice: "",
          stock: 0,
          rating: "",
          description: "",
          additionalInfo: "",
          category: "",
          image: null,
          images: [],
          reviews: [],
        }));
        setPreviewImage("");
      }
    };

    init();
  }, [product]);

  // 🖼️ প্রধান ইমেজ (Fast Preview)
  const handleSingleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setForm({ ...form, image: file });
      };
      reader.readAsDataURL(file);
    }
  };

  // 📸 গ্যালারি ইমেজ (Fast Preview সহ)
  const handleGalleryFiles = (files) => {
    const imgFiles = Array.from(files).filter((f) =>
      f.type.startsWith("image/")
    );
    if (imgFiles.length) {
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...imgFiles],
      }));
    }
  };

  const removeGalleryImage = (idx) => {
    const newImgs = form.images.filter((_, i) => i !== idx);
    setForm({ ...form, images: newImgs });
  };

  // ⭐ রিভিউ + অটো রেটিং
  const addReview = () => {
    setForm({
      ...form,
      reviews: [...form.reviews, { user: "", rating: 0, comment: "" }],
    });
  };

  const handleReviewChange = (idx, field, value) => {
    const newReviews = [...form.reviews];
    newReviews[idx][field] = value;

    const validRatings = newReviews
      .map((r) => Number(r.rating))
      .filter((r) => !isNaN(r) && r > 0);

    const avgRating =
      validRatings.length > 0
        ? (
            validRatings.reduce((a, b) => a + Number(b), 0) /
            validRatings.length
          ).toFixed(1)
        : 0;

    setForm({ ...form, reviews: newReviews, rating: avgRating });
  };

  const removeReview = (idx) => {
    const newReviews = form.reviews.filter((_, i) => i !== idx);

    const validRatings = newReviews
      .map((r) => Number(r.rating))
      .filter((r) => !isNaN(r) && r > 0);

    const avgRating =
      validRatings.length > 0
        ? (
            validRatings.reduce((a, b) => a + Number(b), 0) /
            validRatings.length
          ).toFixed(1)
        : 0;

    setForm({ ...form, reviews: newReviews, rating: avgRating });
  };

  // 💾 সাবমিট
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category)
      return alert("⚠️ নাম, দাম ও ক্যাটাগরি দেওয়া দরকার!");

    setProcessing(true);
    try {
      const data = new FormData();
      for (let key in form) {
        if (["image", "images", "reviews"].includes(key)) continue;
        data.append(key, form[key]);
      }

      if (form.image) data.append("image", form.image);
      form.images.forEach((img) => data.append("images", img));
      data.append("reviews", JSON.stringify(form.reviews));

      const url = product
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/products/${product._id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/products`;
      const method = product ? "PUT" : "POST";

      const res = await fetch(url, { method, body: data });
      if (res.ok) {
        alert(
          product ? "✅ প্রোডাক্ট আপডেট হয়েছে!" : "✅ প্রোডাক্ট সংরক্ষিত হয়েছে!"
        );
        onSaved();
      } else alert("❌ ডেটা সেভ করতে সমস্যা হয়েছে!");
    } catch (err) {
      console.error(err);
      alert("⚠️ কিছু ভুল হয়েছে!");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-2xl p-6 space-y-6 border border-gray-200"
    >
      <h1 className="text-2xl font-extrabold text-center text-indigo-600 mb-4">
        {product ? "✏ পণ্য সম্পাদনা করুন" : "🛍️ নতুন পণ্য যোগ করুন"}
      </h1>

      {/* 🧾 পণ্যের তথ্য */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="text-lg font-bold text-blue-600 mb-2">📋 পণ্যের তথ্য</h2>
        <label className="block font-semibold">নাম:</label>
        <input
          className="w-full border p-2 rounded-lg mb-3"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block font-semibold">মূল্য:</label>
            <input
              type="number"
              className="border p-2 rounded-lg w-full"
              value={form.price}
              onChange={(e) =>
                setForm({ ...form, price: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="block font-semibold">পুরনো মূল্য:</label>
            <input
              type="number"
              className="border p-2 rounded-lg w-full"
              value={form.oldPrice}
              onChange={(e) =>
                setForm({ ...form, oldPrice: Number(e.target.value) })
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <div>
            <label className="block font-semibold">স্টক:</label>
            <input
              type="number"
              className="border p-2 rounded-lg w-full"
              value={form.stock}
              onChange={(e) =>
                setForm({ ...form, stock: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="block font-semibold">গড় রেটিং:</label>
            <input
              type="number"
              min="0"
              max="5"
              className="border p-2 rounded-lg w-full bg-gray-100 cursor-not-allowed"
              value={form.rating}
              readOnly
            />
          </div>
        </div>

        <label className="block font-semibold mt-3">বর্ণনা:</label>
        <textarea
          className="w-full border p-2 rounded-lg"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <label className="block font-semibold mt-3">অতিরিক্ত তথ্য:</label>
        <textarea
          className="w-full border p-2 rounded-lg"
          value={form.additionalInfo}
          onChange={(e) => setForm({ ...form, additionalInfo: e.target.value })}
        />
      </div>

      {/* 📂 ক্যাটাগরি */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="text-lg font-bold text-green-600 mb-2">📂 ক্যাটাগরি</h2>
        <select
          className="w-full border p-2 rounded-lg"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          <option value="">-- ক্যাটাগরি বেছে নিন --</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* 🖼️ প্রধান ছবি */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="text-lg font-bold text-purple-600 mb-2">
          🖼️ প্রধান ছবি
        </h2>
        <input
          type="file"
          onChange={handleSingleImage}
          className="w-full border p-2 rounded-lg"
        />
        {previewImage && (
          <img
            src={previewImage}
            className="h-24 mt-3 rounded-lg shadow-md object-cover mx-auto"
            alt="preview"
          />
        )}
      </div>

      {/* 📸 গ্যালারির ছবি */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="text-lg font-bold text-pink-600 mb-2">
          📸 গ্যালারির ছবি
        </h2>
        <input
          type="file"
          multiple
          onChange={(e) => handleGalleryFiles(e.target.files)}
          className="w-full border p-2 rounded-lg"
        />
        <div className="grid grid-cols-4 gap-2 mt-3">
          {form.images.map((img, idx) => (
            <div key={idx} className="relative group">
              <img
                src={typeof img === "string" ? img : URL.createObjectURL(img)}
                className="h-20 w-full rounded-lg border object-cover"
                alt="gallery"
              />
              <button
                type="button"
                onClick={() => removeGalleryImage(idx)}
                className="absolute top-1 right-1 bg-red-600 text-white rounded-full px-2 py-0.5 opacity-0 group-hover:opacity-100"
              >
                ✖
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ⭐ রিভিউ */}
      <div className="bg-white p-4 rounded-xl shadow">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold text-yellow-600">⭐ গ্রাহক রিভিউ</h2>
          <button
            type="button"
            onClick={addReview}
            className="text-blue-600 text-sm font-semibold"
          >
            + নতুন রিভিউ যোগ করুন
          </button>
        </div>

        {form.reviews.map((r, idx) => (
          <div key={idx} className="border rounded-lg p-3 mt-2 bg-gray-50">
            <div className="flex justify-between items-center mb-2">
              <label className="font-semibold">নাম:</label>
              <button
                type="button"
                onClick={() => removeReview(idx)}
                className="text-red-500 text-sm"
              >
                🗑 মুছুন
              </button>
            </div>

            <input
              className="w-full border p-2 rounded-lg mb-2"
              value={r.user}
              onChange={(e) => handleReviewChange(idx, "user", e.target.value)}
            />

            <label className="font-semibold">রেটিং (০–৫):</label>
            <input
              type="number"
              min="0"
              max="5"
              className="w-full border p-2 rounded-lg mb-2"
              value={r.rating}
              onChange={(e) =>
                handleReviewChange(idx, "rating", e.target.value)
              }
            />

            <label className="font-semibold">মন্তব্য:</label>
            <textarea
              className="w-full border p-2 rounded-lg"
              value={r.comment}
              onChange={(e) =>
                handleReviewChange(idx, "comment", e.target.value)
              }
            />
          </div>
        ))}
      </div>

      {/* 🧭 বোতাম */}
      <div className="flex flex-col gap-2 mt-4">
        <button
          type="submit"
          disabled={processing}
          className={`w-full py-3 rounded-lg text-white font-semibold shadow ${
            processing
              ? "bg-gray-400"
              : "bg-gradient-to-r from-green-500 to-lime-500 hover:scale-105 transition"
          }`}
        >
          {processing
            ? product
              ? "আপডেট হচ্ছে..."
              : "সংরক্ষণ হচ্ছে..."
            : product
            ? "💾 আপডেট করুন"
            : "💾 সংরক্ষণ করুন"}
        </button>

        <button
          type="button"
          onClick={onClose}
          disabled={processing}
          className="w-full py-2 rounded-lg text-black font-medium bg-gray-200 hover:bg-gray-300 transition"
        >
          ✖ বাতিল
        </button>
      </div>
    </form>
  );
}
