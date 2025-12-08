"use client";
import { useState } from "react";
import { Edit3, Trash2, Send, ChevronDown, ChevronUp } from "lucide-react";

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const STATUS_COLORS = {
  pending: "text-yellow-700 bg-yellow-50 ring-yellow-200",
  confirmed: "text-blue-700 bg-blue-50 ring-blue-200",
  processing: "text-indigo-700 bg-indigo-50 ring-indigo-200",
  shipped: "text-purple-700 bg-purple-50 ring-purple-200",
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
    await onStatusChange(id, newStatus);
    setUpdatingId(null);
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
        const isSending = sendingId === o._id;
        const alreadySent = !!o.trackingId;

        const itemCount = o.items?.reduce((a, b) => a + (b.qty || 0), 0) || 0;

        const firstTwo = o.items?.slice(0, 2) || [];
        const moreCount = (o.items?.length || 0) - firstTwo.length;

        const orderTime = formatOrderTime(o);

        return (
          <div key={o._id} className="px-3 py-2 max-w-full">
            {/* ✅ ULTRA COMPACT ROW */}
            <button
              type="button"
              onClick={() => setOpenId(expanded ? null : o._id)}
              className="w-full flex items-center gap-2 text-left max-w-full"
            >
              {/* status chip */}
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${
                  STATUS_COLORS[o.status] ||
                  "text-gray-700 bg-gray-50 ring-gray-200"
                }`}
              >
                {o.status?.toUpperCase()}
              </span>

              {/* main info */}
              <div className="min-w-0 flex-1">
                {/* line 1: Name + ID */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="truncate text-xs font-semibold text-gray-900">
                    {o.billing?.name || "Unknown"}
                  </div>
                  <div className="shrink-0 text-[10px] text-gray-400 font-mono">
                    #{o._id}
                  </div>
                </div>

                {/* line 2: time + meta */}
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-600 truncate">
                  <span className="shrink-0 text-[10px] text-gray-500">
                    {orderTime}
                  </span>
                  <span>{itemCount} items</span>

                  {o.paymentMethod && (
                    <span className="uppercase text-[10px] text-gray-500">
                      {o.paymentMethod}
                    </span>
                  )}

                  {o.trackingId && (
                    <span className="text-[10px] text-indigo-600 font-semibold">
                      TRK:{o.trackingId}
                    </span>
                  )}

                  {o.courier && (
                    <span className="text-[10px] text-emerald-700 font-semibold">
                      {o.courier}
                    </span>
                  )}
                </div>
              </div>

              {/* total */}
              <div className="shrink-0 text-right">
                <div className="text-sm font-extrabold text-gray-900 leading-none">
                  ৳{o.total}
                </div>
                <div className="text-[10px] text-gray-400">
                  {expanded ? "close" : "open"}
                </div>
              </div>

              {/* chevron */}
              <div className="shrink-0 text-gray-400">
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>

            {/* ✅ EXPANDED DETAILS */}
            {expanded && (
              <div className="mt-2 space-y-2 text-xs text-gray-700 max-w-full overflow-hidden">
                {/* Customer ছোট | Items বড় */}
                <div className="grid grid-cols-12 gap-2 max-w-full">
                  {/* Customer box ছোট */}
                  <div className="col-span-5 min-w-0 rounded-md bg-gray-50 p-2 space-y-1 overflow-hidden">
                    <div className="text-[11px] font-bold text-gray-900">
                      Customer
                    </div>

                    <div className="text-xs font-semibold text-gray-900 leading-tight break-words">
                      {o.billing?.name || "Unknown"}
                    </div>

                    <div className="text-[11px] text-gray-700 font-medium break-words">
                      {o.billing?.phone || "No phone"}
                    </div>

                    <div className="text-[11px] text-gray-600 line-clamp-2 break-words">
                      {o.billing?.address || "No address"}
                    </div>

                    {o.courier && (
                      <div className="text-[10px] text-emerald-700 font-semibold break-words">
                        Courier: {o.courier}
                      </div>
                    )}
                  </div>

                  {/* Items box বড় */}
                  <div className="col-span-7 min-w-0 rounded-md bg-gray-50 p-2 overflow-hidden">
                    <div className="text-[11px] font-bold text-gray-900 mb-1">
                      Items
                    </div>

                    <ul className="space-y-1">
                      {firstTwo.map((it, idx) => (
                        <li
                          key={idx}
                          className="flex items-start justify-between gap-2 text-[11px] min-w-0"
                        >
                          <span className="min-w-0 whitespace-normal break-words leading-snug">
                            {it.name} × {it.qty}
                          </span>
                          <span className="shrink-0 font-medium">
                            ৳{it.price}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {moreCount > 0 && (
                      <div className="mt-1 text-[10px] text-gray-500">
                        +{moreCount} more items
                      </div>
                    )}

                    {/* Totals inside items box */}
                    <div className="mt-2 pt-2 border-t border-gray-200 space-y-0.5 text-[11px] text-gray-700">
                      <div className="flex justify-between">
                        <span>Sub</span>
                        <span>৳{o.subtotal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Del</span>
                        <span>৳{o.deliveryCharge}</span>
                      </div>
                      {!!o.discount && (
                        <div className="flex justify-between text-red-700">
                          <span>Dis</span>
                          <span>-৳{o.discount}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold text-gray-900">
                        <span>Total</span>
                        <span>৳{o.total}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* status select + icon actions */}
                <div className="flex items-center justify-between gap-2 pt-1 max-w-full">
                  <select
                    className={`h-8 rounded-md border bg-white px-2 text-xs font-semibold outline-none
                    ${isUpdating ? "opacity-60" : "hover:border-gray-400"}`}
                    value={o.status}
                    onChange={(e) => handleChange(o._id, e.target.value)}
                    disabled={isUpdating}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1 shrink-0">
                    <IconBtn
                      title="Edit"
                      onClick={() => onEdit(o)}
                      className="bg-yellow-500 text-white"
                    >
                      <Edit3 size={14} />
                    </IconBtn>

                    <IconBtn
                      title="Delete"
                      onClick={() => onDelete(o)}
                      className="bg-red-600 text-white"
                    >
                      <Trash2 size={14} />
                    </IconBtn>

                    <IconBtn
                      title="Send Courier"
                      onClick={() => onSendCourier(o)}
                      disabled={isSending || alreadySent}
                      className={
                        isSending || alreadySent
                          ? "bg-gray-200 text-gray-500"
                          : "bg-blue-600 text-white"
                      }
                    >
                      <Send size={14} />
                    </IconBtn>
                  </div>
                </div>

                {isUpdating && (
                  <div className="text-[10px] text-gray-500">Updating...</div>
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
      className={`h-8 w-8 grid place-items-center rounded-md text-xs font-bold shadow-sm active:scale-95 transition
      ${disabled ? "cursor-not-allowed" : ""} ${className}`}
    >
      {children}
    </button>
  );
}
