"use client";

export default function CourierModal({ order, sending, onCancel, onConfirm }) {
  if (!order) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow">
          <h2 className="text-xl font-bold text-blue-600 mb-3">
            🚚 Send to Courier
          </h2>

          <p className="mb-4">
            Send order <strong>{order._id}</strong>?
          </p>

          <div className="flex justify-end gap-3">
            <button onClick={onCancel} className="px-4 py-2 border rounded">
              Cancel
            </button>

            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-blue-600 text-white rounded"
              disabled={sending}
            >
              {sending ? "Sending..." : "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
