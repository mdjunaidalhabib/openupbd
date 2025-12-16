"use client";

import { useState } from "react";
import useOrders from "../../../hooks/useOrders";

import OrdersGrid from "../ordersGrid/OrdersGrid";
import OrdersTable from "../ordersTable/OrdersTable";
import EditOrderModal from "../EditOrderModal";
import OrdersSkeleton from "../../Skeleton/OrdersSkeleton";
import Toast from "../../Toast";

import ConfirmModal from "../modals/ConfirmModal";
import DeleteOrderModal from "../modals/DeleteOrderModal";
import CourierModal from "../modals/CourierModal";

export default function OrdersPage() {
  const API = process.env.NEXT_PUBLIC_API_URL;

  const {
    filtered,
    loading,
    fetchOrders,

    deleteModal,
    deleting,
    handleDelete,
    setDeleteModal,

    courierModal,
    courierSending,
    sendCourierNow,
    setCourierModal,

    toast,
    setToast,

    updateStatus,
    updateManyStatus,
    deleteMany,
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
            onDelete={setDeleteModal}
            onStatusChange={updateStatus}
            onSendCourier={setCourierModal}
            onBulkStatusChange={updateManyStatus}
            onBulkDelete={deleteMany}
            onBulkSendCourier={sendCourierMany}
          />

          <OrdersTable
            orders={filtered}
            onEdit={openEdit}
            onDelete={setDeleteModal}
            onStatusChange={updateStatus}
            onSendCourier={setCourierModal}
            onBulkStatusChange={updateManyStatus}
            onBulkDelete={deleteMany}
            onBulkSendCourier={sendCourierMany}
          />
        </>
      )}

      <EditOrderModal
        open={open}
        form={form}
        setForm={setForm}
        onSave={() => updateOrder(form)}
        onClose={() => setOpen(false)}
      />

      <DeleteOrderModal
        order={deleteModal}
        deleting={deleting}
        onCancel={() => setDeleteModal(null)}
        onConfirm={handleDelete}
      />

      <CourierModal
        order={courierModal}
        sending={courierSending}
        onCancel={() => setCourierModal(null)}
        onConfirm={sendCourierNow}
      />

      {confirm && (
        <ConfirmModal data={confirm} onClose={() => setConfirm(null)} />
      )}

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
