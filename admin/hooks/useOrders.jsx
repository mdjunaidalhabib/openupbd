"use client";
import { useEffect, useMemo, useState } from "react";

export default function useOrders(API) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: "", q: "" });

  const [toast, setToast] = useState(null);

  // 🚚 Courier Modal
  const [courierModal, setCourierModal] = useState(null);
  const [courierSending, setCourierSending] = useState(false);

  // 🗑 Delete Modal
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // 🔹 Fetch Orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.status) params.append("status", filter.status);

      const res = await fetch(`${API}/admin/orders?${params.toString()}`);
      const data = await res.json();

      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setToast({ message: "⚠ Failed to load orders", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filter.status]);

  // 🔍 Search
  const filtered = useMemo(() => {
    if (!filter.q) return orders;

    const q = filter.q.toLowerCase();
    return orders.filter((o) => {
      return (
        o._id?.toLowerCase().includes(q) ||
        o.billing?.name?.toLowerCase().includes(q) ||
        o.billing?.phone?.toLowerCase().includes(q)
      );
    });
  }, [orders, filter.q]);

  // 🛑 Open courier modal
  const confirmCourierSend = (order) => {
    setCourierModal(order);
  };

  // 🚚 Final courier send
  const sendCourierNow = async () => {
    if (!courierModal) return;

    try {
      setCourierSending(true);

      const order = courierModal;

      const res = await fetch(`${API}/api/send-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice: order._id,
          name: order.billing?.name,
          phone: order.billing?.phone,
          address: order.billing?.address,
          cod_amount: order.total,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setToast({ message: "🚚 Sent to courier", type: "success" });
      setCourierModal(null);
      fetchOrders();
    } catch {
      setToast({ message: "❌ Courier sending failed", type: "error" });
    } finally {
      setCourierSending(false);
    }
  };

  // 🗑 Open delete modal
  const confirmDelete = (order) => setDeleteModal(order);

  const handleDelete = async () => {
    if (!deleteModal) return;

    setDeleting(true);

    try {
      const res = await fetch(`${API}/admin/orders/${deleteModal._id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      setToast({ message: "🗑 Order deleted", type: "success" });
      setDeleteModal(null);
      fetchOrders();
    } catch {
      setToast({ message: "❌ Delete failed", type: "error" });
    } finally {
      setDeleting(false);
    }
  };

  // ✏️ Update Status
  const updateStatus = async (id, newStatus) => {
    try {
      await fetch(`${API}/admin/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      setToast({ message: "✔ Status updated", type: "success" });

      setOrders((prev) =>
        prev.map((o) => (o._id === id ? { ...o, status: newStatus } : o))
      );
    } catch {
      setToast({ message: "❌ Status update failed", type: "error" });
    }
  };

  return {
    orders,
    filtered,
    loading,
    filter,
    setFilter,
    fetchOrders,

    // delete modal
    deleteModal,
    deleting,
    confirmDelete,
    handleDelete,
    setDeleteModal,

    // courier modal
    courierModal,
    courierSending,
    confirmCourierSend,
    sendCourierNow,
    setCourierModal,

    toast,
    setToast,

    updateStatus,
  };
}
