"use client";
import { useState } from "react";
import Badge from "../Badge";

import {
  STATUS_LABEL,
  STATUS_BADGE_COLOR,
  STATUS_OPTIONS,
} from "../shared/constants";

import { formatOrderTime } from "../shared/utils"; // ✅ USE UTILS
import useOrdersManager from "../hooks/useOrdersManager";
import StatusTabs from "./StatusTabs";
import BulkActions from "./BulkActions";

export default function OrdersTable({
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
  const [q, setQ] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const manager = useOrdersManager({
    orders,
    tabStatus,
    search: q,
  });

  const handleChange = async (id, status) => {
    setUpdatingId(id);
    try {
      await onStatusChange(id, { status });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="hidden md:block space-y-3">
      {/* HEADER */}
      <div className="rounded-lg border shadow-sm p-3 space-y-3 sticky top-0 z-30 bg-white/95">
        <input
          className="border rounded px-3 py-2 w-full"
          placeholder="Search by OrderID / Name / Phone"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <div className="flex flex-wrap items-center gap-2 px-1">
          <StatusTabs tabStatus={tabStatus} setTabStatus={setTabStatus} />
          <div className="flex-1" />

          {manager.selected.length > 0 && (
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
              onDelete={onDelete}
              onBulkDelete={onBulkDelete}
            />
          )}
        </div>

        <div className="text-xs text-gray-500 px-1">
          Showing:{" "}
          <span className="font-semibold">{manager.filteredOrders.length}</span>
        </div>
      </div>

      {/* TABLE */}
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
                <th className="p-3 text-left">Totals</th>
                <th className="p-3 text-left">Payment</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {manager.filteredOrders.map((o) => {
                const locked =
                  o.status === "delivered" || o.status === "cancelled";

                return (
                  <tr key={o._id} className="border-t hover:bg-gray-50">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={manager.selected.includes(o._id)}
                        onChange={() => manager.toggleOne(o._id)}
                        disabled={locked}
                      />
                    </td>

                    <td className="p-3">
                      <div className="font-mono text-xs text-gray-500">
                        #{o._id}
                      </div>
                      {/* ✅ utils used here */}
                      <div className="text-xs text-gray-500">
                        {formatOrderTime(o)}
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="font-semibold">{o.billing?.name}</div>
                      <div className="text-gray-600">{o.billing?.phone}</div>
                    </td>

                    <td className="p-3">
                      <div className="font-semibold">৳{o.total}</div>
                    </td>

                    <td className="p-3">
                      <Badge>{o.paymentMethod?.toUpperCase()}</Badge>
                    </td>

                    <td className="p-3">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full border ${
                          STATUS_BADGE_COLOR[o.status]
                        }`}
                      >
                        {STATUS_LABEL[o.status]}
                      </span>

                      <select
                        className="mt-1 border rounded px-2 py-1 text-sm"
                        value={o.status}
                        disabled={locked || updatingId === o._id}
                        onChange={(e) => handleChange(o._id, e.target.value)}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="p-3 flex gap-2">
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
