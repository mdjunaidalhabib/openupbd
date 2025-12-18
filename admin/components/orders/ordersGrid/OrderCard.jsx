"use client";
import { Edit3, Trash2, Send, ChevronDown, ChevronUp } from "lucide-react";

import {
  STATUS_LABEL,
  STATUS_COLORS,
  STATUS_OPTIONS,
  LOCKED_STATUSES,
  STATUS_FLOW,
  READY_STATUS,
} from "../shared/constants";
import { formatOrderTime } from "../shared/utils";

/* ===============================
   ORDER CARD
================================ */
export default function OrderCard({
  o,
  expanded,
  setOpenId,
  selected,
  toggleOne,
  updatingId,
  onStatusChange,
  onEdit,
  onDelete,
  onSendCourier,
}) {
  /* 🔒 locked status */
  const locked = LOCKED_STATUSES.includes(o.status);

  const itemCount = o.items?.reduce((s, it) => s + (it.qty || 0), 0) || 0;

  const firstTwo = o.items?.slice(0, 2) || [];
  const moreCount = (o.items?.length || 0) - firstTwo.length;

  return (
    <div className="px-3 py-2">
      {/* ===== HEADER ===== */}
      <div className="flex gap-2 items-start">
        <input
          type="checkbox"
          className="mt-1"
          checked={selected.includes(o._id)}
          onChange={() => toggleOne(o._id)}
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

          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* ===== EXPANDED ===== */}
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
                      alt=""
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
            {/* STATUS CHANGE */}
            <select
              className="h-8 rounded-md border px-2 text-xs font-semibold"
              value={o.status}
              disabled={locked || updatingId === o._id}
              onChange={(e) =>
                onStatusChange(o._id, { status: e.target.value }, o)
              }
            >
              {STATUS_OPTIONS.map((s) => {
                const allowedNext = STATUS_FLOW[o.status] || [];

                return (
                  <option
                    key={s}
                    value={s}
                    disabled={s === o.status || !allowedNext.includes(s)}
                  >
                    {STATUS_LABEL[s]}
                  </option>
                );
              })}
            </select>

            <div className="flex gap-1">
              <IconBtn
                onClick={() => onEdit(o)}
                className="bg-yellow-500 text-white"
              >
                <Edit3 size={14} />
              </IconBtn>

              <IconBtn
                onClick={() => onDelete?.(o)}
                className="bg-red-600 text-white"
              >
                <Trash2 size={14} />
              </IconBtn>

              {/* SEND TO COURIER */}
              {o.status === READY_STATUS && !o.trackingId && (
                <IconBtn
                  onClick={() =>
                    onStatusChange(o._id, { status: "send_to_courier" }, o)
                  }
                  disabled={updatingId === o._id}
                  className="bg-blue-600 text-white" >
                  <Send size={14} />
                </IconBtn>
              )}
            </div>
          </div>

          {/* Cancel reason */}
          {o.status === "cancelled" && o.cancelReason && (
            <div className="text-red-700 text-[11px]">
              <span className="font-semibold">Reason:</span> {o.cancelReason}
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
}

/* ===============================
   SMALL UI
================================ */
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
