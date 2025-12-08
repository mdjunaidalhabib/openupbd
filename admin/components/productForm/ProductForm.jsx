"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Toast from "../Toast";
import HeaderSerialStatus from "./HeaderSerialStatus";
import BasicInfoCategory from "./BasicInfoCategory";
import MainImageSection from "./MainImageSection";
import GallerySection from "./GallerySection";
import ReviewsSection from "./ReviewsSection";
import FormButtons from "./FormButtons";

export default function ProductForm({
  product,
  productsLength = 0,
  onClose,
  onSaved,
}) {
  const [categories, setCategories] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState(null);

  const [errors, setErrors] = useState({}); // ✅ NEW

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
    order: 1,
    isActive: true,
  });

  const [previewImage, setPreviewImage] = useState("");
  const [mainPreviewBlob, setMainPreviewBlob] = useState("");

  const [removedImages, setRemovedImages] = useState([]);

  const mainDropRef = useRef(null);
  const galleryDropRef = useRef(null);

  // =========================
  // Load Categories
  // =========================
  const loadCategories = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/categories`
      );
      if (!res.ok) throw new Error();
      const data = await res.json();

      let arr = Array.isArray(data) ? data : [];
      arr.sort((a, b) => (a.order || 0) - (b.order || 0));
      setCategories(arr);
    } catch (err) {
      console.error("Category load error:", err);
      setCategories([]);
      setToast({ message: "❌ ক্যাটাগরি লোড করা যায়নি!", type: "error" });
    }
  };

  // =========================
  // Init when product changes
  // =========================
  useEffect(() => {
    const init = async () => {
      await loadCategories();
      setRemovedImages([]);
      setErrors({}); // ✅ reset errors on init

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
          order: product.order || 1,
          isActive: product.isActive ?? true,
        });
        setPreviewImage(product.image || "");
        setMainPreviewBlob("");
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
          order: productsLength + 1,
          isActive: true,
        });
        setPreviewImage("");
        setMainPreviewBlob("");
      }
    };

    init();
  }, [product, productsLength]);

  // cleanup main preview blob
  useEffect(() => {
    return () => {
      if (mainPreviewBlob?.startsWith("blob:")) {
        URL.revokeObjectURL(mainPreviewBlob);
      }
    };
  }, [mainPreviewBlob]);

  // =========================
  // Main Image select + preview
  // =========================
  const setMainImage = (file) => {
    if (!file || !file.type?.startsWith("image/")) return;

    if (file.size > 5 * 1024 * 1024) {
      setToast({
        message: "⚠️ প্রধান ছবির সাইজ 5MB এর বেশি হতে পারবে না!",
        type: "error",
      });
      return;
    }

    if (mainPreviewBlob?.startsWith("blob:")) {
      URL.revokeObjectURL(mainPreviewBlob);
    }

    const blobUrl = URL.createObjectURL(file);
    setMainPreviewBlob(blobUrl);
    setPreviewImage(blobUrl);

    setErrors((prev) => ({ ...prev, image: false })); // ✅ error clear on select
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

  const removeMainImage = () => {
    if (mainPreviewBlob?.startsWith("blob:")) {
      URL.revokeObjectURL(mainPreviewBlob);
    }
    setMainPreviewBlob("");
    setPreviewImage("");
    setForm((p) => ({ ...p, image: null }));
  };

  // =========================
  // Gallery Logic
  // =========================
  const galleryPreviews = useMemo(() => {
    return form.images.map((img) =>
      typeof img === "string" ? img : URL.createObjectURL(img)
    );
  }, [form.images]);

  useEffect(() => {
    return () => {
      galleryPreviews.forEach((src) => {
        if (src?.startsWith("blob:")) URL.revokeObjectURL(src);
      });
    };
  }, [galleryPreviews]);

  const handleGalleryFiles = (files) => {
    const incoming = Array.from(files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (!incoming.length) return;

    const valid = incoming.filter((f) => f.size <= 5 * 1024 * 1024);
    const invalidCount = incoming.length - valid.length;

    if (invalidCount > 0) {
      setToast({
        message: `⚠️ ${invalidCount}টি ছবি 5MB এর বেশি ছিল, তাই যোগ করা হয় নাই!`,
        type: "error",
      });
    }

    setForm((prev) => ({
      ...prev,
      images: [...prev.images, ...valid],
    }));
  };

  const handleGalleryDrop = (e) => {
    e.preventDefault();
    handleGalleryFiles(e.dataTransfer.files);
  };

  const removeGalleryImage = (idx) => {
    setForm((prev) => {
      const img = prev.images[idx];

      if (typeof img === "string") {
        setRemovedImages((old) => [...old, img]);
      }

      return {
        ...prev,
        images: prev.images.filter((_, i) => i !== idx),
      };
    });
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

  const clearAllGallery = () => {
    setForm((prev) => ({ ...prev, images: [] }));

    const oldStrings = form.images.filter((x) => typeof x === "string");
    if (oldStrings.length) {
      setRemovedImages((old) => [...old, ...oldStrings]);
    }
  };

  // =========================
  // Reviews + avg rating
  // =========================
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

  // =========================
  // Submit
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    let newErrors = {};
    if (!form.name?.trim()) newErrors.name = true;
    if (!form.price || Number(form.price) <= 0) newErrors.price = true;
    if (!form.category) newErrors.category = true;

    const hasMainImage = !!form.image || !!previewImage;
    if (!hasMainImage) newErrors.image = true;

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
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

      form.images.forEach((img) => {
        if (img instanceof File) data.append("images", img);
      });

      const existingUrls = form.images.filter((img) => typeof img === "string");
      data.append("existingImages", JSON.stringify(existingUrls));

      data.append("removedImages", JSON.stringify(removedImages));
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
          message: "❌ ইমেজের সাইজ ঠিক নাই বা ইমেজ আপলোড হচ্ছে!",
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

  const selectedCatObj = categories.find((c) => c._id === form.category);
  const maxSerial = product ? productsLength : productsLength + 1;

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-xl border p-5 sm:p-7 space-y-6"
      >
        <HeaderSerialStatus
          product={product}
          form={form}
          setForm={setForm}
          maxSerial={maxSerial}
        />

        <BasicInfoCategory
          form={form}
          setForm={setForm}
          categories={categories}
          selectedCatObj={selectedCatObj}
          errors={errors}
          setErrors={setErrors} // ✅ NEW: pass setter
        />

        <MainImageSection
          form={form}
          previewImage={previewImage}
          mainDropRef={mainDropRef}
          handleMainDrop={handleMainDrop}
          handleSingleImage={handleSingleImage}
          removeMainImage={removeMainImage}
          errors={errors}
        />

        <GallerySection
          form={form}
          galleryDropRef={galleryDropRef}
          handleGalleryDrop={handleGalleryDrop}
          handleGalleryFiles={handleGalleryFiles}
          galleryPreviews={galleryPreviews}
          removeGalleryImage={removeGalleryImage}
          moveGalleryImage={moveGalleryImage}
          clearAllGallery={clearAllGallery}
        />

        <ReviewsSection
          form={form}
          addReview={addReview}
          handleReviewChange={handleReviewChange}
          removeReview={removeReview}
        />

        <FormButtons
          processing={processing}
          product={product}
          onClose={onClose}
        />
      </form>

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
