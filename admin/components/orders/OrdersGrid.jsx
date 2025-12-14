"use client";
import { useState } from "react";
import { Edit3, Trash2, Send, ChevronDown, ChevronUp } from "lucide-react";

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

const STATUS_COLORS = {
  pending: "text-yellow-700 bg-yellow-50 ring-yellow-200",
  ready_to_delivery: "text-blue-700 bg-blue-50 ring-blue-200",
  send_to_courier: "text-purple-700 bg-purple-50 ring-purple-200",
  delivered: "text-green-700 bg-green-50 ring-green-200",
  cancelled: "text-red-700 bg-red-50 ring-red-200",
};

function formatOrderTime(o) {
  const raw = o?.createdAt || o?.orderDate || o?.date;
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function OrdersGrid({
  orders,
  onEdit,
  onDelete,
  onStatusChange,
  onSendCourier,
  sendingId,
}) {
  const [updatingId, setUpdatingId] = useState(null);
  const [openId, setOpenId] = useState(null);

  const handleChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      // ✅ NEW SIGNATURE: onStatusChange(id, payload)
      await onStatusChange(id, { status: newStatus });
    } finally {
      setUpdatingId(null);
    }
  };

  if (!orders?.length) {
    return (
      <div className="p-6 text-center text-gray-500 md:hidden">
        No orders found.
      </div>
    );
  }

  return (
    <div className="md:hidden rounded-xl border bg-white divide-y shadow-sm overflow-hidden">
      {orders.map((o) => {
        const expanded = openId === o._id;
        const isUpdating = updatingId === o._id;

        const locked = o.status === "delivered" || o.status === "cancelled";

        const isSending = sendingId === o._id;
        const canSendCourier =
          o.status === "ready_to_delivery" && !o.trackingId;

        const itemCount =
          o.items?.reduce((sum, it) => sum + (it.qty || 0), 0) || 0;

        const firstTwo = o.items?.slice(0, 2) || [];
        const moreCount = (o.items?.length || 0) - firstTwo.length;

        return (
          <div key={o._id} className="px-3 py-2">
            {/* ===== Compact Header ===== */}
            <button
              type="button"
              onClick={() => setOpenId(expanded ? null : o._id)}
              className="w-full flex items-center gap-2 text-left"
            >
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${
                  STATUS_COLORS[o.status] ||
                  "text-gray-700 bg-gray-50 ring-gray-200"
                }`}
              >
                {STATUS_LABEL[o.status] || o.status?.toUpperCase()}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="truncate text-xs font-semibold text-gray-900">
                    {o.billing?.name || "Unknown"}
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono">
                    #{o._id}
                  </div>
                </div>

                <div className="mt-0.5 flex gap-2 text-[11px] text-gray-600 truncate">
                  <span>{formatOrderTime(o)}</span>
                  <span>{itemCount} items</span>
                  {o.paymentMethod && (
                    <span className="uppercase text-[10px]">
                      {o.paymentMethod}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-extrabold">৳{o.total}</div>
                <div className="text-[10px] text-gray-400">
                  {expanded ? "close" : "open"}
                </div>
              </div>

              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {/* ===== Expanded ===== */}
            {expanded && (
              <div className="mt-2 space-y-3 text-xs text-gray-700">
                {/* Customer + Items */}
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-5 rounded-md bg-gray-50 p-2 space-y-1">
                    <div className="text-[11px] font-bold">Customer</div>
                    <div className="font-semibold">
                      {o.billing?.name || "Unknown"}
                    </div>
                    <div className="text-[11px]">
                      {o.billing?.phone || "No phone"}
                    </div>
                    <div className="text-[11px] text-gray-600 line-clamp-2">
                      {o.billing?.address || "No address"}
                    </div>
                  </div>

                  <div className="col-span-7 rounded-md bg-gray-50 p-2">
                    <div className="flex justify-between text-[11px] font-bold mb-1">
                      <span>Items</span>
                      <span className="text-gray-500">
                        {firstTwo.length}/{o.items?.length || 0}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {firstTwo.map((it, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2 rounded-lg border bg-white p-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={it.image || "/placeholder.png"}
                              alt={it.name}
                              className="w-9 h-9 rounded-md object-cover border"
                              loading="lazy"
                            />
                            <div className="min-w-0">
                              <p className="text-[11px] font-semibold truncate">
                                {it.name}
                              </p>
                              <p className="text-[10px] text-gray-500">
                                Qty: {it.qty} • ৳{it.price}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {moreCount > 0 && (
                      <div className="mt-1 text-[10px] text-gray-500">
                        +{moreCount} more items
                      </div>
                    )}
                  </div>
                </div>

                {/* Totals */}
                <div className="rounded-md bg-gray-50 p-2 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>৳{o.subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <span>৳{o.deliveryCharge}</span>
                  </div>
                  {!!o.discount && (
                    <div className="flex justify-between text-red-600">
                      <span>Discount</span>
                      <span>-৳{o.discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>৳{o.total}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-2">
                  <select
                    className="h-8 rounded-md border px-2 text-xs font-semibold"
                    value={o.status}
                    onChange={(e) => handleChange(o._id, e.target.value)}
                    disabled={isUpdating || locked}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>

                  <div className="flex gap-1">
                    <IconBtn
                      onClick={() => onEdit(o)}
                      className="bg-yellow-500 text-white"
                    >
                      <Edit3 size={14} />
                    </IconBtn>

                    <IconBtn
                      onClick={() => onDelete(o)}
                      className="bg-red-600 text-white"
                    >
                      <Trash2 size={14} />
                    </IconBtn>

                    <IconBtn
                      onClick={() => onSendCourier(o)}
                      disabled={isSending || !canSendCourier}
                      className={
                        isSending || !canSendCourier
                          ? "bg-gray-200 text-gray-500"
                          : "bg-blue-600 text-white"
                      }
                    >
                      <Send size={14} />
                    </IconBtn>
                  </div>
                </div>

                {/* ✅ Cancel Reason */}
                {o.status === "cancelled" && o.cancelReason && (
                  <div className="text-[11px] text-red-700">
                    <span className="font-semibold">Reason:</span>{" "}
                    {o.cancelReason}
                  </div>
                )}

                {/* Tracking */}
                {o.trackingId && (
                  <div className="text-[11px] text-gray-700">
                    <span className="font-semibold">Tracking:</span>{" "}
                    <span className="text-indigo-600">{o.trackingId}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function IconBtn({ children, className = "", disabled, ...props }) {
  return (
    <button
      disabled={disabled}
      {...props}
      className={`h-8 w-8 grid place-items-center rounded-md shadow-sm transition active:scale-95 ${
        disabled ? "cursor-not-allowed" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
}
