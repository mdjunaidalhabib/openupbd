"use client";
import { useEffect, useRef, useState } from "react";
import Toast from "../components/Toast";

export default function ProductForm({ product, onClose, onSaved }) {
  const [categories, setCategories] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    name: "",
    price: "",
    oldPrice: "",
    stock: 0,
    rating: "",
    description: "",
    additionalInfo: "",
    category: "",
    image: null, // main image (File)
    images: [], // gallery (File|string)
    reviews: [],
  });

  const [previewImage, setPreviewImage] = useState("");
  const mainDropRef = useRef(null);
  const galleryDropRef = useRef(null);

  // Load Categories
  const loadCategories = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/categories`
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Category load error:", err);
      setCategories([]);
      setToast({ message: "❌ ক্যাটাগরি লোড করা যায়নি!", type: "error" });
    }
  };

  // Init when product changes
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
        setForm({
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
        setPreviewImage("");
      }
    };

    init();
  }, [product]);

  // Main Image select + preview
  const setMainImage = (file) => {
    if (!file || !file.type?.startsWith("image/")) return;
    setPreviewImage(URL.createObjectURL(file));
    setForm((prev) => ({ ...prev, image: file }));
  };

  const handleSingleImage = (e) => {
    const file = e.target.files?.[0];
    setMainImage(file);
  };

  const handleMainDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    setMainImage(file);
  };

  // Gallery handle
  const handleGalleryFiles = (files) => {
    const imgFiles = Array.from(files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (!imgFiles.length) return;

    setForm((prev) => ({
      ...prev,
      images: [...prev.images, ...imgFiles],
    }));
  };

  const handleGalleryDrop = (e) => {
    e.preventDefault();
    handleGalleryFiles(e.dataTransfer.files);
  };

  const removeGalleryImage = (idx) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }));
  };

  const moveGalleryImage = (from, to) => {
    if (to < 0 || to >= form.images.length) return;
    setForm((prev) => {
      const arr = [...prev.images];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return { ...prev, images: arr };
    });
  };

  // Reviews + avg rating
  const addReview = () => {
    setForm((prev) => ({
      ...prev,
      reviews: [...prev.reviews, { user: "", rating: 0, comment: "" }],
    }));
  };

  const recalcAvg = (reviews) => {
    const valid = reviews
      .map((r) => Number(r.rating))
      .filter((r) => !isNaN(r) && r > 0);
    return valid.length
      ? (valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(1)
      : 0;
  };

  const handleReviewChange = (idx, field, value) => {
    setForm((prev) => {
      const next = [...prev.reviews];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, reviews: next, rating: recalcAvg(next) };
    });
  };

  const removeReview = (idx) => {
    setForm((prev) => {
      const next = prev.reviews.filter((_, i) => i !== idx);
      return { ...prev, reviews: next, rating: recalcAvg(next) };
    });
  };

  // Submit
  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ main image required check (new + edit both)
    const hasMainImage = !!form.image || !!previewImage;

    if (!form.name || !form.price || !form.category || !hasMainImage) {
      setToast({
        message: "⚠️ নাম, দাম, ক্যাটাগরি ও প্রধান ছবি দেওয়া জরুরি!",
        type: "error",
      });
      return;
    }

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
        ? `${process.env.NEXT_PUBLIC_API_URL}/admin/products/${product._id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/admin/products`;
      const method = product ? "PUT" : "POST";

      const res = await fetch(url, { method, body: data });

      if (res.ok) {
        setToast({
          message: product
            ? "✅ প্রোডাক্ট আপডেট হয়েছে!"
            : "✅ প্রোডাক্ট সংরক্ষণ হয়েছে!",
          type: "success",
        });
        onSaved?.();
        onClose?.();
      } else {
        setToast({
          message: "❌ ডেটা সেভ করতে সমস্যা হয়েছে!",
          type: "error",
        });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: "⚠️ কিছু ভুল হয়েছে!", type: "error" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-xl border p-5 sm:p-7 space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-extrabold text-indigo-600">
            {product ? "✏ পণ্য সম্পাদনা করুন" : "🛍️ নতুন পণ্য যোগ করুন"}
          </h1>
          <p className="text-sm text-gray-500">শপের জন্য প্রোডাক্ট তথ্য দিন</p>
        </div>

        {/* Basic Info */}
        <section className="bg-gray-50 rounded-xl p-4 space-y-3">
          <h2 className="font-bold text-gray-700">📋 পণ্যের তথ্য</h2>

          <div>
            <label className="text-sm font-semibold">নাম</label>
            <input
              className="mt-1 w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-200 outline-none"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Product name"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold">মূল্য</label>
              <input
                type="number"
                className="mt-1 w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-200 outline-none"
                value={form.price}
                onChange={(e) =>
                  setForm((p) => ({ ...p, price: Number(e.target.value) }))
                }
              />
            </div>

            <div>
              <label className="text-sm font-semibold">পুরনো মূল্য</label>
              <input
                type="number"
                className="mt-1 w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-200 outline-none"
                value={form.oldPrice}
                onChange={(e) =>
                  setForm((p) => ({ ...p, oldPrice: Number(e.target.value) }))
                }
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold">স্টক</label>
              <input
                type="number"
                className="mt-1 w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-200 outline-none"
                value={form.stock}
                onChange={(e) =>
                  setForm((p) => ({ ...p, stock: Number(e.target.value) }))
                }
              />
            </div>

            <div>
              <label className="text-sm font-semibold">গড় রেটিং</label>
              <input
                readOnly
                className="mt-1 w-full border rounded-lg p-2 bg-gray-100 cursor-not-allowed"
                value={form.rating}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold">বর্ণনা</label>
            <textarea
              className="mt-1 w-full border rounded-lg p-2 min-h-[90px] focus:ring-2 focus:ring-indigo-200 outline-none"
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="text-sm font-semibold">অতিরিক্ত তথ্য</label>
            <textarea
              className="mt-1 w-full border rounded-lg p-2 min-h-[70px] focus:ring-2 focus:ring-indigo-200 outline-none"
              value={form.additionalInfo}
              onChange={(e) =>
                setForm((p) => ({ ...p, additionalInfo: e.target.value }))
              }
            />
          </div>
        </section>

        {/* Category */}
        <section className="bg-gray-50 rounded-xl p-4 space-y-2">
          <h2 className="font-bold text-gray-700">📂 ক্যাটাগরি</h2>
          <select
            className="w-full border rounded-lg p-2 bg-white focus:ring-2 focus:ring-green-200 outline-none"
            value={form.category}
            onChange={(e) =>
              setForm((p) => ({ ...p, category: e.target.value }))
            }
          >
            <option value="">-- ক্যাটাগরি বেছে নিন --</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </section>

        {/* ✅ Premium Main Image */}
        <section className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-5 border border-indigo-100 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              🖼️ প্রধান ছবি
              <span className="text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                Required
              </span>
            </h2>

            {previewImage && (
              <button
                type="button"
                onClick={() => {
                  setPreviewImage("");
                  setForm((p) => ({ ...p, image: null }));
                }}
                className="text-xs text-red-600 hover:underline"
              >
                Remove
              </button>
            )}
          </div>

          <div
            ref={mainDropRef}
            onDrop={handleMainDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => mainDropRef.current?.querySelector("input")?.click()}
            className={`group relative overflow-hidden rounded-2xl border-2 border-dashed 
              ${
                previewImage
                  ? "border-indigo-300 bg-white"
                  : "border-indigo-200 bg-indigo-50/40"
              }
              p-5 flex flex-col sm:flex-row items-center gap-5 cursor-pointer
              hover:border-indigo-400 hover:bg-white transition`}
          >
            <div className="relative">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Main preview"
                  className="h-32 w-32 rounded-xl object-cover shadow-md ring-1 ring-indigo-100"
                />
              ) : (
                <div className="h-32 w-32 rounded-xl bg-white flex items-center justify-center shadow-sm ring-1 ring-indigo-100">
                  <div className="text-center text-gray-400">
                    <div className="text-3xl">📷</div>
                    <div className="text-xs mt-1">No image</div>
                  </div>
                </div>
              )}

              <div className="absolute inset-0 rounded-xl bg-black/25 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold">
                Click / Drop
              </div>
            </div>

            <div className="flex-1 space-y-1 text-center sm:text-left">
              <p className="font-semibold text-gray-700">
                ছবি ড্র্যাগ করে এখানে ছাড়ুন
              </p>
              <p className="text-sm text-gray-500">
                অথবা ক্লিক করে ফাইল সিলেক্ট করুন
              </p>
              <p className="text-xs text-gray-400">
                JPG, PNG, WEBP • Max 5MB • Recommended 1:1
              </p>

              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium shadow-sm">
                ⬆ Upload Image
              </div>
            </div>

            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleSingleImage}
            />
            <div className="absolute -right-10 -bottom-10 h-32 w-32 bg-indigo-200/40 rounded-full blur-2xl" />
          </div>
        </section>

        {/* ✅ Premium Gallery */}
        <section className="bg-gradient-to-br from-pink-50 to-white rounded-2xl p-5 border border-pink-100 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              📸 গ্যালারির ছবি
              <span className="text-xs font-medium text-pink-600 bg-pink-100 px-2 py-0.5 rounded-full">
                Optional
              </span>
            </h2>

            {form.images.length > 0 && (
              <p className="text-xs text-gray-500">
                {form.images.length} ছবি যুক্ত আছে
              </p>
            )}
          </div>

          <div
            ref={galleryDropRef}
            onDrop={handleGalleryDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() =>
              galleryDropRef.current?.querySelector("input")?.click()
            }
            className="group relative rounded-2xl border-2 border-dashed border-pink-200 bg-pink-50/40 p-5 cursor-pointer hover:border-pink-400 hover:bg-white transition"
          >
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-white shadow-sm ring-1 ring-pink-100 flex items-center justify-center text-2xl">
                🖼️
              </div>

              <div className="flex-1 text-center sm:text-left">
                <p className="font-semibold text-gray-700">
                  একাধিক ছবি ড্র্যাগ করে ছাড়ুন
                </p>
                <p className="text-sm text-gray-500">
                  অথবা ক্লিক করে সিলেক্ট করুন
                </p>
                <p className="text-xs text-gray-400">
                  JPG, PNG, WEBP • Multiple allowed • Max 5MB each
                </p>
              </div>

              <div className="px-3 py-1.5 rounded-lg bg-pink-600 text-white text-xs font-medium shadow-sm">
                ⬆ Upload Gallery
              </div>
            </div>

            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleGalleryFiles(e.target.files)}
            />
          </div>

          {form.images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {form.images.map((img, idx) => {
                const src =
                  typeof img === "string" ? img : URL.createObjectURL(img);

                return (
                  <div
                    key={idx}
                    className="relative group rounded-xl overflow-hidden border bg-white shadow-sm"
                  >
                    <img
                      src={src}
                      alt={`gallery-${idx}`}
                      className="h-28 w-full object-cover transition group-hover:scale-105"
                    />

                    <button
                      type="button"
                      onClick={() => removeGalleryImage(idx)}
                      className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full shadow opacity-0 group-hover:opacity-100 transition"
                    >
                      ✖
                    </button>

                    <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-xs px-2 py-1 flex items-center justify-between opacity-0 group-hover:opacity-100 transition">
                      <span>#{idx + 1}</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => moveGalleryImage(idx, idx - 1)}
                          className="bg-white/20 px-2 py-0.5 rounded hover:bg-white/30"
                          title="Move Up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveGalleryImage(idx, idx + 1)}
                          className="bg-white/20 px-2 py-0.5 rounded hover:bg-white/30"
                          title="Move Down"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Reviews */}
        <section className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-700">⭐ গ্রাহক রিভিউ</h2>
            <button
              type="button"
              onClick={addReview}
              className="text-sm font-semibold text-indigo-600 hover:underline"
            >
              + নতুন রিভিউ যোগ করুন
            </button>
          </div>

          {form.reviews.length === 0 && (
            <p className="text-sm text-gray-500">এখনও কোনো রিভিউ নেই</p>
          )}

          {form.reviews.map((r, idx) => (
            <div key={idx} className="bg-white border rounded-xl p-3 space-y-2">
              <div className="flex justify-between items-center">
                <p className="font-semibold text-sm text-gray-700">
                  রিভিউ #{idx + 1}
                </p>
                <button
                  type="button"
                  onClick={() => removeReview(idx)}
                  className="text-xs text-red-600 hover:underline"
                >
                  🗑 মুছুন
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold">নাম</label>
                <input
                  className="mt-1 w-full border rounded-lg p-2"
                  value={r.user}
                  onChange={(e) =>
                    handleReviewChange(idx, "user", e.target.value)
                  }
                  placeholder="Customer name"
                />
              </div>

              <div>
                <label className="text-xs font-semibold">রেটিং (০–৫)</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  className="mt-1 w-full border rounded-lg p-2"
                  value={r.rating}
                  onChange={(e) =>
                    handleReviewChange(idx, "rating", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="text-xs font-semibold">মন্তব্য</label>
                <textarea
                  className="mt-1 w-full border rounded-lg p-2 min-h-[60px]"
                  value={r.comment}
                  onChange={(e) =>
                    handleReviewChange(idx, "comment", e.target.value)
                  }
                />
              </div>
            </div>
          ))}
        </section>

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          <button
            type="submit"
            disabled={processing}
            className={`w-full py-3 rounded-xl text-white font-semibold shadow-sm transition ${
              processing
                ? "bg-gray-400"
                : "bg-gradient-to-r from-green-500 to-lime-500 hover:scale-[1.01]"
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
            className="w-full py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition font-medium"
          >
            ✖ বাতিল
          </button>
        </div>
      </form>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
