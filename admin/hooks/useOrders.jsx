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

  const [toast, setToast] = useState(null);

  // 🚚 Courier
  const [courierModal, setCourierModal] = useState(null);
  const [courierSending, setCourierSending] = useState(false);

  // 🗑 Delete
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
  // ✏️ UPDATE STATUS / ORDER (🔥 MAIN FIX)
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

      // ✅ MERGE UPDATED ORDER (NO REFRESH NEEDED)
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
  // 🚚 Courier
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

      // ✅ update locally
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
  // 🗑 Delete
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
  // RETURN
  // ===============================
  return {
    filtered,
    loading,
    filter,
    setFilter,

    fetchOrders,

    deleteModal,
    deleting,
    confirmDelete,
    handleDelete,
    setDeleteModal,

    courierModal,
    courierSending,
    confirmCourierSend,
    sendCourierNow,
    setCourierModal,

    toast,
    setToast,

    updateStatus, // ✅ now accepts full payload
  };
}
