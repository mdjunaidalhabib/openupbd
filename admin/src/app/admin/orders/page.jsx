"use client";

import { useState } from "react";
import useOrders from "../../../../hooks/useOrders";
import OrdersGrid from "../../../../components/orders/OrdersGrid";
import OrdersTable from "../../../../components/orders/OrdersTable";
import EditOrderModal from "../../../../components/orders/EditOrderModal";
import OrdersSkeleton from "../../../../components/Skeleton/OrdersSkeleton";
import Toast from "../../../../components/Toast";

export default function OrdersPage() {
  const API = process.env.NEXT_PUBLIC_API_URL;

  const {
    filtered,
    loading,
    fetchOrders,

    // delete
    deleteModal,
    deleting,
    confirmDelete,
    handleDelete,
    setDeleteModal,

    // courier
    courierModal,
    courierSending,
    confirmCourierSend,
    sendCourierNow,
    setCourierModal,

    // toast
    toast,
    setToast,

    updateStatus,
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
      status: order.status || "pending",
      paymentMethod: order.paymentMethod || "cod",
      trackingId: order.trackingId || "",
      cancelReason: order.cancelReason || "",
      billing: {
        name: order.billing?.name || "",
        phone: order.billing?.phone || "",
        address: order.billing?.address || "",
      },
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

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Update failed");

    fetchOrders();
    return { success: true }; // ✅ FIX
  } catch (err) {
    setToast({ message: err.message || "❌ Update failed", type: "error" });
    return { success: false }; // ✅ FIX
  }
};

  return (
    <div className="space-y-4 px-2 sm:px-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-bold">Orders</h1>

        <button
          onClick={fetchOrders}
          className="bg-gray-700 text-white px-4 py-2 rounded text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Table/Grid */}
      {loading ? (
        <OrdersSkeleton />
      ) : (
        <>
          <OrdersGrid
            orders={filtered}
            onEdit={openEdit}
            onDelete={confirmDelete}
            onStatusChange={updateStatus}
            onSendCourier={confirmCourierSend}
          />

          <OrdersTable
            orders={filtered}
            onEdit={openEdit}
            onDelete={confirmDelete}
            onStatusChange={updateStatus}
            onSendCourier={confirmCourierSend}
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

      {/* DELETE POPUP */}
      {deleteModal && (
        <>
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />
          <div className="fixed inset-0 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow">
              <h2 className="text-xl font-bold text-red-600 mb-3">
                ⚠ Delete Order
              </h2>

              <p className="mb-6">
                Are you sure you want to delete order{" "}
                <strong>{deleteModal._id}</strong>?
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteModal(null)}
                  className="px-4 py-2 border rounded"
                  disabled={deleting}
                >
                  Cancel
                </button>

                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* COURIER POPUP */}
      {courierModal && (
        <>
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />
          <div className="fixed inset-0 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow">
              <h2 className="text-xl font-bold text-blue-600 mb-3">
                🚚 Send to Courier
              </h2>

              <p className="mb-4">
                Send order <strong>{courierModal._id}</strong> to courier?
              </p>

              <div className="text-sm text-gray-600 mb-4">
                <p>
                  <strong>Name:</strong> {courierModal.billing?.name}
                </p>
                <p>
                  <strong>Phone:</strong> {courierModal.billing?.phone}
                </p>
                <p>
                  <strong>Total:</strong> ৳{courierModal.total}
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setCourierModal(null)}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>

                <button
                  onClick={sendCourierNow}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                  disabled={courierSending}
                >
                  {courierSending ? "Sending..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </>
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
