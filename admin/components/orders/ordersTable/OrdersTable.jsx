"use client";
import { useEffect, useState } from "react";
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
import CourierTrackModal from "../modals/CourierTrackModal";

export default function OrdersTable({
  orders,
  onEdit,
  onDelete = null,
  onStatusChange,
  onSendCourier,
  onBulkStatusChange,
  onBulkDelete,
  onBulkSendCourier,

  // 🆕 from useOrders
  courierStatusMap = {},
  fetchCourierStatus,
}) {
  const [tabStatus, setTabStatus] = useState("");
  const [q, setQ] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  // 🆕 Track modal state
  const [trackOrder, setTrackOrder] = useState(null);

  const manager = useOrdersManager({
    orders,
    tabStatus,
    search: q,
  });

  /* ===============================
     AUTO FETCH COURIER STATUS
  =============================== */
  useEffect(() => {
    if (!fetchCourierStatus) return;

    manager.filteredOrders
      .filter((o) => o.status === "send_to_courier" && o.trackingId)
      .forEach(fetchCourierStatus);
  }, [manager.filteredOrders, fetchCourierStatus]);

  /* ===============================
     SINGLE ORDER STATUS CHANGE
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
                const isAdminCreated = o?.createdBy === "admin";

                const courierStatus = courierStatusMap[o._id];

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

                      {isAdminCreated && (
                        <div className="mt-1 text-[10px] text-blue-700">
                          Created by{" "}
                          <span className="font-semibold">
                            {o.createdByName}
                          </span>
                        </div>
                      )}

                      <div className="text-xs text-gray-500 mt-1">
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
                              alt=""
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
                      </div>
                    </td>

                    {/* TOTALS */}
                    <td className="p-1 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>৳{o.subtotal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery</span>
                        <span>৳{o.deliveryCharge}</span>
                      </div>
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
                    <td className="p-2 space-y-1">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full border ${
                          STATUS_BADGE_COLOR[o.status]
                        }`}
                      >
                        {STATUS_LABEL[o.status]}
                      </span>

                      {/* 🆕 COURIER STATUS + TRACK + REFRESH */}
                      {o.status === "send_to_courier" && o.trackingId && (
                        <div className="text-[11px] flex items-center flex-wrap gap-2">
                          <span className="font-semibold text-gray-600">
                            Courier:
                          </span>

                          <span className="font-bold text-purple-700">
                            {courierStatus || "Checking..."}
                          </span>

                          <button
                            onClick={() => setTrackOrder(o)}
                            className="h-7 px-3 rounded-full text-[11px] font-bold border bg-white hover:bg-gray-50"
                          >
                            Track
                          </button>

                          <button
                            onClick={() => fetchCourierStatus?.(o)}
                            disabled={!fetchCourierStatus}
                            className={`h-7 px-3 rounded-full text-[11px] font-bold border ${
                              !fetchCourierStatus
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-gray-900 text-white hover:opacity-90"
                            }`}
                          >
                            Refresh
                          </button>
                        </div>
                      )}

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
                          allowedNext.includes(s),
                        ).map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>

                      {o.status === "cancelled" && o.cancelReason && (
                        <div className="text-[11px] text-red-600">
                          <b>Reason:</b> {o.cancelReason}
                        </div>
                      )}
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

      <CourierTrackModal
        order={trackOrder}
        status={trackOrder ? courierStatusMap[trackOrder._id] : null}
        onClose={() => setTrackOrder(null)}
        onRefresh={
          trackOrder && fetchCourierStatus
            ? () => fetchCourierStatus(trackOrder)
            : null
        }
      />
    </div>
  );
}
