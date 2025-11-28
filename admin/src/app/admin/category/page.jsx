"use client";

import { useEffect, useState, useRef } from "react";
import Toast from "../../../../components/Toast";
import CategoriesSkeleton from "../../../../components/Skeleton/CategoriesSkeleton";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const dropRef = useRef(null);

  // Load Categories
  const loadCategories = async () => {
    try {
      setPageLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/categories`
      );
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setToast({ message: "⚠ Failed to load categories", type: "error" });
    } finally {
      setPageLoading(false);
    }
  };

  // ✅ React19 safe useEffect (NO Promise return)
  useEffect(() => {
    const init = async () => {
      await loadCategories();
    };
    init();
  }, []);

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setName("");
    setFile(null);
    setPreview("");
    setLoading(false);
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    data.append("name", name);
    if (file) data.append("image", file);

    let url = `${process.env.NEXT_PUBLIC_API_URL}/api/categories`;
    let method = "POST";

    if (editId) {
      url += `/${editId}`;
      method = "PUT";
    }

    const res = await fetch(url, { method, body: data });

    if (res.ok) {
      setToast({
        message: editId ? "✅ Category updated!" : "✅ Category added!",
        type: "success",
      });
      closeModal();
      loadCategories();
    } else {
      setToast({ message: "❌ Error saving category", type: "error" });
    }

    setLoading(false);
  };

  const handleEdit = (c) => {
    setEditId(c._id);
    setName(c.name);
    setPreview(c.image);
    setShowModal(true);
  };

  const confirmDelete = (c) => setDeleteModal(c);

  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/categories/${deleteModal._id}`,
      { method: "DELETE" }
    );

    if (res.ok) {
      setToast({ message: "🗑 Category deleted!", type: "success" });
      setDeleteModal(null);
      loadCategories();
    } else {
      setToast({ message: "❌ Error deleting category", type: "error" });
    }
    setDeleting(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      setFile(dropped);
      setPreview(URL.createObjectURL(dropped));
    }
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📂 Categories</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow"
        >
          + Add Category
        </button>
      </div>

      {/* Category Grid */}
      {pageLoading ? (
        <CategoriesSkeleton />
      ) : categories.length === 0 ? (
        <div className="text-center text-gray-500 py-10">
          No categories found.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((c) => (
            <div
              key={c._id}
              className="border border-gray-200 bg-white rounded-xl p-4 shadow-sm flex flex-col items-center"
            >
              {c.image && (
                <img
                  className="h-24 w-24 rounded-full object-cover mb-2"
                  src={c.image}
                  alt={c.name}
                />
              )}
              <h2 className="font-semibold">{c.name}</h2>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleEdit(c)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => confirmDelete(c)}
                  className="bg-red-600 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDIT/ADD MODAL */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-40" />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-bold mb-4 text-center">
                {editId ? "✏️ Edit Category" : "➕ Add Category"}
              </h2>

              <form onSubmit={handleSubmit}>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Category name"
                  className="border w-full p-2 rounded mb-3"
                  required
                />

                <div
                  ref={dropRef}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="border-2 border-dashed h-32 rounded-lg flex flex-col items-center justify-center cursor-pointer"
                  onClick={() => dropRef.current.querySelector("input").click()}
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
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files[0];
                      if (f) {
                        setFile(f);
                        setPreview(URL.createObjectURL(f));
                      }
                    }}
                  />
                </div>

                <div className="flex justify-end gap-3 mt-5">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border rounded"
                  >
                    Cancel
                  </button>
                  <button className="px-4 py-2 bg-green-600 text-white rounded">
                    {loading ? "Saving..." : editId ? "Update" : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* DELETE POPUP */}
      {deleteModal && (
        <>
          <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-40" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl border">
              <h2 className="text-xl font-bold text-red-600 mb-3">
                ⚠ Delete Category
              </h2>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete{" "}
                <span className="font-semibold">{deleteModal.name}</span>?
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteModal(null)}
                  className="px-4 py-2 border rounded"
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
