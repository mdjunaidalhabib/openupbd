"use client";
import { useState } from "react";
import Badge from "../Badge";

import {
  STATUS_LABEL,
  STATUS_BADGE_COLOR,
  STATUS_OPTIONS,
  LOCKED_STATUSES,
  STATUS_FLOW,
  READY_STATUS,
} from "../shared/constants";

import { formatOrderTime } from "../shared/utils";
import useOrdersManager from "../hooks/useOrdersManager";
import StatusTabs from "./StatusTabs";
import BulkActions from "./BulkActions";

export default function OrdersTable({
  orders,
  onEdit,
  onDelete = null,
  onStatusChange,
  onSendCourier,
  onBulkStatusChange,
  onBulkDelete,
  onBulkSendCourier,
}) {
  const [tabStatus, setTabStatus] = useState("");
  const [q, setQ] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const manager = useOrdersManager({
    orders,
    tabStatus,
    search: q,
  });

  /* ===============================
     SINGLE ORDER STATUS CHANGE
     READY → SEND_TO_COURIER হলে
     auto courier create হবে
  =============================== */
  const handleChange = async (id, payload, order) => {
    setUpdatingId(id);
    try {
      if (
        order?.status === READY_STATUS &&
        payload.status === "send_to_courier"
      ) {
        await onSendCourier(order);
        manager.setSelected([]);
        return;
      }

      await onStatusChange(id, payload);
      manager.setSelected([]);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="hidden md:block space-y-3">
      {/* ================= HEADER ================= */}
      <div className="rounded-lg border shadow-sm p-3 space-y-3 sticky top-0 z-30 bg-white/95">
        <input
          className="border rounded px-3 py-2 w-full"
          placeholder="Search by OrderID / Name / Phone"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            manager.setSelected([]);
          }}
        />

        <div className="flex flex-wrap items-center gap-2 px-1">
          <StatusTabs
            tabStatus={tabStatus}
            setTabStatus={(s) => {
              setTabStatus(s);
              manager.setSelected([]);
            }}
          />

          <div className="flex-1" />

          <BulkActions
            selected={manager.selected}
            selectedOrders={manager.selectedOrders}
            sameStatus={manager.sameStatus}
            bulkStatus={manager.bulkStatus}
            canBulkSendCourier={manager.canBulkSendCourier}
            setSelected={manager.setSelected}
            onStatusChange={onStatusChange}
            onBulkStatusChange={onBulkStatusChange}
            onSendCourier={onSendCourier}
            onBulkSendCourier={onBulkSendCourier}
            onBulkDelete={onBulkDelete}
          />
        </div>

        <div className="text-xs text-gray-500 px-1">
          Showing:{" "}
          <span className="font-semibold">{manager.filteredOrders.length}</span>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="overflow-x-auto bg-white rounded-lg border shadow-sm">
        {!manager.filteredOrders.length ? (
          <div className="p-6 text-center text-gray-500">No orders found.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3">
                  <input
                    type="checkbox"
                    checked={manager.allSelected}
                    onChange={manager.toggleAll}
                  />
                </th>
                <th className="p-3 text-left">Order</th>
                <th className="p-3 text-left">Customer</th>
                <th className="p-3 text-left">Items</th>
                <th className="p-3 text-left">Totals</th>
                <th className="p-3 text-left">Payment</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {manager.filteredOrders.map((o) => {
                const locked = LOCKED_STATUSES.includes(o.status);
                const allowedNext = STATUS_FLOW[o.status] || [];

                return (
                  <tr
                    key={o._id}
                    className={`border-t hover:bg-gray-50 ${
                      manager.selected.includes(o._id) ? "bg-blue-50" : ""
                    }`}
                  >
                    {/* CHECKBOX */}
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={manager.selected.includes(o._id)}
                        onChange={() => manager.toggleOne(o._id)}
                        disabled={locked}
                      />
                    </td>

                    {/* ORDER INFO */}
                    <td className="p-2">
                      <div className="font-mono text-xs text-gray-500">
                        #{o._id}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatOrderTime(o)}
                      </div>
                    </td>

                    {/* CUSTOMER */}
                    <td className="p-2">
                      <div className="font-semibold">{o.billing?.name}</div>
                      <div className="text-gray-600">{o.billing?.phone}</div>
                    </td>

                    {/* ITEMS */}
                    <td className="p-2">
                      <div className="space-y-2 max-w-[200px]">
                        {(o.items || []).slice(0, 2).map((it, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 rounded-lg border bg-gray-50 p-2"
                          >
                            <img
                              src={it.image || "/placeholder.png"}
                              className="w-8 h-8 rounded-md border"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold truncate">
                                {it.name}
                              </p>
                              <p className="text-[11px] text-gray-500">
                                Qty: {it.qty} • ৳{it.price}
                              </p>
                            </div>
                          </div>
                        ))}

                        {o.items?.length > 2 && (
                          <div className="text-[11px] text-gray-500">
                            +{o.items.length - 2} more items
                          </div>
                        )}
                      </div>
                    </td>

                    {/* TOTALS */}
                    <td className="p-1 text-xs space-y-1 min-w-[70px]">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Subtotal</span>
                        <span>৳{o.subtotal}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-500">Delivery</span>
                        <span>৳{o.deliveryCharge}</span>
                      </div>

                      {!!o.discount && (
                        <div className="flex justify-between text-red-600">
                          <span>Discount</span>
                          <span>-৳{o.discount}</span>
                        </div>
                      )}

                      <div className="flex justify-between font-bold border-t pt-1">
                        <span>Total</span>
                        <span>৳{o.total}</span>
                      </div>
                    </td>

                    {/* PAYMENT */}
                    <td className="p-3">
                      <Badge>{o.paymentMethod?.toUpperCase()}</Badge>
                    </td>

                    {/* STATUS */}
                    <td className="p-0">
                      <span
                        className={`text-[11px] px-1 py-0.5 mr-2 rounded-full border ${
                          STATUS_BADGE_COLOR[o.status]
                        }`}
                      >
                        {STATUS_LABEL[o.status]}
                      </span>

                      <select
                        className="mt-1 border rounded px-2 py-1 text-sm"
                        value={o.status}
                        disabled={locked || updatingId === o._id}
                        onChange={(e) =>
                          handleChange(o._id, { status: e.target.value }, o)
                        }
                      >
                        <option value={o.status} disabled>
                          {STATUS_LABEL[o.status]}
                        </option>

                        {STATUS_OPTIONS.filter((s) =>
                          allowedNext.includes(s)
                        ).map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* ACTIONS */}
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => onEdit(o)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded text-sm"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => onDelete?.(o)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Delete
                      </button>
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
