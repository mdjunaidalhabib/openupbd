"use client";
import { useMemo, useState } from "react";

import useOrdersManager from "../hooks/useOrdersManager";
import StatusSummary from "./StatusSummary";
import BulkBar from "./BulkBar";
import OrderCard from "./OrderCard";
import ConfirmModal from "./ConfirmModal";

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
  const [confirm, setConfirm] = useState(null);

  const manager = useOrdersManager({
    orders,
    tabStatus,
  });

  const handleChange = async (id, payload) => {
    setUpdatingId(id);
    try {
      await onStatusChange(id, payload);
    } finally {
      setUpdatingId(null);
    }
  };

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

  return (
    <div className="md:hidden space-y-2">
      {/* STATUS SUMMARY */}
      <StatusSummary
        orders={orders || []}
        tabStatus={tabStatus}
        setTabStatus={setTabStatus}
        statusCount={statusCount}
      />

      {/* BULK BAR */}
      {manager.selected.length > 0 && (
        <BulkBar
          selected={manager.selected}
          selectedOrders={manager.selectedOrders}
          sameStatus={manager.sameStatus}
          bulkStatus={manager.bulkStatus}
          canBulkSendCourier={manager.canBulkSendCourier}
          setSelected={manager.setSelected}
          onStatusChange={onStatusChange}
          onBulkStatusChange={onBulkStatusChange}
          onBulkDelete={onBulkDelete}
          onBulkSendCourier={onBulkSendCourier}
          setConfirm={setConfirm}
        />
      )}

      {/* ORDER LIST */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        {manager.filteredOrders.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            No orders found.
          </div>
        ) : (
          <div className="divide-y">
            {manager.filteredOrders.map((o) => (
              <OrderCard
                key={o._id}
                o={o}
                expanded={openId === o._id}
                setOpenId={setOpenId}
                selected={manager.selected}
                toggleOne={manager.toggleOne}
                updatingId={updatingId}
                onStatusChange={handleChange}
                onEdit={onEdit}
                setConfirm={setConfirm}
              />
            ))}
          </div>
        )}
      </div>

      {/* CONFIRM MODAL */}
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
            manager.setSelected([]);
            setConfirm(null);
          }}
        />
      )}
    </div>
  );
}
