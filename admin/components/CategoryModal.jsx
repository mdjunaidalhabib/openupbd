"use client";

import { useRef, useEffect } from "react";

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

  // ✅ New modal open => last serial + active default
  useEffect(() => {
    if (show && !editId) {
      setOrder(categoriesLength + 1);
      setIsActive(true);
    }
  }, [show, editId, categoriesLength, setOrder, setIsActive]);

  if (!show) return null;

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      setFile(dropped);
      setPreview(URL.createObjectURL(dropped));
    }
  };

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
                Category Image
              </label>

              <div
                ref={dropRef}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed h-32 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer bg-gray-50"
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
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setFile(f);
                      setPreview(URL.createObjectURL(f));
                    }
                  }}
                />
              </div>
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
                className="px-4 py-2 bg-green-600 text-white rounded"
                disabled={loading}
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
