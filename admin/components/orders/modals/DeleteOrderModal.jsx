"use client";

export default function DeleteOrderModal({
  order,
  deleting,
  onCancel,
  onConfirm,
}) {
  if (!order) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow">
          <h2 className="text-xl font-bold text-red-600 mb-3">
            ⚠ Delete Order
          </h2>

          <p className="mb-6">
            Delete order <strong>{order._id}</strong>?
          </p>

          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 border rounded"
              disabled={deleting}
            >
              Cancel
            </button>

            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded"
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
