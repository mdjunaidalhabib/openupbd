"use client";
import { useState } from "react";
import Toast from "../Toast";

export default function EditOrderModal({
  open,
  form,
  setForm,
  onSave,
  onClose,
}) {
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const [touched, setTouched] = useState({
    name: false,
    phone: false,
    address: false,
    cancelReason: false,
  });
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  const showToast = (message, type = "error", ms = 2000) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), ms);
  };

  const handleBillingChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      billing: { ...prev.billing, [field]: value },
    }));
  };

  const phoneValid = /^(01[3-9]\d{8})$/.test(form?.billing?.phone || "");
  const isCancelled = form.status === "cancelled";

  const errors = {
    name: !form?.billing?.name?.trim(),
    phone: !form?.billing?.phone?.trim() || !phoneValid,
    address: !form?.billing?.address?.trim(),
    cancelReason: isCancelled && !form?.cancelReason?.trim(),
  };

  const fieldClass = (hasError) =>
    `border rounded px-3 py-2 w-full outline-none transition
     ${
       hasError
         ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-200"
         : "border-gray-300 focus:ring-2 focus:ring-green-200"
     }`;

  const labelClass = (hasError) =>
    `block text-sm font-medium mb-1 ${hasError ? "text-red-600" : ""}`;

  const handleSave = async () => {
    setSubmitted(true);

    if (errors.name || errors.phone || errors.address || errors.cancelReason) {
      showToast("⚠️ সব প্রয়োজনীয় তথ্য ঠিকমতো দিন!", "error", 2500);
      return;
    }

    setLoading(true);
    try {
      const result = await onSave(form); // parent handles API + merge

      if (result) {
        onClose();
        showToast("✅ Order updated successfully!", "success", 1500);
      } else {
        showToast("❌ Failed to update order!", "error", 2000);
      }
    } catch (err) {
      console.error(err);
      showToast("❌ Something went wrong while saving!", "error", 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />

      <div className="fixed inset-0 flex justify-center items-center z-50 p-4">
        <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow">
          <h2 className="text-xl font-bold text-blue-600 mb-3">
            ✏️ Edit Order
          </h2>

          <div className="space-y-3 mb-6">
            {/* Payment */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Payment Method
              </label>
              <select
                className="border rounded px-3 py-2 w-full"
                value={form.paymentMethod}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    paymentMethod: e.target.value,
                  }))
                }
              >
                <option value="cod">COD</option>
                <option value="bkash">bKash</option>
              </select>
            </div>

            {/* Tracking */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Tracking ID
              </label>
              <input
                className="border rounded px-3 py-2 w-full"
                value={form.trackingId || ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, trackingId: e.target.value }))
                }
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                className="border rounded px-3 py-2 w-full"
                value={form.status}
                onChange={(e) => {
                  const nextStatus = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    status: nextStatus,
                    // ✅ not cancelled হলে reason ক্লিয়ার
                    cancelReason:
                      nextStatus === "cancelled" ? prev.cancelReason : "",
                  }));
                }}
              >
                <option value="pending">Pending</option>
                <option value="ready_to_delivery">Ready to delivery</option>
                <option value="send_to_courier">Send to courier</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Cancel Reason */}
            {isCancelled && (
              <div>
                <label
                  className={labelClass(
                    (submitted || touched.cancelReason) && errors.cancelReason
                  )}
                >
                  Cancel Reason *
                </label>
                <input
                  className={fieldClass(
                    (submitted || touched.cancelReason) && errors.cancelReason
                  )}
                  value={form.cancelReason || ""}
                  onBlur={() =>
                    setTouched((t) => ({ ...t, cancelReason: true }))
                  }
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      cancelReason: e.target.value,
                    }))
                  }
                  placeholder="Reason for cancellation"
                />
                {(submitted || touched.cancelReason) && errors.cancelReason && (
                  <p className="text-xs text-red-600 mt-1">
                    Cancel reason আবশ্যক
                  </p>
                )}
              </div>
            )}

            {/* Billing */}
            <div className="border rounded p-3">
              <p className="font-semibold text-sm mb-2">Customer</p>

              {/* Name */}
              <div className="mb-2">
                <label
                  className={labelClass(
                    (submitted || touched.name) && errors.name
                  )}
                >
                  Name *
                </label>
                <input
                  className={fieldClass(
                    (submitted || touched.name) && errors.name
                  )}
                  value={form.billing.name}
                  onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                  onChange={(e) => handleBillingChange("name", e.target.value)}
                />
              </div>

              {/* Phone */}
              <div className="mb-2">
                <label
                  className={labelClass(
                    (submitted || touched.phone) && errors.phone
                  )}
                >
                  Phone *
                </label>
                <input
                  className={fieldClass(
                    (submitted || touched.phone) && errors.phone
                  )}
                  value={form.billing.phone}
                  onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                  onChange={(e) => handleBillingChange("phone", e.target.value)}
                />
                {(submitted || touched.phone) && errors.phone && (
                  <p className="text-xs text-red-600 mt-1">
                    01 দিয়ে শুরু হওয়া 11 ডিজিট নাম্বার দিন
                  </p>
                )}
              </div>

              {/* Address */}
              <div>
                <label
                  className={labelClass(
                    (submitted || touched.address) && errors.address
                  )}
                >
                  Address *
                </label>
                <input
                  className={fieldClass(
                    (submitted || touched.address) && errors.address
                  )}
                  value={form.billing.address}
                  onBlur={() => setTouched((t) => ({ ...t, address: true }))}
                  onChange={(e) =>
                    handleBillingChange("address", e.target.value)
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
