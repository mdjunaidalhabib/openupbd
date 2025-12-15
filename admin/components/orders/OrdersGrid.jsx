"use client";
import { useMemo, useState } from "react";
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
  onBulkStatusChange,
  onBulkDelete,
  onBulkSendCourier,
}) {
  const [openId, setOpenId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [selected, setSelected] = useState([]);
  const [bulkStatus, setBulkStatus] = useState("");

  const bulkEnabled =
    typeof onBulkStatusChange === "function" &&
    typeof onBulkDelete === "function" &&
    typeof onBulkSendCourier === "function";

  const toggleOne = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectedOrders = useMemo(
    () => orders?.filter((o) => selected.includes(o._id)) || [],
    [orders, selected]
  );

  const handleChange = async (id, status) => {
    setUpdatingId(id);
    try {
      await onStatusChange(id, { status });
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
    <div className="md:hidden space-y-2">
      {/* ===== BULK BAR ===== */}
      {bulkEnabled && selected.length > 0 && (
        <div className="sticky top-0 z-20 bg-blue-50 border border-blue-200 rounded-lg p-2 flex flex-wrap gap-2 items-center">
          <span className="text-xs font-semibold">
            Selected: {selected.length}
          </span>

          <select
            className="border rounded px-2 py-1 text-xs"
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
          >
            <option value="">Change Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              if (!bulkStatus) return;
              onBulkStatusChange(selected, { status: bulkStatus });
              setSelected([]);
              setBulkStatus("");
            }}
            className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
          >
            Update
          </button>

          <button
            onClick={() => {
              onBulkSendCourier(selectedOrders);
              setSelected([]);
            }}
            className="px-2 py-1 bg-purple-600 text-white rounded text-xs"
          >
            Courier
          </button>

          <button
            onClick={() => {
              onBulkDelete(selected);
              setSelected([]);
            }}
            className="px-2 py-1 bg-red-600 text-white rounded text-xs"
          >
            Delete
          </button>
        </div>
      )}

      {/* ===== ORDERS ===== */}
      <div className="rounded-xl border bg-white divide-y shadow-sm overflow-hidden">
        {orders.map((o) => {
          const expanded = openId === o._id;
          const locked = o.status === "delivered" || o.status === "cancelled";

          const canSendCourier =
            o.status === "ready_to_delivery" && !o.trackingId;

          const itemCount =
            o.items?.reduce((s, it) => s + (it.qty || 0), 0) || 0;

          const firstTwo = o.items?.slice(0, 2) || [];
          const moreCount = (o.items?.length || 0) - firstTwo.length;

          return (
            <div key={o._id} className="px-3 py-2">
              {/* ===== HEADER ===== */}
              <div className="flex gap-2 items-start">
                {bulkEnabled && (
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={selected.includes(o._id)}
                    onChange={() => toggleOne(o._id)}
                    disabled={locked}
                  />
                )}

                <button
                  onClick={() => setOpenId(expanded ? null : o._id)}
                  className="flex-1 flex gap-2 text-left"
                >
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${
                      STATUS_COLORS[o.status]
                    }`}
                  >
                    {STATUS_LABEL[o.status]}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="truncate text-xs font-semibold">
                      {o.billing?.name || "Unknown"}
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono truncate">
                      #{o._id}
                    </div>
                    <div className="mt-0.5 flex gap-2 text-[11px] text-gray-600">
                      <span>{formatOrderTime(o)}</span>
                      <span>{itemCount} items</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-extrabold">৳{o.total}</div>
                    <div className="text-[10px] text-gray-400">
                      {expanded ? "close" : "open"}
                    </div>
                  </div>

                  {expanded ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
              </div>

              {/* ===== EXPANDED ===== */}
              {expanded && (
                <div className="mt-2 space-y-3 text-xs text-gray-700">
                  {/* ✅ Customer + Items SIDE BY SIDE */}
                  <div className="grid grid-cols-12 gap-2">
                    {/* Customer */}
                    <div className="col-span-5 rounded-md bg-gray-50 p-2 space-y-1">
                      <div className="text-[11px] font-bold">Customer</div>
                      <div className="font-semibold">{o.billing?.name}</div>
                      <div className="text-[11px]">{o.billing?.phone}</div>
                      <div className="text-[11px] text-gray-600 line-clamp-2">
                        {o.billing?.address}
                      </div>
                    </div>

                    {/* Items */}
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
                            className="flex items-center gap-2 rounded-lg border bg-white p-2"
                          >
                            <img
                              src={it.image || "/placeholder.png"}
                              className="w-9 h-9 rounded-md border"
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
                  <div className="rounded-md bg-gray-50 p-2 space-y-1">
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
                      disabled={locked || updatingId === o._id}
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
                        disabled={!canSendCourier}
                        className={
                          canSendCourier
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-500"
                        }
                      >
                        <Send size={14} />
                      </IconBtn>
                    </div>
                  </div>

                  {/* Cancel Reason */}
                  {o.status === "cancelled" && o.cancelReason && (
                    <div className="text-red-700 text-[11px]">
                      <span className="font-semibold">Reason:</span>{" "}
                      {o.cancelReason}
                    </div>
                  )}

                  {/* Tracking */}
                  {o.trackingId && (
                    <div className="text-[11px]">
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
