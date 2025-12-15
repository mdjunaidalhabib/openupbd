"use client";
import { useMemo, useState } from "react";
import BulkActionBar from "./BulkActionBar";
import OrderCard from "./OrderCard";

export default function OrdersGrid(props) {
  const {
    orders,
    onStatusChange,
    onBulkStatusChange,
    onBulkDelete,
    onBulkSendCourier,
  } = props;

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

  const handleStatusChange = async (id, status) => {
    setUpdatingId(id);
    try {
      await onStatusChange(id, { status });
    } finally {
      setUpdatingId(null);
    }
  };

  const clearSelection = () => {
    setSelected([]);
    setBulkStatus("");
  };

  // 🟢 Mobile only empty state
  if (!orders?.length) {
    return (
      <div className="md:hidden p-6 text-center text-gray-500">
        No orders found.
      </div>
    );
  }

  return (
    // 🔴 md+ (Desktop) এ hide, শুধু Mobile এ show
    <div className="md:hidden space-y-2">
      {/* ===== Bulk Action (Mobile) ===== */}
      {bulkEnabled && selected.length > 0 && (
        <BulkActionBar
          selected={selected}
          selectedOrders={selectedOrders}
          bulkStatus={bulkStatus}
          setBulkStatus={setBulkStatus}
          onBulkStatusChange={onBulkStatusChange}
          onBulkDelete={onBulkDelete}
          onBulkSendCourier={onBulkSendCourier}
          clearSelection={clearSelection}
        />
      )}

      {/* ===== Orders Card List ===== */}
      <div className="rounded-xl border bg-white divide-y shadow-sm overflow-hidden">
        {orders.map((order) => (
          <OrderCard
            key={order._id}
            order={order}
            expanded={openId === order._id}
            toggle={() => setOpenId(openId === order._id ? null : order._id)}
            bulkEnabled={bulkEnabled}
            selected={selected.includes(order._id)}
            toggleOne={() => toggleOne(order._id)}
            updating={updatingId === order._id}
            onStatusChange={handleStatusChange}
            {...props}
          />
        ))}
      </div>
    </div>
  );
}
