"use client";
import { useState } from "react";

export default function OrdersGrid({
  orders,
  onEdit,
  onDelete,
  onStatusChange,
  onSendCourier, // ✅ Dynamic courier handler
  sendingId,
}) {
  const [updatingId, setUpdatingId] = useState(null);

  if (!orders.length)
    return (
      <div className="p-6 text-center text-gray-500">No orders found.</div>
    );

  const handleChange = async (id, newStatus) => {
    setUpdatingId(id);
    await onStatusChange(id, newStatus);
    setUpdatingId(null);
  };

  return (
    <div className="grid gap-3 md:hidden">
      {orders.map((o) => (
        <div key={o._id} className="border rounded-lg p-3 bg-white shadow-sm">
          {/* Header */}
          <div className="flex justify-between items-start flex-wrap gap-2">
            <div className="font-mono text-xs text-gray-500 break-all">
              #{o._id}
            </div>
            <div>
              <select
                className={`border rounded px-2 py-1 text-sm ${
                  o.status === "pending"
                    ? "text-yellow-600"
                    : o.status === "confirmed"
                    ? "text-blue-600"
                    : o.status === "processing"
                    ? "text-indigo-600"
                    : o.status === "shipped"
                    ? "text-purple-600"
                    : o.status === "delivered"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
                value={o.status}
                onChange={(e) => handleChange(o._id, e.target.value)}
                disabled={updatingId === o._id}
              >
                {[
                  "pending",
                  "confirmed",
                  "processing",
                  "shipped",
                  "delivered",
                  "cancelled",
                ].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Customer Info */}
          <div className="mt-2 text-sm space-y-0.5">
            <div className="font-semibold">{o.billing?.name}</div>
            <div className="text-gray-600">{o.billing?.phone}</div>
            <div className="text-gray-600">{o.billing?.address}</div>
            {o.courier && (
              <div className="text-xs text-green-600">Courier: {o.courier}</div>
            )}
          </div>

          {/* Items */}
          <div className="mt-2 text-sm">
            <div className="font-medium">Items</div>
            <ul className="list-disc ml-5">
              {o.items?.map((it, idx) => (
                <li key={idx}>
                  {it.name} × {it.qty} — ৳{it.price}
                </li>
              ))}
            </ul>
          </div>

          {/* Totals */}
          <div className="mt-2 text-sm space-y-0.5">
            <div>Subtotal: ৳{o.subtotal}</div>
            <div>Delivery: ৳{o.deliveryCharge}</div>
            {!!o.discount && <div>Discount: -৳{o.discount}</div>}
            <div className="font-semibold">Total: ৳{o.total}</div>
            <div className="text-xs text-gray-600 mt-1">
              Method: {o.paymentMethod?.toUpperCase()}
            </div>
          </div>

          {/* Tracking / Status */}
          {(o.trackingId || o.status) && (
            <div className="mt-3 border-t pt-2 text-sm">
              {o.trackingId && (
                <div>
                  <span className="font-medium">Tracking ID:</span>{" "}
                  <span className="text-indigo-600">{o.trackingId}</span>
                </div>
              )}
              {o.status && (
                <div>
                  <span className="font-medium">Status:</span>{" "}
                  <span className="text-blue-600 uppercase">{o.status}</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 flex gap-2 flex-wrap">
            <button
              onClick={() => onEdit(o)}
              className="bg-yellow-500 text-white px-3 py-1 rounded text-sm"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(o)}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm"
            >
              Delete
            </button>

            {/* ✅ Send to Courier */}
            <button
              onClick={() => onSendCourier(o)}
              disabled={sendingId === o._id || o.trackingId}
              className={`${
                sendingId === o._id || o.trackingId
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              } text-white px-3 py-1 rounded text-sm`}
            >
              {sendingId === o._id
                ? "Sending..."
                : o.trackingId
                ? "Already Sent"
                : "Send to Courier"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
