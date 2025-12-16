"use client";

export default function ConfirmModal({ data, onClose }) {
  if (!data) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow">
          <h2 className="text-lg font-bold mb-2">{data.title}</h2>

          {data.description && (
            <p className="text-sm text-gray-600 mb-5">{data.description}</p>
          )}

          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 border rounded">
              Cancel
            </button>

            <button
              onClick={data.onConfirm}
              className={`px-4 py-2 rounded text-white ${
                data.danger ? "bg-red-600" : "bg-blue-600"
              }`}
            >
              {data.confirmText || "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
