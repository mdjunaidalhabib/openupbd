"use client";

import { useEffect, useState } from "react";
import ProductForm from "../../../../components/ProductForm";
import ProductCard from "../../../../components/ProductCard";
import Toast from "../../../../components/Toast";
import ProductsSkeleton from "../../../../components/Skeleton/ProductsSkeleton";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [toast, setToast] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  // 🔹 Load Products
  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products`
      );
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setProducts([]);
      setToast({ message: "⚠ Failed to load products", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // 🔹 Delete confirm modal
  const confirmDelete = (product) => setDeleteModal(product);

  // 🔹 Handle delete
  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products/${deleteModal._id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setToast({ message: "🗑 Product deleted!", type: "success" });
        setDeleteModal(null);
        loadProducts();
      } else {
        setToast({ message: "❌ Error deleting product", type: "error" });
      }
    } catch {
      setToast({ message: "🌐 Network error", type: "error" });
    }
    setDeleting(false);
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
        <h1 className="text-2xl sm:text-3xl font-bold">✨ Product Manager</h1>
        <button
          onClick={() => {
            setEditProduct(null);
            setShowForm(true);
          }}
          disabled={saving}
          className={`px-4 py-2 rounded-lg text-white font-semibold shadow transition-all w-full sm:w-auto ${
            saving
              ? "bg-gray-400"
              : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:scale-105"
          }`}
        >
          {saving ? "Adding..." : "+ Add Product"}
        </button>
      </div>

      {/* Products Grid */}
      {loading ? (
        <ProductsSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {products.length > 0 ? (
            products.map((p) => (
              <ProductCard
                key={p._id}
                product={p}
                onEdit={() => {
                  setEditProduct(p);
                  setShowForm(true);
                }}
                onDelete={() => confirmDelete(p)}
              />
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500 py-10">
              No products found.
            </div>
          )}
        </div>
      )}

      {/* ===================== Add/Edit Modal (same system) ===================== */}
      {showForm && (
        <>
          {/* light overlay: background visible but locked */}
          <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-40" />

          {/* center modal */}
          <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-3xl sm:max-w-4xl p-4 sm:p-6 overflow-y-auto max-h-[90vh] relative animate-[zoomIn_.2s_ease-out]">
              <ProductForm
                product={editProduct}
                onClose={() => setShowForm(false)} // শুধু Cancel/Close button দিয়েই বন্ধ হবে
                onSaved={() => {
                  setShowForm(false);
                  loadProducts();
                  setToast({
                    message: editProduct
                      ? "✅ Product updated!"
                      : "✅ Product added!",
                    type: "success",
                  });
                }}
              />
            </div>
          </div>
        </>
      )}

      {/* ===================== Delete Modal (same system) ===================== */}
      {deleteModal && (
        <>
          {/* light overlay */}
          <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-40" />

          {/* center delete popup */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-sm sm:max-w-md shadow-xl border border-gray-200 animate-[zoomIn_.2s_ease-out]">
              <h2 className="text-xl font-bold mb-3 text-red-600">
                ⚠ Delete Product
              </h2>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-black">
                  {deleteModal.name}
                </span>
                ?
              </p>
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={() => setDeleteModal(null)}
                  disabled={deleting}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100 w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 w-full sm:w-auto"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* zoom animation */}
      <style jsx global>{`
        @keyframes zoomIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
