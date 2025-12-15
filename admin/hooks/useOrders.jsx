"use client";
import { useEffect, useMemo, useState } from "react";

export const STATUS_OPTIONS = [
  "pending",
  "ready_to_delivery",
  "send_to_courier",
  "delivered",
  "cancelled",
];

export default function useOrders(API) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: "", q: "" });

  // 🔔 Toast
  const [toast, setToast] = useState(null);

  // ❓ Confirmation modal
  const [confirm, setConfirm] = useState(null);

  // 🚚 Courier (single)
  const [courierModal, setCourierModal] = useState(null);
  const [courierSending, setCourierSending] = useState(false);

  // 🗑 Delete (single)
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ===============================
  // 🔔 Auto hide toast
  // ===============================
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // ===============================
  // 🔹 Fetch orders
  // ===============================
  const fetchOrders = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (filter.status) params.append("status", filter.status);

      const res = await fetch(`${API}/admin/orders?${params.toString()}`);
      const data = await res.json();

      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setToast({ message: "❌ Failed to load orders", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filter.status]);

  // ===============================
  // 🔍 Search
  // ===============================
  const filtered = useMemo(() => {
    if (!filter.q) return orders;
    const q = filter.q.toLowerCase();

    return orders.filter(
      (o) =>
        o._id?.toLowerCase().includes(q) ||
        o.billing?.name?.toLowerCase().includes(q) ||
        o.billing?.phone?.toLowerCase().includes(q)
    );
  }, [orders, filter.q]);

  // ===============================
  // ✏️ UPDATE STATUS (SINGLE)
  // ===============================
  const updateStatus = async (id, payload) => {
    try {
      const res = await fetch(`${API}/admin/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const updated = await res.json();
      if (!res.ok) throw new Error(updated?.error);

      setOrders((prev) =>
        prev.map((o) => (o._id === updated._id ? updated : o))
      );

      setToast({ message: "✔ Order updated", type: "success" });
      return updated;
    } catch (err) {
      setToast({
        message: err?.message || "❌ Update failed",
        type: "error",
      });
      throw err;
    }
  };

  // ===============================
  // ✏️ UPDATE STATUS (BULK) ✅ FIXED
  // ===============================
  const updateManyStatus = (ids, payload) =>
    setConfirm({
      title: "Update order status?",
      description: `Change status for ${ids.length} orders.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`${API}/admin/orders/bulk/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ids,
              status: payload.status,
              cancelReason: payload.cancelReason,
            }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error);

          // update local state
          setOrders((prev) =>
            prev.map((o) =>
              data.updated.includes(o._id)
                ? { ...o, status: payload.status }
                : o
            )
          );

          setToast({
            message: `✔ ${data.updated.length} orders updated`,
            type: "success",
          });
        } catch (err) {
          setToast({
            message: err.message || "❌ Bulk update failed",
            type: "error",
          });
        } finally {
          setConfirm(null);
        }
      },
    });

  // ===============================
  // 🚚 Courier (SINGLE)
  // ===============================
  const confirmCourierSend = (order) => setCourierModal(order);

  const sendCourierNow = async () => {
    if (!courierModal) return;

    try {
      setCourierSending(true);

      const res = await fetch(`${API}/api/send-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice: courierModal._id,
          name: courierModal.billing?.name,
          phone: courierModal.billing?.phone,
          address: courierModal.billing?.address,
          cod_amount: courierModal.total,
        }),
      });

      if (!res.ok) throw new Error();

      await updateStatus(courierModal._id, {
        status: "send_to_courier",
      });

      setCourierModal(null);
    } catch {
      setToast({ message: "❌ Courier sending failed", type: "error" });
    } finally {
      setCourierSending(false);
    }
  };

  // ===============================
  // 🚚 Courier (BULK) (still loop – courier API is single)
  // ===============================
  const sendCourierMany = (orders) =>
    setConfirm({
      title: "Send to courier?",
      description: `Send ${orders.length} orders to courier service.`,
      onConfirm: async () => {
        try {
          for (const o of orders) {
            if (o.status !== "ready_to_delivery" || o.trackingId) continue;

            await fetch(`${API}/api/send-order`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                invoice: o._id,
                name: o.billing?.name,
                phone: o.billing?.phone,
                address: o.billing?.address,
                cod_amount: o.total,
              }),
            });

            await updateStatus(o._id, { status: "send_to_courier" });
          }

          setToast({
            message: "🚚 Orders sent to courier",
            type: "success",
          });
        } catch {
          setToast({
            message: "❌ Courier sending failed",
            type: "error",
          });
        } finally {
          setConfirm(null);
        }
      },
    });

  // ===============================
  // 🗑 Delete (SINGLE)
  // ===============================
  const confirmDelete = (order) => setDeleteModal(order);

  const handleDelete = async () => {
    if (!deleteModal) return;

    try {
      setDeleting(true);

      const res = await fetch(`${API}/admin/orders/${deleteModal._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();

      setOrders((prev) => prev.filter((o) => o._id !== deleteModal._id));
      setToast({ message: "🗑 Order deleted", type: "success" });
      setDeleteModal(null);
    } catch {
      setToast({ message: "❌ Delete failed", type: "error" });
    } finally {
      setDeleting(false);
    }
  };

  // ===============================
  // 🗑 Delete (BULK) ✅ FIXED
  // ===============================
  const deleteMany = (ids) =>
    setConfirm({
      title: "Delete orders?",
      description: `${ids.length} orders will be permanently deleted.`,
      danger: true,
      confirmText: "Delete",
      onConfirm: async () => {
        try {
          const res = await fetch(`${API}/admin/orders/bulk/delete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error);

          setOrders((prev) => prev.filter((o) => !ids.includes(o._id)));
          setToast({
            message: `🗑 ${data.deletedCount} orders deleted`,
            type: "success",
          });
        } catch (err) {
          setToast({
            message: err.message || "❌ Bulk delete failed",
            type: "error",
          });
        } finally {
          setConfirm(null);
        }
      },
    });

  // ===============================
  // RETURN
  // ===============================
  return {
    filtered,
    loading,
    filter,
    setFilter,
    fetchOrders,

    // single
    updateStatus,
    confirmCourierSend,
    sendCourierNow,
    courierModal,
    courierSending,

    confirmDelete,
    handleDelete,
    deleteModal,
    deleting,

    // bulk
    updateManyStatus,
    deleteMany,
    sendCourierMany,

    // ui
    toast,
    setToast,
    confirm,
    setConfirm,
  };
}
