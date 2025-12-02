"use client";
import { useState } from "react";
import Toast from "../Toast"; // 🔹 path ঠিক রাখো

export default function EditOrderModal({
  open,
  form,
  setForm,
  onSave,
  onClose,
}) {
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  // 🧩 Billing details পরিবর্তন
  const handleBillingChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      billing: { ...prev.billing, [field]: value },
    }));
  };

  // 🧩 Save ফাংশন
  const handleSave = async () => {
    setLoading(true);
    try {
      const result = await onSave?.(form); // ✅ এখন form পাঠানো হচ্ছে
      if (result?.success !== false) {
        setToast({
          message: "✅ Order updated successfully!",
          type: "success",
        });
      } else {
        setToast({ message: "❌ Failed to update order!", type: "error" });
      }
    } catch (error) {
      console.error("Update error:", error);
      setToast({
        message: "❌ Something went wrong while saving!",
        type: "error",
      });
    } finally {
      setLoading(false);
      setTimeout(() => {
        setToast(null);
        onClose();
      }, 2200);
    }
  };

  return (
    <>
      {/* 🔹 Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* 🔹 Modal Overlay */}
      <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50 px-4">
        <div className="bg-white rounded-lg w-full max-w-md p-6 space-y-6 shadow-xl transition-all">
          <h3 className="text-xl font-bold text-gray-800 text-center">
            Edit Order
          </h3>

          {/* 🔹 Order Details */}
          <div className="flex flex-col gap-3">
            <div>
              <label className="block font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                className="border rounded px-3 py-2 w-full"
                value={form.paymentMethod}
                onChange={(e) =>
                  setForm({ ...form, paymentMethod: e.target.value })
                }
              >
                {["cod", "bkash"].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">
                Tracking ID
              </label>
              <input
                type="text"
                className="border rounded px-3 py-2 w-full"
                value={form.trackingId}
                onChange={(e) =>
                  setForm({ ...form, trackingId: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">
                Cancel Reason
              </label>
              <input
                type="text"
                className="border rounded px-3 py-2 w-full"
                value={form.cancelReason}
                onChange={(e) =>
                  setForm({ ...form, cancelReason: e.target.value })
                }
              />
            </div>
          </div>

          {/* 🔹 Customer Details */}
          <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
            <h4 className="font-semibold text-gray-800 text-lg">
              Customer Details
            </h4>
            <div className="flex flex-col gap-2">
              <div>
                <label className="block text-gray-600 text-sm">Name</label>
                <input
                  type="text"
                  className="border rounded px-3 py-2 w-full"
                  value={form.billing.name}
                  onChange={(e) => handleBillingChange("name", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-gray-600 text-sm">Phone</label>
                <input
                  type="text"
                  className="border rounded px-3 py-2 w-full"
                  value={form.billing.phone}
                  onChange={(e) => handleBillingChange("phone", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-gray-600 text-sm">Address</label>
                <input
                  type="text"
                  className="border rounded px-3 py-2 w-full"
                  value={form.billing.address}
                  onChange={(e) =>
                    handleBillingChange("address", e.target.value)
                  }
                />
              </div>
            </div>
          </div>

          {/* 🔹 Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 transition"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className={`${
                loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              } text-white px-4 py-2 rounded transition`}
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
