"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  FaPlus,
  FaTrash,
  FaImages,
  FaTimes,
  FaGripVertical,
} from "react-icons/fa";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* ---------------- Sortable Image Item ---------------- */
function SortableImage({ item, vIdx, removeFile }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // ✅ FIX: useEffect + useState (no more blob revoke timing bugs)
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    const src = item?.src;

    if (typeof src === "string") {
      setImageUrl(src);
      return;
    }

    if (src instanceof File) {
      const url = URL.createObjectURL(src);
      setImageUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    }

    setImageUrl("");
  }, [item?.src]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative w-24 h-24 rounded-xl overflow-hidden border group shadow-sm bg-white"
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          className="w-full h-full object-cover"
          alt="preview"
        />
      ) : (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
          No Preview
        </div>
      )}

      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 bg-black/50 text-white p-1 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <FaGripVertical size={10} />
      </div>

      <button
        type="button"
        onClick={() => removeFile(vIdx, item.id)}
        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none z-10"
      >
        <FaTimes size={10} />
      </button>
    </div>
  );
}

/* ---------------- Main Component ---------------- */
export default function VariantSection({
  variants,
  setVariants,
  mode,
  errors,
  setErrors,
  onFilesReadyChange, // ✅ NEW PROP
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const baseInput =
    "mt-1 w-full border p-2.5 rounded-lg focus:outline-none transition-all text-sm";
  const okClass = "border-gray-300 focus:ring-2 focus:ring-indigo-100";
  const disabledStyle =
    "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200";
  const errClass = "border-red-500 bg-red-50 focus:ring-red-100";

  // ✅ safe encode id for URL
  const safeUrlId = (url) => {
    try {
      return btoa(url).replace(/=/g, "");
    } catch {
      return encodeURIComponent(url);
    }
  };

  // ✅ helper: normalize to {id, src}
  const toFileItems = (files) => {
    const used = new Set();

    return (files || []).map((f, index) => {
      // already normalized
      if (f && typeof f === "object" && "id" in f && "src" in f) {
        let id = String(f.id);
        if (used.has(id)) id = `${id}_${index}_${Date.now()}`;
        used.add(id);
        return { ...f, id };
      }

      // string url
      if (typeof f === "string") {
        let id = `url_${safeUrlId(f)}`;
        if (used.has(id)) id = `${id}_${index}_${Date.now()}`;
        used.add(id);
        return { id, src: f };
      }

      // File object
      if (f instanceof File) {
        const stamp = `${f.name}_${f.size}_${f.lastModified}`;
        let id = `file_${stamp}_${index}`;
        if (used.has(id)) id = `${id}_${Date.now()}_${Math.random()}`;
        used.add(id);
        return { id, src: f };
      }

      // unknown
      const id = `unk_${Date.now()}_${index}`;
      used.add(id);
      return { id, src: "" };
    });
  };

  /* ✅ FIX: normalize runs whenever variants changes */
  useEffect(() => {
    const needsNormalize = variants.some((v) =>
      (v.files || []).some(
        (f) =>
          typeof f === "string" ||
          f instanceof File ||
          (f && typeof f === "object" && !("src" in f))
      )
    );

    if (!needsNormalize) return;

    const next = variants.map((v) => ({
      ...v,
      files: toFileItems(v.files),
    }));

    setVariants(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variants]);

  // ✅ input update
  const update = (i, field, value) => {
    const next = [...variants];
    next[i] = { ...next[i], [field]: value };
    setVariants(next);

    let errKey;
    if (next[i].isBase) {
      if (field === "name") errKey = "baseName";
      if (field === "price") errKey = "basePrice";
    } else {
      const capitalizedField = field.charAt(0).toUpperCase() + field.slice(1);
      errKey = `variant${capitalizedField}_${i}`;
    }

    if (errKey && value?.toString().trim() !== "") {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errKey];
        return newErrors;
      });
    }
  };

  /* ✅ FIX: raw File add, normalization effect handles rest */
  const handleFileChange = (i, files) => {
    // ✅ NEW: disable save until preview/normalize settled
    onFilesReadyChange?.(false);

    const next = [...variants];

    next[i].files = [...(next[i].files || []), ...Array.from(files || [])];

    setVariants(next);

    const errKey = next[i].isBase ? "baseImages" : `variantImages_${i}`;
    if (errors[errKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errKey];
        return newErrors;
      });
    }

    // ✅ NEW: small delay so normalize + preview gets time
    setTimeout(() => {
      onFilesReadyChange?.(true);
    }, 200);
  };

  const removeFile = (vIdx, fileId) => {
    const next = [...variants];
    const normalized = toFileItems(next[vIdx].files);
    next[vIdx].files = normalized.filter((it) => it.id !== fileId);
    setVariants(next);
  };

  const handleDragEnd = (event, vIdx) => {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    const next = [...variants];
    const files = toFileItems(next[vIdx].files);

    const oldIndex = files.findIndex((x) => x.id === active.id);
    const newIndex = files.findIndex((x) => x.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    next[vIdx].files = arrayMove(files, oldIndex, newIndex);
    setVariants(next);
  };

  const visibleVariants = useMemo(() => {
    return mode === "default"
      ? variants.map((v, idx) => ({ v, idx })).filter(({ v }) => v.isBase)
      : variants.map((v, idx) => ({ v, idx })).filter(({ v }) => !v.isBase);
  }, [variants, mode]);

  return (
    <div className="space-y-6">
      {visibleVariants.map(({ v, idx: i }) => {
        const nameErr = v.isBase ? errors.baseName : errors[`variantName_${i}`];
        const priceErr = v.isBase
          ? errors.basePrice
          : errors[`variantPrice_${i}`];
        const imgErr = v.isBase
          ? errors.baseImages
          : errors[`variantImages_${i}`];

        const fileItems = toFileItems(v.files);

        return (
          <div
            key={i}
            className={`border rounded-2xl p-5 shadow-sm transition-all ${
              v.isBase
                ? "bg-indigo-50/20 border-indigo-100"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700">
                {v.isBase
                  ? "Default Settings (Main Product)"
                  : `Variant #${i + 1}`}
              </h3>

              {!v.isBase && (
                <button
                  type="button"
                  onClick={() =>
                    setVariants(variants.filter((_, idx) => idx !== i))
                  }
                  className="text-red-500 hover:bg-red-50 p-2 rounded-full transition"
                >
                  <FaTrash size={14} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Variant Name */}
              <div className="md:col-span-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                  Variant Name {v.isBase ? "" : "*"}
                </label>

                <input
                  value={
                    v.name === "Default Variant" && v.isBase
                      ? "Default Variant"
                      : v.name || ""
                  }
                  disabled={v.isBase}
                  onChange={(e) => update(i, "name", e.target.value)}
                  className={`${baseInput} ${
                    v.isBase ? disabledStyle : nameErr ? errClass : okClass
                  }`}
                  placeholder={v.isBase ? "" : "e.g. Red / XL"}
                />

                {nameErr && (
                  <p className="text-[10px] text-red-500 mt-1 font-semibold">
                    {nameErr}
                  </p>
                )}
              </div>

              {/* Price */}
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                  Price *
                </label>

                <input
                  type="number"
                  value={v.price ?? ""}
                  onChange={(e) => update(i, "price", e.target.value)}
                  className={`${baseInput} ${priceErr ? errClass : okClass}`}
                  placeholder="0.00"
                />

                {priceErr && (
                  <p className="text-[10px] text-red-500 mt-1 font-semibold">
                    {priceErr}
                  </p>
                )}
              </div>

              {/* Old Price */}
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                  Old Price
                </label>

                <input
                  type="number"
                  value={v.oldPrice ?? ""}
                  onChange={(e) => update(i, "oldPrice", e.target.value)}
                  className={`${baseInput} ${okClass}`}
                  placeholder="0.00"
                />
              </div>

              {/* Stock */}
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                  Stock
                </label>

                <input
                  type="number"
                  value={v.stock ?? 0}
                  onChange={(e) => update(i, "stock", e.target.value)}
                  className={`${baseInput} ${okClass}`}
                />
              </div>

              {/* Sold */}
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                  Sold
                </label>

                <input
                  type="number"
                  value={v.sold ?? 0}
                  onChange={(e) => update(i, "sold", e.target.value)}
                  className={`${baseInput} ${okClass}`}
                />
              </div>
            </div>

            {/* Images */}
            <div className="mt-5">
              <label
                className={`text-xs font-bold uppercase tracking-wide block mb-2 ${
                  imgErr ? "text-red-500" : "text-gray-600"
                }`}
              >
                Variant Images (Required) *
              </label>

              <div className="flex flex-wrap gap-3">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(e) => handleDragEnd(e, i)}
                >
                  <SortableContext
                    items={fileItems.map((it) => it.id)}
                    strategy={horizontalListSortingStrategy}
                  >
                    {fileItems.map((item) => (
                      <SortableImage
                        key={item.id}
                        item={item}
                        vIdx={i}
                        removeFile={removeFile}
                      />
                    ))}
                  </SortableContext>
                </DndContext>

                <button
                  type="button"
                  onClick={() => document.getElementById(`file-${i}`)?.click()}
                  className={`w-24 h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all ${
                    imgErr
                      ? "border-red-500 bg-red-50 text-red-500 shadow-inner"
                      : "border-gray-300 text-gray-400 hover:border-indigo-300 hover:text-indigo-400"
                  }`}
                >
                  <FaImages size={20} />
                  <span className="text-[10px] mt-1 font-bold">Upload</span>
                </button>
              </div>

              <input
                id={`file-${i}`}
                type="file"
                multiple
                hidden
                accept="image/*"
                onChange={(e) => handleFileChange(i, e.target.files)}
              />

              {imgErr && (
                <p className="text-[10px] text-red-500 mt-1 font-bold italic">
                  {imgErr}
                </p>
              )}
            </div>
          </div>
        );
      })}

      {mode === "variant" && (
        <button
          type="button"
          onClick={() =>
            setVariants([
              ...variants,
              {
                name: "",
                price: "",
                oldPrice: "",
                stock: 0,
                sold: 0,
                files: [],
                isBase: false,
              },
            ])
          }
          className="bg-purple-100 text-purple-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-purple-600 hover:text-white transition-all shadow-sm text-sm"
        >
          <FaPlus size={12} /> Add Another Variant
        </button>
      )}
    </div>
  );
}
