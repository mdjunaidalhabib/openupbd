"use client";
import { useEffect, useMemo, useRef, useState } from "react";
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

  // ✅ NEW: snapshot for dirty tracking
  const initialSnapshotRef = useRef(null);
  const [initDone, setInitDone] = useState(false);

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

  // ✅ NEW: sanitize helper for compare (remove non-serializable / unstable)
  const sanitizeFormForCompare = (f) => {
    const safeVariants = (Array.isArray(f?.variants) ? f.variants : []).map(
      (v) => ({
        name: v?.name || "",
        price: v?.price ?? "",
        oldPrice: v?.oldPrice ?? "",
        stock: Number(v?.stock ?? 0),
        sold: Number(v?.sold ?? 0),
        isBase: !!v?.isBase,
        filesMeta: (Array.isArray(v?.files) ? v.files : []).map((x) => {
          const src = x?.src ?? x;
          if (src instanceof File)
            return `FILE:${src.name}:${src.size}:${src.lastModified}`;
          return `URL:${String(src)}`;
        }),
      })
    );

    const safeReviews = (Array.isArray(f?.reviews) ? f.reviews : []).map(
      (r) => ({
        user: r?.user || "",
        rating: Number(r?.rating || 0),
        comment: r?.comment || "",
      })
    );

    return {
      name: f?.name || "",
      category: f?.category || "",
      description: f?.description || "",
      additionalInfo: f?.additionalInfo || "",
      order: Number(f?.order || 1),
      isActive: !!f?.isActive,
      variants: safeVariants,
      reviews: safeReviews,
    };
  };

  // ✅ NEW: isDirty state (no update = save disabled)
  const isDirty = useMemo(() => {
    if (!initialSnapshotRef.current) return false;
    const now = JSON.stringify(sanitizeFormForCompare(form));
    return now !== initialSnapshotRef.current;
  }, [form]);

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
    setInitDone(false);

    if (!product) {
      setForm((p) => ({ ...p, order: productsLength + 1 }));

      setBaseDraft({ ...EMPTY_DEFAULT_VARIANT });
      setVariantDrafts([]);
      setVariantMode("default");

      // ✅ reset
      setFilesReady(true);

      setInitDone(true);
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

      setInitDone(true);
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

      setInitDone(true);
    }
  }, [product, productsLength]);

  // ✅ NEW: snapshot only once per init
  useEffect(() => {
    if (!initDone) return;
    initialSnapshotRef.current = JSON.stringify(sanitizeFormForCompare(form));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initDone]);

  /* ---------------- Rating ---------------- */
  const averageRating = useMemo(() => {
    if (!Array.isArray(form.reviews) || form.reviews.length === 0) return 0;
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

    const list = Array.isArray(form.variants) ? form.variants : [];

    list.forEach((v, i) => {
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
      files: Array.isArray(baseDraft?.files) ? baseDraft.files : [],
      price:
        baseDraft.price ?? form.variants?.[0]?.price ?? product?.price ?? "",
      oldPrice: baseDraft.oldPrice ?? product?.oldPrice ?? "",
      stock: baseDraft.stock ?? product?.stock ?? 0,
      sold: baseDraft.sold ?? product?.sold ?? 0,
      name: baseDraft.name === "Default Variant" ? "" : baseDraft.name,
      isBase: false,
    };

    setVariantDrafts([firstVariant]);

    setForm((p) => ({
      ...p,
      variants: [firstVariant],
    }));
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
      files: Array.isArray(first?.files) ? first.files : [],
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

    // ✅ if no update -> block submit
    if (!isDirty) {
      return setToast({
        type: "error",
        message: "কোনো পরিবর্তন করা হয়নি",
      });
    }

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
        const base = Array.isArray(form.variants) ? form.variants[0] : null;

        formData.append("price", base?.price || 0);
        formData.append("oldPrice", base?.oldPrice || 0);
        formData.append("stock", base?.stock || 0);
        formData.append("sold", base?.sold || 0);

        const existingImg = [];

        (base?.files || []).forEach((fileItem) => {
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
        const variants = Array.isArray(form.variants) ? form.variants : [];

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

        // ✅ IMPORTANT:
        // এখানে oldPrice/stock/sold পাঠানো লাগবে না
        // কারণ backend updateProduct() এখন variants থেকে main fields sync করে
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

      // ✅ NEW: reset dirty snapshot after successful save
      initialSnapshotRef.current = JSON.stringify(sanitizeFormForCompare(form));

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

        {/* ✅ NEW: Sticky top right Save/Cancel bar (scroll করলে নড়বে না) */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="text-sm font-bold text-gray-700 flex items-center gap-2">
              {product ? "✏️ Edit Product" : "➕ Add Product"}
              {!isDirty && (
                <span className="text-[11px] font-semibold text-gray-400">
                  (No changes)
                </span>
              )}
              {!filesReady && (
                <span className="text-[11px] font-semibold text-orange-500">
                  (Images loading…)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl font-bold text-sm border bg-white hover:bg-gray-50 active:scale-[0.99]"
              >
                ✖ Cancel
              </button>

              <button
                type="submit"
                disabled={processing || !filesReady || !isDirty}
                className={`px-5 py-2 rounded-xl text-white font-bold text-sm transition-all ${
                  processing || !filesReady || !isDirty
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99]"
                }`}
              >
                {processing
                  ? "প্রসেসিং..."
                  : !filesReady
                  ? "ছবি লোড হচ্ছে..."
                  : !isDirty
                  ? "No changes"
                  : product
                  ? "💾 আপডেট করুন"
                  : "💾 সংরক্ষণ করুন"}
              </button>
            </div>
          </div>
        </div>

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
            variants={Array.isArray(form.variants) ? form.variants : []}
            setVariants={(v) => {
              const nextVariants = Array.isArray(v) ? v : [];
              setForm((p) => ({ ...p, variants: nextVariants }));

              // ✅ drafts sync
              if (variantMode === "default")
                setBaseDraft(nextVariants[0] || EMPTY_DEFAULT_VARIANT);
              else setVariantDrafts(nextVariants);
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
              const next = Array.isArray(form.reviews) ? [...form.reviews] : [];
              next[i] = { ...next[i], [f]: v };
              setForm((p) => ({ ...p, reviews: next }));
            }}
            addReview={() =>
              setForm((p) => ({
                ...p,
                reviews: [
                  ...(Array.isArray(p.reviews) ? p.reviews : []),
                  { user: "", rating: 5, comment: "" },
                ],
              }))
            }
            removeReview={(i) =>
              setForm((p) => ({
                ...p,
                reviews: (Array.isArray(p.reviews) ? p.reviews : []).filter(
                  (_, idx) => idx !== i
                ),
              }))
            }
          />
        </div>
      </form>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
} /////////////// kono ubdate na kora hole button diseble thakbe//// kono ubdate korlei buttone active hobe... save and cancel 2 tai upore dan pashe fixt thakbe.// jeno scrool korlew na sore jai... with best ui ....... ar akhon image dile sob image uplood kora jaina... ber ber image ar karone fald ase... ar karon ki.. ata fixt korte hobe,,,,, atar jonno valo pera lagse product add korte giya... ...................... all fixt kore full code daw
