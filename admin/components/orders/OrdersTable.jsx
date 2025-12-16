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
  onBulkStatusChange,
  onBulkDelete,
  onBulkSendCourier,
}) {
  const [tabStatus, setTabStatus] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);

  /* ===============================
     🔍 FILTER (UNCHANGED)
  =============================== */
  const filteredOrders = useMemo(() => {
    let list = Array.isArray(orders) ? orders : [];

    if (tabStatus) list = list.filter((o) => o.status === tabStatus);

    if (q.trim()) {
      const qq = q.trim().toLowerCase();
      list = list.filter(
        (o) =>
          o._id?.toLowerCase().includes(qq) ||
          o.billing?.name?.toLowerCase().includes(qq) ||
          o.billing?.phone?.toLowerCase().includes(qq)
      );
    }
    return list;
  }, [orders, tabStatus, q]);

  /* ===============================
     ☑️ SELECTION
  =============================== */
  const isAllSelected =
    filteredOrders.length > 0 && selected.length === filteredOrders.length;

  const toggleAll = () => {
    setSelected(isAllSelected ? [] : filteredOrders.map((o) => o._id));
  };

  const toggleOne = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectedOrders = filteredOrders.filter((o) => selected.includes(o._id));

  /* ===============================
     🔁 SINGLE STATUS CHANGE
  =============================== */
  const handleChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await onStatusChange(id, { status: newStatus });
    } finally {
      setUpdatingId(null);
    }
  };

  /* ===============================
     🚚 BULK COURIER
  =============================== */
  const canBulkSendCourier =
    selectedOrders.length > 0 &&
    selectedOrders.every(
      (o) => o.status === "ready_to_delivery" && !o.trackingId
    );

  /* ===============================
     🔁 BULK STATUS UPDATE ENABLE
     ❌ Only disabled for "All" tab
  =============================== */
  const canBulkStatusUpdate = tabStatus !== "";

  return (
    <div className="hidden md:block space-y-3">
      <div className=" rounded-lg border shadow-sm p-3 space-y-3 sticky top-0 z-30 backdrop-blur bg-white/95">
        {/* 🔍 SEARCH */}
        <input
          className="border rounded px-3 py-2 w-full"
          placeholder="Search by OrderID / Name / Phone"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        {/* 🔥 STATUS BAR + BULK CONTROLLER */}
        <div className="flex flex-wrap items-center gap-2 px-1">
          {/* LEFT: STATUS TABS */}
          <button
            onClick={() => setTabStatus("")}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition ${
              tabStatus === ""
                ? "bg-gray-900 text-white"
                : "bg-white hover:bg-gray-50"
            }`}
          >
            All
          </button>

          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setTabStatus(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition ${
                tabStatus === s
                  ? "bg-blue-600 text-white"
                  : `bg-white hover:bg-gray-50 ${STATUS_TEXT_COLOR[s]}`
              }`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}

          {/* SPACER */}
          <div className="flex-1" />

          {/* 🔥 BULK CONTROLLER (RIGHT, COMPACT & POLISHED) */}
          {selected.length > 0 && (
            <div className="flex items-center gap-2 bg-gray-50 border rounded-full px-3 py-1.5 shadow-sm mr-2">
              {/* ✅ Selected badge */}
              <span className="text-xs font-semibold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                {selected.length} Selected
              </span>

              {/* 🔁 BULK STATUS UPDATE */}
              {canBulkStatusUpdate && (
                <select
                  className="border rounded-full px-2 py-1 text-xs bg-white"
                  value={tabStatus}
                  onChange={(e) => {
                    const status = e.target.value;
                    if (!status) return;

                    selected.length === 1
                      ? onStatusChange(selected[0], { status })
                      : onBulkStatusChange(selected, { status });

                    setSelected([]);
                  }}
                >
                  {/* Current status shown as label */}
                  <option value={tabStatus} disabled>
                    {STATUS_LABEL[tabStatus]}
                  </option>

                  {/* Other status options */}
                  {STATUS_OPTIONS.filter((s) => s !== tabStatus).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              )}

              {/* 🚚 SEND TO COURIER */}
              {canBulkSendCourier && (
                <button
                  onClick={() => {
                    selected.length === 1
                      ? onSendCourier(selectedOrders[0])
                      : onBulkSendCourier(selectedOrders);
                    setSelected([]);
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-full text-xs transition"
                >
                  Courier
                </button>
              )}

              {/* 🗑 DELETE */}
              <button
                onClick={() => {
                  isAllSelected
                    ? onBulkDelete(filteredOrders.map((o) => o._id))
                    : selected.length === 1
                    ? onDelete(selectedOrders[0])
                    : onBulkDelete(selected);
                  setSelected([]);
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-full text-xs transition"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {/* FOOTER INFO */}
        <div className="text-xs text-gray-500 px-1">
          Showing:{" "}
          <span className="font-semibold">{filteredOrders.length}</span>
        </div>
      </div>

      {/* ===============================
          📋 TABLE (UNCHANGED UI)
      =============================== */}
      <div className="overflow-x-auto bg-white rounded-lg border shadow-sm">
        {!filteredOrders.length ? (
          <div className="p-6 text-center text-gray-500">No orders found.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleAll}
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
              {filteredOrders.map((o) => {
                const locked =
                  o.status === "delivered" || o.status === "cancelled";
                const canSendCourier =
                  o.status === "ready_to_delivery" &&
                  !o.trackingId &&
                  tabStatus === "ready_to_delivery";

                return (
                  <tr key={o._id} className="border-t hover:bg-gray-50">
                    <td className="p-3 align-top">
                      <input
                        type="checkbox"
                        checked={selected.includes(o._id)}
                        onChange={() => toggleOne(o._id)}
                        disabled={locked}
                      />
                    </td>

                    {/* 👇 UI EXACTLY AS BEFORE */}
                    <td className="p-3 align-top">
                      <div className="font-mono text-xs text-gray-500 break-all">
                        #{o._id}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(o.createdAt).toLocaleString()}
                      </div>
                    </td>

                    <td className="p-3 align-top">
                      <div className="font-semibold">{o.billing?.name}</div>
                      <div className="text-gray-600">{o.billing?.phone}</div>
                      <div className="text-xs text-gray-500">
                        {o.billing?.address}
                      </div>
                    </td>

                    <td className="p-3 align-top w-[340px]">
                      <div className="space-y-2">
                        {o.items?.map((it, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 rounded-xl border bg-white p-2"
                          >
                            <img
                              src={it.image || "/placeholder.png"}
                              className="w-10 h-10 rounded-lg border"
                            />
                            <div>
                              <p className="text-sm font-semibold truncate">
                                {it.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                Qty: {it.qty} • ৳{it.price}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="p-3 align-top">
                      <div>Subtotal: ৳{o.subtotal}</div>
                      <div>Delivery: ৳{o.deliveryCharge}</div>
                      {!!o.discount && <div>Discount: -৳{o.discount}</div>}
                      <div className="font-semibold">Total: ৳{o.total}</div>
                    </td>

                    <td className="p-3 align-top">
                      <Badge>{o.paymentMethod?.toUpperCase()}</Badge>
                    </td>

                    <td className="p-3 align-top">
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
                        onChange={(e) => handleChange(o._id, e.target.value)}
                        disabled={locked || updatingId === o._id}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </td>

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

                        {canSendCourier && (
                          <button
                            onClick={() => onSendCourier(o)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Send to Courier
                          </button>
                        )}
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
