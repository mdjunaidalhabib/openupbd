"use client";
import { useMemo, useState } from "react";
import Badge from "./Badge";

const STATUS_OPTIONS = [
  "pending",
  "ready_to_delivery",
  "send_to_courier",
  "delivered",
  "cancelled",
];

const STATUS_LABEL = {
  pending: "PENDING",
  ready_to_delivery: "READY TO DELIVERY",
  send_to_courier: "SEND TO COURIER",
  delivered: "DELIVERED",
  cancelled: "CANCELLED",
};

const STATUS_TEXT_COLOR = {
  pending: "text-yellow-600",
  ready_to_delivery: "text-blue-600",
  send_to_courier: "text-purple-600",
  delivered: "text-green-600",
  cancelled: "text-red-600",
};

const STATUS_BADGE_COLOR = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  ready_to_delivery: "bg-blue-100 text-blue-700 border-blue-200",
  send_to_courier: "bg-purple-100 text-purple-700 border-purple-200",
  delivered: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

export default function OrdersTable({
  orders,
  onEdit,
  onDelete,
  onStatusChange,
  onSendCourier,
  sendingId,
}) {
  const [updatingId, setUpdatingId] = useState(null);

  const [tabStatus, setTabStatus] = useState("");
  const [q, setQ] = useState("");

  const filteredOrders = useMemo(() => {
    let list = Array.isArray(orders) ? orders : [];

    if (tabStatus) list = list.filter((o) => o.status === tabStatus);

    if (q.trim()) {
      const qq = q.trim().toLowerCase();
      list = list.filter((o) => {
        return (
          o._id?.toLowerCase().includes(qq) ||
          o.billing?.name?.toLowerCase().includes(qq) ||
          o.billing?.phone?.toLowerCase().includes(qq)
        );
      });
    }

    return list;
  }, [orders, tabStatus, q]);

  const handleChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      // ✅ NEW SIGNATURE: onStatusChange(id, payload)
      await onStatusChange(id, { status: newStatus });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="hidden md:block space-y-3">
      {/* FILTER BAR */}
      <div className="bg-white rounded-lg border shadow-sm p-3 space-y-3">
        <input
          className="border rounded px-3 py-2 w-full"
          placeholder="Search by OrderID / Name / Phone"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => setTabStatus("")}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition ${
              tabStatus === ""
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            All
          </button>

          {STATUS_OPTIONS.map((s) => {
            const active = tabStatus === s;
            return (
              <button
                key={s}
                onClick={() => setTabStatus(s)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition ${
                  active
                    ? "bg-blue-600 text-white border-blue-600"
                    : `bg-white hover:bg-gray-50 ${
                        STATUS_TEXT_COLOR[s] || "text-gray-700"
                      }`
                }`}
              >
                {STATUS_LABEL[s]}
              </button>
            );
          })}

          <div className="ml-auto text-xs text-gray-500">
            Showing:{" "}
            <span className="font-semibold">{filteredOrders.length}</span>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto bg-white rounded-lg border shadow-sm">
        {!filteredOrders.length ? (
          <div className="p-6 text-center text-gray-500">No orders found.</div>
        ) : (
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
              {filteredOrders.map((o) => {
                const locked =
                  o.status === "delivered" || o.status === "cancelled";
                const canSendCourier =
                  o.status === "ready_to_delivery" && !o.trackingId;

                return (
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

                    {/* Customer */}
                    <td className="p-3 align-top">
                      <div className="font-semibold">{o.billing?.name}</div>
                      <div className="text-gray-600">{o.billing?.phone}</div>
                      <div className="text-xs text-gray-500">
                        {o.billing?.address}
                      </div>
                    </td>

                    {/* Items */}
                    <td className="p-3 align-top w-[340px]">
                      <div className="space-y-2">
                        {o.items?.map((it, idx) => (
                          <div
                            key={idx}
                            className="group flex items-center justify-between gap-3 rounded-xl border bg-white p-2 hover:shadow-sm transition"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={it.image || "/placeholder.png"}
                                alt={it.name}
                                className="w-10 h-10 rounded-lg object-cover border"
                                loading="lazy"
                              />
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate">
                                  {it.name}
                                </p>
                                <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                  <span>Qty: {it.qty}</span>
                                  <span className="h-1 w-1 rounded-full bg-gray-300" />
                                  <span>৳{it.price} each</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
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
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full border ${
                            STATUS_BADGE_COLOR[o.status] ||
                            "bg-gray-100 text-gray-700 border-gray-200"
                          }`}
                        >
                          {STATUS_LABEL[o.status] || o.status}
                        </span>

                        <select
                          className={`border rounded px-2 py-1 text-sm ${
                            STATUS_TEXT_COLOR[o.status] || "text-gray-700"
                          }`}
                          value={o.status}
                          onChange={(e) => handleChange(o._id, e.target.value)}
                          disabled={updatingId === o._id || locked}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABEL[s]}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Cancel Reason */}
                      {o.status === "cancelled" && o.cancelReason && (
                        <div className="text-xs text-red-600 mt-1">
                          <span className="font-medium">Reason:</span>{" "}
                          <span className="text-red-700">{o.cancelReason}</span>
                        </div>
                      )}

                      {/* Tracking */}
                      {o.trackingId && (
                        <div className="text-xs text-gray-700 mt-1">
                          <span className="font-medium">Tracking:</span>{" "}
                          <span className="text-indigo-600">
                            {o.trackingId}
                          </span>
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
                          onClick={() => onDelete(o)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Delete
                        </button>

                        <button
                          onClick={() => onSendCourier(o)}
                          disabled={
                            (sendingId && sendingId === o._id) ||
                            !canSendCourier
                          }
                          className={`text-white px-3 py-1 rounded text-sm ${
                            (sendingId && sendingId === o._id) ||
                            !canSendCourier
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-700"
                          }`}
                        >
                          {sendingId && sendingId === o._id
                            ? "Sending..."
                            : !canSendCourier
                            ? o.trackingId
                              ? "Already Sent"
                              : "Not Ready"
                            : "Send to Courier"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
