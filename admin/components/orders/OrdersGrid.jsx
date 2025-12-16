"use client";
import { useMemo, useState } from "react";
import { Edit3, Trash2, Send, ChevronDown, ChevronUp } from "lucide-react";

/* ===============================
   CONSTANTS
================================ */
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

/* ===============================
   COMPONENT
================================ */
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
  const [tabStatus, setTabStatus] = useState("");
  const [openId, setOpenId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [selected, setSelected] = useState([]);

  /* swipe */
  const [swipeId, setSwipeId] = useState(null);
  const [touchX, setTouchX] = useState(0);

  /* confirm modal */
  const [confirm, setConfirm] = useState(null);
  // { type: "delete" | "courier", orders: [] }

  /* ===============================
     STATUS COUNT (SUMMARY BAR)
  =============================== */
  const statusCount = useMemo(() => {
    const base = {
      pending: 0,
      ready_to_delivery: 0,
      send_to_courier: 0,
      delivered: 0,
      cancelled: 0,
    };
    (orders || []).forEach((o) => {
      if (base[o.status] !== undefined) base[o.status]++;
    });
    return base;
  }, [orders]);

  /* ===============================
     FILTER
  =============================== */
  const filteredOrders = useMemo(() => {
    if (!tabStatus) return orders || [];
    return (orders || []).filter((o) => o.status === tabStatus);
  }, [orders, tabStatus]);

  /* ===============================
     SELECTION
  =============================== */
  const toggleOne = (id) => {
    setSelected((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
    );
  };

  const selectedOrders = useMemo(
    () => filteredOrders.filter((o) => selected.includes(o._id)),
    [filteredOrders, selected]
  );

  /* ===============================
     BULK RULES
  =============================== */
  const sameStatus =
    selectedOrders.length > 0 &&
    selectedOrders.every((o) => o.status === selectedOrders[0].status);

  const bulkStatus = sameStatus ? selectedOrders[0].status : "";

  const canBulkSendCourier =
    selectedOrders.length > 0 &&
    selectedOrders.every(
      (o) => o.status === "ready_to_delivery" && !o.trackingId
    );

  /* ===============================
     STATUS CHANGE
  =============================== */
  const handleChange = async (id, status) => {
    setUpdatingId(id);
    try {
      await onStatusChange(id, { status });
    } finally {
      setUpdatingId(null);
    }
  };

  /* ===============================
     SWIPE
  =============================== */
  const onTouchStart = (e) => setTouchX(e.touches[0].clientX);
  const onTouchEnd = (e, id, locked) => {
    if (locked) return;
    const diff = touchX - e.changedTouches[0].clientX;
    if (diff > 60) setSwipeId(id);
    else setSwipeId(null);
  };

  if (!filteredOrders.length) {
    return (
      <div className="p-6 text-center text-gray-500 md:hidden">
        No orders found.
      </div>
    );
  }

  return (
    <div className="md:hidden space-y-2">
      {/* ===== STATUS SUMMARY (SELECT BOX) ===== */}
      <div className="sticky top-0 z-30 bg-white border-b px-2 py-2">
        <select
          value={tabStatus}
          onChange={(e) => setTabStatus(e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm"
        >
          <option value="">ALL ({orders.length})</option>

          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]} ({statusCount[s] ?? 0})
            </option>
          ))}
        </select>
      </div>

      {/* ===== BULK BAR ===== */}
      {selected.length > 0 && sameStatus && (
        <div className="sticky top-[44px] z-20 bg-gray-50 border rounded-lg p-2 flex flex-wrap gap-2 items-center">
          <span className="text-xs font-semibold bg-blue-600 text-white px-2 py-0.5 rounded-full">
            {selected.length} Selected
          </span>

          <select
            className="border rounded-full px-2 py-1 text-xs bg-white"
            value={bulkStatus}
            onChange={(e) => {
              const status = e.target.value;
              selected.length === 1
                ? onStatusChange(selected[0], { status })
                : onBulkStatusChange(selected, { status });
              setSelected([]);
            }}
          >
            <option value={bulkStatus} disabled>
              {STATUS_LABEL[bulkStatus]}
            </option>
            {STATUS_OPTIONS.filter((s) => s !== bulkStatus).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>

          {canBulkSendCourier && (
            <button
              onClick={() =>
                setConfirm({ type: "courier", orders: selectedOrders })
              }
              className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs"
            >
              Courier
            </button>
          )}

          <button
            onClick={() =>
              setConfirm({ type: "delete", orders: selectedOrders })
            }
            className="bg-red-600 text-white px-3 py-1 rounded-full text-xs"
          >
            Delete
          </button>
        </div>
      )}

      {/* ===== ORDERS ===== */}
      <div className="rounded-xl border bg-white divide-y shadow-sm overflow-hidden">
        {filteredOrders.map((o) => {
          const expanded = openId === o._id;
          const locked = o.status === "delivered" || o.status === "cancelled";
          const canSendCourier =
            o.status === "ready_to_delivery" && !o.trackingId;

          const itemCount =
            o.items?.reduce((s, it) => s + (it.qty || 0), 0) || 0;

          const firstTwo = o.items?.slice(0, 2) || [];
          const moreCount = (o.items?.length || 0) - firstTwo.length;

          return (
            <div
              key={o._id}
              onTouchStart={onTouchStart}
              onTouchEnd={(e) => onTouchEnd(e, o._id, locked)}
              className="relative"
            >
              {/* SWIPE ACTIONS */}
              {swipeId === o._id && (
                <div className="absolute right-2 top-2 flex gap-1 z-10">
                  <IconBtn
                    onClick={() => onEdit(o)}
                    className="bg-yellow-500 text-white"
                  >
                    <Edit3 size={14} />
                  </IconBtn>
                  <IconBtn
                    onClick={() => setConfirm({ type: "delete", orders: [o] })}
                    className="bg-red-600 text-white"
                  >
                    <Trash2 size={14} />
                  </IconBtn>
                  {canSendCourier && (
                    <IconBtn
                      onClick={() =>
                        setConfirm({ type: "courier", orders: [o] })
                      }
                      className="bg-blue-600 text-white"
                    >
                      <Send size={14} />
                    </IconBtn>
                  )}
                </div>
              )}

              {/* ===== CARD (UNCHANGED UI) ===== */}
              <div className="px-3 py-2">
                {/* HEADER */}
                <div className="flex gap-2 items-start">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={selected.includes(o._id)}
                    onChange={() => toggleOne(o._id)}
                    disabled={locked}
                  />

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

                {/* EXPANDED */}
                {expanded && (
                  <div className="mt-2 space-y-3 text-xs text-gray-700">
                    {/* Customer + Items */}
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-5 rounded-md bg-gray-50 p-2 space-y-1">
                        <div className="text-[11px] font-bold">Customer</div>
                        <div className="font-semibold">{o.billing?.name}</div>
                        <div className="text-[11px]">{o.billing?.phone}</div>
                        <div className="text-[11px] text-gray-600 line-clamp-2">
                          {o.billing?.address}
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
                          onClick={() =>
                            setConfirm({ type: "delete", orders: [o] })
                          }
                          className="bg-red-600 text-white"
                        >
                          <Trash2 size={14} />
                        </IconBtn>

                        <IconBtn
                          onClick={() =>
                            setConfirm({ type: "courier", orders: [o] })
                          }
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

                    {/* Cancel reason */}
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
            </div>
          );
        })}
      </div>

      {/* ===== CONFIRM MODAL ===== */}
      {confirm && (
        <ConfirmModal
          title={
            confirm.type === "delete" ? "Delete order?" : "Send to courier?"
          }
          onClose={() => setConfirm(null)}
          onConfirm={() => {
            if (confirm.type === "delete") {
              confirm.orders.length === 1
                ? onDelete(confirm.orders[0])
                : onBulkDelete(confirm.orders.map((o) => o._id));
            } else {
              confirm.orders.length === 1
                ? onSendCourier(confirm.orders[0])
                : onBulkSendCourier(confirm.orders);
            }
            setSelected([]);
            setConfirm(null);
          }}
        />
      )}
    </div>
  );
}

/* ===============================
   SMALL UI
================================ */
function StatusChip({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap transition ${
        active
          ? "bg-gray-900 text-white border-gray-900"
          : "bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      <span>{label}</span>
      <span
        className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
          active
            ? "bg-white/20 text-white"
            : "bg-gray-100 text-gray-700"
        }`}
      >
        {count}
      </span>
    </button>
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

function ConfirmModal({ title, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center">
      <div className="bg-white rounded-xl p-4 w-[280px] space-y-3">
        <div className="font-semibold text-center">{title}</div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 border rounded py-2 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 text-white rounded py-2 text-sm"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
