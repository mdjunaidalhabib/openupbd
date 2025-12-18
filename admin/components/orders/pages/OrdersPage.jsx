"use client";

import { useState } from "react";
import useOrders from "../../../hooks/useOrders";

import OrdersGrid from "../ordersGrid/OrdersGrid";
import OrdersTable from "../ordersTable/OrdersTable";
import EditOrderModal from "../modals/EditOrderModal";
import OrdersSkeleton from "../../Skeleton/OrdersSkeleton";
import Toast from "../../Toast";

import ConfirmModal from "../modals/ConfirmModal";

export default function OrdersPage() {
  const API = process.env.NEXT_PUBLIC_API_URL;

const {
  filtered,
  loading,
  fetchOrders,

  deleting,
  handleDelete,

  toast,
  setToast,

  updateStatus,
  updateManyStatus,
  deleteMany,
  sendCourierDirect, // ✅ ADD THIS
  sendCourierMany,

  confirm,
  setConfirm,
} = useOrders(API);


  const [open, setOpen] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [form, setForm] = useState({
    status: "pending",
    paymentMethod: "cod",
    trackingId: "",
    cancelReason: "",
    billing: { name: "", phone: "", address: "" },
  });

  /* =======================
     🗑 DELETE CONFIRM ✅ FIXED
     ======================= */
  const confirmDelete = (order) => {
    setConfirm({
      title: "Delete Order",
      message: "আপনি কি নিশ্চিত এই order টি delete করতে চান?",
      danger: true,
      loading: deleting,
      onConfirm: () => handleDelete(order), // ✅ FIX
    });
  };

  /* =======================
     ✏️ EDIT ORDER
     ======================= */
  const openEdit = (order) => {
    setCurrentId(order._id);
    setForm({
      status: order.status,
      paymentMethod: order.paymentMethod,
      trackingId: order.trackingId || "",
      cancelReason: order.cancelReason || "",
      billing: order.billing,
    });
    setOpen(true);
  };

  /* =======================
     💾 UPDATE ORDER
     ======================= */
  const updateOrder = async (updatedForm) => {
    try {
      const res = await fetch(`${API}/admin/orders/${currentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedForm),
      });

      if (!res.ok) throw new Error("Update failed");
      fetchOrders();
      return { success: true };
    } catch (err) {
      setToast({ message: err.message, type: "error" });
      return { success: false };
    }
  };

  return (
    <div className="space-y-4 px-2 sm:px-4">
      {/* TOP BAR */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Orders</h1>
        <button
          onClick={fetchOrders}
          className="bg-gray-700 text-white px-4 py-2 rounded text-sm"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <OrdersSkeleton />
      ) : (
        <>
          <OrdersGrid
            orders={filtered}
            onEdit={openEdit}
            onDelete={confirmDelete}
            onStatusChange={updateStatus}
            onSendCourier={sendCourierDirect} // ✅ THIS WAS MISSING
            onBulkStatusChange={updateManyStatus}
            onBulkDelete={deleteMany}
            onBulkSendCourier={sendCourierMany}
          />

          <OrdersTable
            orders={filtered}
            onEdit={openEdit}
            onDelete={confirmDelete}
            onStatusChange={updateStatus}
            onSendCourier={sendCourierDirect} // ✅ THIS WAS MISSING
            onBulkStatusChange={updateManyStatus}
            onBulkDelete={deleteMany}
            onBulkSendCourier={sendCourierMany}
          />
        </>
      )}

      {/* EDIT MODAL */}
      <EditOrderModal
        open={open}
        form={form}
        setForm={setForm}
        onSave={() => updateOrder(form)}
        onClose={() => setOpen(false)}
      />

      {/* CONFIRM MODAL */}
      {confirm && (
        <ConfirmModal data={confirm} onClose={() => setConfirm(null)} />
      )}

      {/* TOAST */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
