"use client";

import { useRef, useEffect, useState } from "react";

/* ================== ✅ RULE (Dynamic) ================== */
const CATEGORY_IMAGE_RULE = {
  type: "image/webp",
  width: 300,
  height: 300,
  maxBytes: 100 * 1024, // ✅ 100KB
  quality: 0.75,
};

/* ================== ✅ RESIZE HELPER (Dynamic WEBP) ================== */
async function resizeToWebP(
  file,
  size = CATEGORY_IMAGE_RULE.width,
  quality = CATEGORY_IMAGE_RULE.quality
) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;
    };

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext("2d");

      // ✅ Cover crop (square fill)
      const scale = Math.max(size / img.width, size / img.height);
      const x = (size - img.width * scale) / 2;
      const y = (size - img.height * scale) / 2;

      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject("Blob creation failed");

          const newFile = new File(
            [blob],
            file.name.replace(/\.\w+$/, ".webp"),
            { type: "image/webp" }
          );

          resolve(newFile);
        },
        "image/webp",
        quality
      );
    };

    img.onerror = reject;
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

export default function CategoryModal({
  show,
  editId,
  categoriesLength = 0,

  name,
  setName,

  order,
  setOrder,

  isActive,
  setIsActive,

  file,
  setFile,

  preview,
  setPreview,

  loading,
  onClose,
  onSubmit,
}) {
  const dropRef = useRef(null);

  // ✅ dropdown limit like slider
  const maxSerial = editId ? categoriesLength : categoriesLength + 1;

  // ✅ image state
  const [imageError, setImageError] = useState("");
  const [filesReady, setFilesReady] = useState(true);

  const getImageSize = (file) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
        URL.revokeObjectURL(url);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Invalid image"));
      };

      img.src = url;
    });

  const validateCategoryImage = async (f) => {
    if (!f) return "Please select an image";

    const maxKB = Math.floor(CATEGORY_IMAGE_RULE.maxBytes / 1024);

    // ✅ format must be webp
    if (f.type !== CATEGORY_IMAGE_RULE.type) {
      return `Only WEBP allowed (${CATEGORY_IMAGE_RULE.width}×${CATEGORY_IMAGE_RULE.height}, max ${maxKB}KB)`;
    }

    // ✅ size
    if (f.size > CATEGORY_IMAGE_RULE.maxBytes) {
      return `Max ${maxKB}KB allowed (Your file: ${Math.ceil(
        f.size / 1024
      )}KB)`;
    }

    // ✅ dimension
    const { width, height } = await getImageSize(f);
    if (
      width !== CATEGORY_IMAGE_RULE.width ||
      height !== CATEGORY_IMAGE_RULE.height
    ) {
      return `Must be ${CATEGORY_IMAGE_RULE.width}×${CATEGORY_IMAGE_RULE.height} (Your image: ${width}×${height})`;
    }

    return "";
  };

  // ✅ New modal open => last serial + active default
  useEffect(() => {
    if (show && !editId) {
      setOrder(categoriesLength + 1);
      setIsActive(true);
    }
  }, [show, editId, categoriesLength, setOrder, setIsActive]);

  // ✅ Reset image states on open/close
  useEffect(() => {
    if (!show) {
      setImageError("");
      setFilesReady(true);
      return;
    }
    setImageError("");
    setFilesReady(true);
  }, [show]);

  if (!show) return null;

  /* ================== ✅ MAIN FILE PROCESSOR ================== */
  const processFile = async (incomingFile) => {
    if (!incomingFile) return;

    setFilesReady(false);
    setImageError("");

    try {
      // ✅ Convert ANY image -> RULE size WEBP (Dynamic)
      const resized = await resizeToWebP(
        incomingFile,
        CATEGORY_IMAGE_RULE.width,
        CATEGORY_IMAGE_RULE.quality
      );

      // ✅ Validate resized
      const err = await validateCategoryImage(resized);
      if (err) {
        setImageError(err);
        setFile(null);
        setPreview("");
        setFilesReady(true);
        return;
      }

      setFile(resized);
      setPreview(URL.createObjectURL(resized));
      setFilesReady(true);
    } catch (e) {
      console.error(e);
      setImageError("Invalid image file");
      setFile(null);
      setPreview("");
      setFilesReady(true);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;

    processFile(dropped);
  };

  const maxKB = Math.floor(CATEGORY_IMAGE_RULE.maxBytes / 1024);

  return (
    <>
      <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-40" />

      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold mb-4 text-center">
            {editId ? "✏️ Edit Category" : "➕ Add Category"}
          </h2>

          <form onSubmit={onSubmit} className="space-y-3">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Category Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Category name"
                className="border w-full p-2 rounded"
                required
              />
            </div>

            {/* ✅ Serial + Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Serial No
                </label>
                <select
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                  className="border w-full p-2 rounded bg-white"
                >
                  {Array.from({ length: maxSerial }, (_, i) => i + 1).map(
                    (num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={isActive ? "active" : "hidden"}
                  onChange={(e) => setIsActive(e.target.value === "active")}
                  className="border w-full p-2 rounded bg-white"
                >
                  <option value="active">Active</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
            </div>

            {/* Image uploader */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Category Image{" "}
                <span className="text-[11px] text-gray-500 font-semibold">
                  (WEBP, {CATEGORY_IMAGE_RULE.width}×
                  {CATEGORY_IMAGE_RULE.height}, max {maxKB}KB)
                </span>
              </label>

              <div
                ref={dropRef}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className={`border-2 border-dashed h-32 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer bg-gray-50 ${
                  imageError ? "border-red-500 bg-red-50" : "border-gray-300"
                }`}
                onClick={() =>
                  dropRef.current?.querySelector("input[type=file]")?.click()
                }
              >
                {preview ? (
                  <img
                    src={preview}
                    alt="preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-gray-500">
                    Drag & drop or click to upload
                  </span>
                )}

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    e.target.value = ""; // ✅ same file reselect
                    if (!f) return;

                    processFile(f);
                  }}
                />
              </div>

              {imageError && (
                <p className="text-[11px] text-red-600 mt-1 font-semibold">
                  {imageError}
                </p>
              )}

              {!filesReady && (
                <p className="text-[11px] text-orange-600 mt-1 font-semibold">
                  Processing image...
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded"
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                className={`px-4 py-2 rounded text-white ${
                  loading || !filesReady || !!imageError
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
                disabled={loading || !filesReady || !!imageError}
              >
                {loading ? "Saving..." : editId ? "Update" : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
