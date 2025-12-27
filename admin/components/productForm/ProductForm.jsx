"use client";
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import Toast from "../Toast";
import HeaderSerialStatus from "./HeaderSerialStatus";
import BasicInfoCategory from "./BasicInfoCategory";
import VariantSection from "./VariantSection";
import ReviewsSection from "./ReviewsSection";

const EMPTY_DEFAULT_VARIANT = {
  name: "Default Variant",
  price: "",
  oldPrice: "",
  stock: 0,
  sold: 0,
  files: [],
  isBase: true,
};

export default function ProductForm({
  product,
  productsLength = 0,
  onClose,
  onSaved,
}) {
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState(null);
  const [variantMode, setVariantMode] = useState("default");
  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);

  // ✅ NEW: drafts (mode switch এ data হারাবে না)
  const [baseDraft, setBaseDraft] = useState(EMPTY_DEFAULT_VARIANT);
  const [variantDrafts, setVariantDrafts] = useState([]);

  // ✅ NEW: image load / normalize ready (save disable until ready)
  const [filesReady, setFilesReady] = useState(true);

  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    additionalInfo: "",
    order: 1,
    isActive: true,
    variants: [EMPTY_DEFAULT_VARIANT],
    reviews: [],
  });

  /* ---------------- Fetch Categories ---------------- */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/categories`
        );
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : data.categories || []);
      } catch (err) {
        console.error("Category load error:", err);
      }
    };
    fetchCategories();
  }, []);

  /* ---------------- Initialize Form ---------------- */
  useEffect(() => {
    if (!product) {
      setForm((p) => ({ ...p, order: productsLength + 1 }));

      setBaseDraft({ ...EMPTY_DEFAULT_VARIANT });
      setVariantDrafts([]);
      setVariantMode("default");

      // ✅ reset
      setFilesReady(true);

      return;
    }

    const rawVariants = product.colors || [];

    // ✅ Product has variants
    if (rawVariants.length > 0) {
      setVariantMode("variant");

      const mappedVariants = rawVariants.map((v) => ({
        ...v,

        // fallback for old data
        price: v.price ?? product.price ?? "",
        oldPrice: v.oldPrice ?? product.oldPrice ?? "",
        stock: v.stock ?? product.stock ?? 0,
        sold: v.sold ?? product.sold ?? 0,

        files: v.images || [], // string urls initially, VariantSection will normalize
        isBase: false,
      }));

      setVariantDrafts(mappedVariants);

      const base = {
        ...EMPTY_DEFAULT_VARIANT,
        price: product.price || "",
        oldPrice: product.oldPrice || "",
        stock: product.stock || 0,
        sold: product.sold || 0,
        files: product.images || [],
        isBase: true,
      };

      setBaseDraft(base);

      setForm({
        name: product.name || "",
        category: product.category?._id || product.category || "",
        description: product.description || "",
        additionalInfo: product.additionalInfo || "",
        order: product.order || productsLength,
        isActive: product.isActive ?? true,
        variants: mappedVariants,
        reviews: product.reviews || [],
      });

      // ✅ reset
      setFilesReady(true);
    }
    // ✅ Product has NO variants (default mode)
    else {
      setVariantMode("default");

      const base = {
        ...EMPTY_DEFAULT_VARIANT,
        price: product.price || "",
        oldPrice: product.oldPrice || "",
        stock: product.stock || 0,
        sold: product.sold || 0,
        files: product.images || [],
        isBase: true,
      };

      setBaseDraft(base);
      setVariantDrafts([]);

      setForm({
        name: product.name || "",
        category: product.category?._id || product.category || "",
        description: product.description || "",
        additionalInfo: product.additionalInfo || "",
        order: product.order || productsLength,
        isActive: product.isActive ?? true,
        variants: [base],
        reviews: product.reviews || [],
      });

      // ✅ reset
      setFilesReady(true);
    }
  }, [product, productsLength]);

  /* ---------------- Rating ---------------- */
  const averageRating = useMemo(() => {
    if (form.reviews.length === 0) return 0;
    const total = form.reviews.reduce(
      (sum, r) => sum + Number(r.rating || 0),
      0
    );
    return (total / form.reviews.length).toFixed(1);
  }, [form.reviews]);

  /* ---------------- Validation ---------------- */
  const validateForm = () => {
    const e = {};
    if (!form.name?.trim()) e.name = "প্রোডাক্ট নাম দিতে হবে";
    if (!form.category) e.category = "ক্যাটাগরি নির্বাচন করুন";

    form.variants.forEach((v, i) => {
      if (variantMode === "default") {
        if (!v.price) e.basePrice = "মূল্য দিতে হবে";
        if (!v.files || v.files.length === 0)
          e.baseImages = "অন্তত একটি ছবি দিন";
      } else {
        if (!v.name?.trim()) e[`variantName_${i}`] = "নাম দিতে হবে";
        if (!v.price) e[`variantPrice_${i}`] = "মূল্য দিতে হবে";
        if (!v.files || v.files.length === 0)
          e[`variantImages_${i}`] = "ছবি দিতে হবে";
      }
    });

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ---------------- Enable Variant ---------------- */
  const handleEnableVariant = () => {
    if (variantMode === "variant") return;
    setErrors({});

    const firstVariant = {
      ...baseDraft,
      price:
        baseDraft.price ?? form.variants?.[0]?.price ?? product?.price ?? "",
      oldPrice: baseDraft.oldPrice ?? product?.oldPrice ?? "",
      stock: baseDraft.stock ?? product?.stock ?? 0,
      sold: baseDraft.sold ?? product?.sold ?? 0,
      name: baseDraft.name === "Default Variant" ? "" : baseDraft.name,
      isBase: false,
    };

    setVariantDrafts([firstVariant]);
    setForm((p) => ({ ...p, variants: [firstVariant] }));
    setVariantMode("variant");

    // ✅ reset
    setFilesReady(true);
  };

  /* ---------------- Back to Default ---------------- */
  const handleDefaultMode = () => {
    if (variantMode === "default") return;
    setErrors({});

    const first = variantDrafts[0] || EMPTY_DEFAULT_VARIANT;

    const restoredBase = {
      ...first,
      name: "Default Variant",
      isBase: true,
    };

    setBaseDraft(restoredBase);
    setForm((p) => ({ ...p, variants: [restoredBase] }));
    setVariantMode("default");

    // ✅ reset
    setFilesReady(true);
  };

  /* ---------------- Submit ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ if files not ready -> block submit
    if (!filesReady) {
      return setToast({
        type: "error",
        message: "ছবি লোড হচ্ছে... একটু অপেক্ষা করুন",
      });
    }

    if (!validateForm()) {
      return setToast({
        type: "error",
        message: "লাল চিহ্নিত ঘরগুলো সঠিকভাবে পূরণ করুন",
      });
    }

    setProcessing(true);

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("category", form.category);
      formData.append("description", form.description || "");
      formData.append("additionalInfo", form.additionalInfo || "");
      formData.append("order", form.order);
      formData.append("isActive", form.isActive);
      formData.append("rating", averageRating);
      formData.append("reviews", JSON.stringify(form.reviews));

      /* ---------------- DEFAULT MODE ---------------- */
      if (variantMode === "default") {
        const base = form.variants[0];

        formData.append("price", base.price || 0);
        formData.append("oldPrice", base.oldPrice || 0);
        formData.append("stock", base.stock || 0);
        formData.append("sold", base.sold || 0);

        const existingImg = [];

        (base.files || []).forEach((fileItem) => {
          // ✅ if normalized {id, src}
          const src = fileItem?.src ?? fileItem;

          if (src instanceof File) {
            formData.append("images", src);
          } else if (typeof src === "string") {
            existingImg.push(src);
          }
        });

        formData.append("existingImages", JSON.stringify(existingImg));
        formData.append("colors", JSON.stringify([]));
      } else {
        /* ---------------- VARIANT MODE ---------------- */
        const variants = form.variants;

        // ✅ Upload new files for each variant
        variants.forEach((v, idx) => {
          (v.files || []).forEach((fileItem) => {
            const src = fileItem?.src ?? fileItem;
            if (src instanceof File) {
              formData.append(`color_images_${idx}`, src);
            }
          });
        });

        // ✅ existing images (string urls)
        formData.append(
          "colors",
          JSON.stringify(
            variants.map(({ files, ...rest }) => ({
              ...rest,
              images: (files || [])
                .map((f) => f?.src ?? f)
                .filter((src) => typeof src === "string"),
            }))
          )
        );

        // ✅ keep main price for backward compatibility
        formData.append("price", variants[0]?.price || 0);
      }

      const url = product
        ? `${process.env.NEXT_PUBLIC_API_URL}/admin/products/${product._id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/admin/products`;

      const res = await fetch(url, {
        method: product ? "PUT" : "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save");
      }

      setToast({ message: "সফলভাবে সংরক্ষিত হয়েছে", type: "success" });
      onSaved?.();
      onClose?.();
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setProcessing(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-2xl w-full max-w-5xl max-h-[98vh] overflow-y-auto shadow-xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 z-10"
        >
          <X size={24} />
        </button>

        <div className="p-6 space-y-6">
          <HeaderSerialStatus
            product={product}
            form={form}
            setForm={setForm}
            maxSerial={productsLength}
          />

          <BasicInfoCategory
            form={form}
            setForm={setForm}
            categories={categories}
            errors={errors}
            setErrors={setErrors}
          />

          <div className="flex p-1 bg-gray-100 rounded-xl w-fit border">
            <button
              type="button"
              onClick={handleDefaultMode}
              className={`px-8 py-2.5 rounded-lg font-bold text-sm transition-all ${
                variantMode === "default"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              Default Mode
            </button>

            <button
              type="button"
              onClick={handleEnableVariant}
              className={`px-8 py-2.5 rounded-lg font-bold text-sm transition-all ${
                variantMode === "variant"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-500"
              }`}
            >
              Enable Variants
            </button>
          </div>

          <VariantSection
            variants={form.variants}
            setVariants={(v) => {
              setForm((p) => ({ ...p, variants: v }));

              // ✅ drafts sync
              if (variantMode === "default") setBaseDraft(v[0]);
              else setVariantDrafts(v);
            }}
            mode={variantMode}
            errors={errors}
            setErrors={setErrors}
            onFilesReadyChange={setFilesReady} // ✅ NEW
          />

          <ReviewsSection
            form={form}
            averageRating={averageRating}
            handleReviewChange={(i, f, v) => {
              const next = [...form.reviews];
              next[i] = { ...next[i], [f]: v };
              setForm((p) => ({ ...p, reviews: next }));
            }}
            addReview={() =>
              setForm((p) => ({
                ...p,
                reviews: [...p.reviews, { user: "", rating: 5, comment: "" }],
              }))
            }
            removeReview={(i) =>
              setForm((p) => ({
                ...p,
                reviews: p.reviews.filter((_, idx) => idx !== i),
              }))
            }
          />

          <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t mt-4">
            <button
              type="submit"
              disabled={processing || !filesReady}
              className={`w-full py-3.5 rounded-xl text-white font-bold text-base transition-all ${
                processing || !filesReady
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99]"
              }`}
            >
              {processing
                ? "প্রসেসিং..."
                : !filesReady
                ? "ছবি লোড হচ্ছে..."
                : product
                ? "💾 আপডেট করুন"
                : "💾 সংরক্ষণ করুন"}
            </button>
          </div>
        </div>
      </form>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
