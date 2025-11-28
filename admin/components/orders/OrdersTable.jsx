"use client";
import { useState } from "react";
import Badge from "./Badge";

export default function OrdersTable({
  orders,
  onEdit,
  onDelete,
  onStatusChange,
  onSendCourier, // ✅ dynamic courier function
  sendingId,
}) {
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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
    <div className="hidden md:block overflow-x-auto bg-white rounded-lg border shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="text-left p-3">Order</th>
            <th className="text-left p-3">Customer</th>
            <th className="text-left p-3">Items</th>
            <th className="text-left p-3">Totals</th>
            <th className="text-left p-3">Payment</th>
            <th className="text-left p-3">Status</th>
            <th className="text-left p-3">Actions</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((o) => (
            <tr key={o._id} className="border-t hover:bg-gray-50">
              {/* Order Info */}
              <td className="p-3 align-top">
                <div className="font-mono text-xs text-gray-500 break-all">
                  #{o._id}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(o.createdAt).toLocaleString()}
                </div>
                {o.courier && (
                  <div className="text-xs text-green-600">
                    Courier: {o.courier}
                  </div>
                )}
              </td>

              {/* Customer Info */}
              <td className="p-3 align-top">
                <div className="font-semibold">{o.billing?.name}</div>
                <div className="text-gray-600">{o.billing?.phone}</div>
                <div className="text-xs text-gray-500">
                  {o.billing?.address}
                </div>
              </td>

              {/* Items */}
              <td className="p-3 align-top">
                <ul className="list-disc ml-5">
                  {o.items?.map((it, idx) => (
                    <li key={idx}>
                      {it.name} × {it.qty} — ৳{it.price}
                    </li>
                  ))}
                </ul>
              </td>

              {/* Totals */}
              <td className="p-3 align-top">
                <div>Subtotal: ৳{o.subtotal}</div>
                <div>Delivery: ৳{o.deliveryCharge}</div>
                {!!o.discount && <div>Discount: -৳{o.discount}</div>}
                <div className="font-semibold">Total: ৳{o.total}</div>
              </td>

              {/* Payment */}
              <td className="p-3 align-top">
                <Badge>{o.paymentMethod?.toUpperCase()}</Badge>
              </td>

              {/* Status */}
              <td className="p-3 align-top">
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

                {/* Tracking ID */}
                {o.trackingId && (
                  <div className="text-xs text-gray-700 mt-1">
                    <span className="font-medium">Tracking:</span>{" "}
                    <span className="text-indigo-600">{o.trackingId}</span>
                  </div>
                )}

                {/* Current Status Text */}
                {o.status && (
                  <div className="text-xs text-blue-600 mt-1">
                    <span className="font-medium">Status:</span>{" "}
                    {o.status.toUpperCase()}
                  </div>
                )}
              </td>

              {/* Actions */}
              <td className="p-3 align-top">
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => onEdit(o)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded text-sm"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => onDelete(o._id)}
                    disabled={deletingId === o._id}
                    className={`${
                      deletingId === o._id
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700"
                    } text-white px-3 py-1 rounded text-sm`}
                  >
                    {deletingId === o._id ? "Deleting..." : "Delete"}
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
