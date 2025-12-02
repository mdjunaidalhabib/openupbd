"use client";

import { useRef, useState, useEffect } from "react";

export default function AddSlideModal({
  showModal,
  closeModal,
  onSubmit,
  loading,
  editId = null,
  initialData = null,
  slidesLength = 0, // ✅ NEW
}) {
  const dropRef = useRef(null);

  const [title, setTitle] = useState("");
  const [href, setHref] = useState("");
  const [order, setOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");

  // ✅ dropdown limit
  const maxSerial = editId ? slidesLength : slidesLength + 1;

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setHref(initialData.href || "");
      setOrder(
        initialData.order && initialData.order <= slidesLength
          ? initialData.order
          : 1
      );
      setIsActive(initialData.isActive ?? true);
      setPreview(initialData.src || "");
      setFile(null);
    } else {
      // new slide default serial = last+1
      setOrder(slidesLength + 1);
    }
  }, [initialData, slidesLength]);

  if (!showModal) return null;

  const handleClose = () => {
    setTitle("");
    setHref("");
    setOrder(1);
    setIsActive(true);
    setFile(null);
    setPreview("");
    closeModal?.();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      setFile(dropped);
      setPreview(URL.createObjectURL(dropped));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const slideObj = {
      ...(initialData || {}),
      _id: editId || undefined,
      title,
      href,
      order,
      isActive,
      imageFile: file,
    };

    await onSubmit?.(slideObj);
  };

  return (
    <>
      <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-40" />

      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold mb-4 text-center">
            {editId ? "✏️ Edit Slide" : "➕ Add New Slide"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Slide Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Slide title"
                className="border w-full p-2 rounded"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Slide Link (Href)
              </label>
              <input
                value={href}
                onChange={(e) => setHref(e.target.value)}
                placeholder="Href (optional)"
                className="border w-full p-2 rounded"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* ✅ Serial dropdown fixed */}
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

            <div>
              <label className="block text-sm font-medium mb-2">
                Slide Image
              </label>

              <div
                ref={dropRef}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed h-32 rounded-lg flex flex-col items-center justify-center cursor-pointer"
                onClick={() =>
                  dropRef.current.querySelector("input[type=file]").click()
                }
              >
                {preview ? (
                  <img
                    src={preview}
                    className="h-24 w-24 rounded-full object-cover"
                    alt="preview"
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

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
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
