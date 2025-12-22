"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Toast from "../Toast";
import HeaderSerialStatus from "./HeaderSerialStatus";
import BasicInfoCategory from "./BasicInfoCategory";
import MainImageSection from "./MainImageSection";
import GallerySection from "./GallerySection";
import ReviewsSection from "./ReviewsSection";
import FormButtons from "./FormButtons";
import ColorVariantSection from "./ColorVariantSection";

export default function ProductForm({
  product,
  productsLength = 0,
  onClose,
  onSaved,
}) {
  const [categories, setCategories] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: "",
    price: "",
    oldPrice: "",
    stock: 0,
    sold: 0,
    rating: "",
    description: "",
    additionalInfo: "",
    category: "",
    image: null,
    images: [],
    colors: [],
    reviews: [],
    order: 1,
    isActive: true,
    isSoldOut: false,
  });

  const [previewImage, setPreviewImage] = useState("");
  const [removedImages, setRemovedImages] = useState([]);

  const mainDropRef = useRef(null);
  const galleryDropRef = useRef(null);

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
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadCategories();
      setRemovedImages([]);
      setErrors({});

      if (product) {
        setForm({
          name: product.name || "",
          price: Number(product.price) || 0,
          oldPrice: Number(product.oldPrice) || 0,
          stock: Number(product.stock) || 0,
          sold: Number(product.sold) || 0,
          rating: Number(product.rating) || 0,
          description: product.description || "",
          additionalInfo: product.additionalInfo || "",
          category: product.category?._id || "",
          image: null,
          images: product.images || [],
          colors: product.colors?.map((c) => ({ ...c, files: [] })) || [],
          reviews: product.reviews || [],
          order: product.order || 1,
          isActive: product.isActive ?? true,
          isSoldOut: product.isSoldOut ?? false,
        });
        setPreviewImage(product.image || "");
      } else {
        setForm((prev) => ({ ...prev, order: productsLength + 1 }));
      }
    };
    init();
  }, [product, productsLength]);

  const handleSingleImage = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewImage(URL.createObjectURL(file));
      setForm((prev) => ({ ...prev, image: file }));
    }
  };

  const removeMainImage = () => {
    setPreviewImage("");
    setForm((p) => ({ ...p, image: null }));
  };

  const galleryPreviews = useMemo(() => {
    return form.images.map((img) =>
      typeof img === "string" ? img : URL.createObjectURL(img)
    );
  }, [form.images]);

  const handleGalleryFiles = (files) => {
    const incoming = Array.from(files || []).filter(
      (f) => f.size <= 5 * 1024 * 1024
    );
    setForm((prev) => ({ ...prev, images: [...prev.images, ...incoming] }));
  };

  const removeGalleryImage = (idx) => {
    setForm((prev) => {
      const img = prev.images[idx];
      if (typeof img === "string") setRemovedImages((old) => [...old, img]);
      return { ...prev, images: prev.images.filter((_, i) => i !== idx) };
    });
  };

  const addColor = () => {
    setForm((prev) => ({
      ...prev,
      colors: [...prev.colors, { name: "", stock: 0, images: [], files: [] }],
    }));
  };

  const handleColorChange = (index, field, value) => {
    setForm((prev) => {
      const updatedColors = [...prev.colors];
      updatedColors[index] = { ...updatedColors[index], [field]: value };
      return { ...prev, colors: updatedColors };
    });
  };

  const removeColor = (index) => {
    setForm((prev) => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index),
    }));
  };

  const handleReviewChange = (idx, field, value) => {
    setForm((prev) => {
      const next = [...prev.reviews];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, reviews: next };
    });
  };

  // ... (অন্যান্য ইমপোর্ট এবং স্টেট ঠিক আছে)

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const formData = new FormData();

      // ১. সাধারণ ফিল্ডগুলো অ্যাপেন্ড করা
      Object.keys(form).forEach((key) => {
        if (!["image", "images", "reviews", "colors"].includes(key)) {
          formData.append(key, form[key]);
        }
      });

      const hasVariants = form.colors.length > 0;

      if (!hasVariants) {
        // সাধারণ মোড
        if (form.image) formData.append("image", form.image);
        const existingGallery = [];
        form.images.forEach((img) => {
          if (img instanceof File) formData.append("images", img);
          else existingGallery.push(img);
        });
        formData.append("existingImages", JSON.stringify(existingGallery));
      } else {
        // ২. কালার ভেরিয়েন্ট মোড (সবচেয়ে গুরুত্বপূর্ণ অংশ)
        const colorsMeta = form.colors.map((color, idx) => {
          if (color.files && color.files.length > 0) {
            color.files.forEach((file) => {
              formData.append(`color_images_${idx}`, file); // ডাইনামিক ফিল্ড নেম
            });
          }
          return {
            name: color.name,
            stock: color.stock,
            images: color.images || [], // পুরনো ইমেজ ইউআরএল
          };
        });
        formData.append("colors", JSON.stringify(colorsMeta));
      }

      formData.append("removedImages", JSON.stringify(removedImages));
      formData.append("reviews", JSON.stringify(form.reviews));

      const url = product
        ? `${process.env.NEXT_PUBLIC_API_URL}/admin/products/${product._id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/admin/products`;

      const res = await fetch(url, {
        method: product ? "PUT" : "POST",
        body: formData, // JSON headers লাগবে না
      });

      if (res.ok) {
        setToast({ message: "সফলভাবে সেভ হয়েছে!", type: "success" });
        onSaved?.();
        onClose?.();
      } else {
        throw new Error("Failed");
      }
    } catch (err) {
      setToast({ message: "ভুল হয়েছে!", type: "error" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-xl border p-5 sm:p-7 space-y-6 max-h-[90vh] overflow-y-auto"
      >
        <HeaderSerialStatus
          product={product}
          form={form}
          setForm={setForm}
          maxSerial={product ? productsLength : productsLength + 1}
        />

        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border">
          <div>
            <label className="block text-sm font-bold mb-1">
              Total Sold Count
            </label>
            <input
              type="number"
              value={form.sold}
              onChange={(e) => setForm({ ...form, sold: e.target.value })}
              className="w-full border p-2 rounded"
            />
          </div>
          <div className="flex items-center gap-2 mt-6">
            <input
              type="checkbox"
              id="soldOut"
              checked={form.isSoldOut}
              onChange={(e) =>
                setForm({ ...form, isSoldOut: e.target.checked })
              }
              className="w-5 h-5 accent-red-600"
            />
            <label
              htmlFor="soldOut"
              className="font-bold text-red-600 cursor-pointer"
            >
              Manual Sold Out
            </label>
          </div>
        </div>

        <BasicInfoCategory
          form={form}
          setForm={setForm}
          categories={categories}
          errors={errors}
          setErrors={setErrors}
        />

        {form.colors.length === 0 ? (
          <>
            <MainImageSection
              form={form}
              previewImage={previewImage}
              handleSingleImage={handleSingleImage}
              removeMainImage={removeMainImage}
              errors={errors}
              mainDropRef={mainDropRef}
            />
            <GallerySection
              form={form}
              handleGalleryFiles={handleGalleryFiles}
              galleryPreviews={galleryPreviews}
              removeGalleryImage={removeGalleryImage}
              clearAllGallery={() => setForm({ ...form, images: [] })}
              galleryDropRef={galleryDropRef}
            />
          </>
        ) : (
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 text-center">
            <p className="text-purple-700 text-sm font-bold">
              ⚠️ কালার ভেরিয়েন্ট মোড অ্যাক্টিভ। নিচের ভেরিয়েন্ট অপশনে ইমেজ আপলোড
              করুন।
            </p>
          </div>
        )}

        <ColorVariantSection
          form={form}
          addColor={addColor}
          handleColorChange={handleColorChange}
          removeColor={removeColor}
        />

        <ReviewsSection
          form={form}
          handleReviewChange={handleReviewChange}
          addReview={() =>
            setForm((p) => ({
              ...p,
              reviews: [...p.reviews, { user: "", rating: 0, comment: "" }],
            }))
          }
          removeReview={(idx) =>
            setForm({
              ...form,
              reviews: form.reviews.filter((_, i) => i !== idx),
            })
          }
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
