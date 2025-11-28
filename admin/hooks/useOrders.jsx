"use client";

import { useEffect, useMemo, useState } from "react";

export default function useOrders(API) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: "", q: "" });
  const [sendingId, setSendingId] = useState(null);

  // 🔹 Fetch Orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.status) params.append("status", filter.status);
      const res = await fetch(`${API}/api/orders?${params.toString()}`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filter.status]);

  // 🔍 Search Filter
  const filtered = useMemo(() => {
    if (!filter.q) return orders;
    const q = filter.q.toLowerCase();
    return orders.filter((o) => {
      const idHit = o._id?.toLowerCase().includes(q);
      const nameHit = o.billing?.name?.toLowerCase().includes(q);
      const phoneHit = o.billing?.phone?.toLowerCase().includes(q);
      return idHit || nameHit || phoneHit;
    });
  }, [orders, filter.q]);

  // ✅ Send to Courier (Dynamic system)
  const sendToCourier = async (order) => {
    if (!confirm(`Send order ${order._id} to active courier?`)) return;
    try {
      setSendingId(order._id);
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
      if (!res.ok) throw new Error(data.message || "Failed to send order!");
      alert(data.message || "✅ Sent to Courier Successfully!");
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to send order!");
    } finally {
      setSendingId(null);
    }
  };

  // ✅ Update Order Status
  const updateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`${API}/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Status update failed");
      setOrders((prev) =>
        prev.map((o) => (o._id === id ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update status!");
    }
  };

  // ✅ Delete Order
  const deleteOrder = async (id) => {
    if (!confirm("Are you sure you want to delete this order?")) return;
    try {
      const res = await fetch(`${API}/api/orders/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      fetchOrders();
    } catch (e) {
      console.error(e);
      alert("Failed to delete order.");
    }
  };

  return {
    orders,
    filtered,
    loading,
    filter,
    setFilter,
    fetchOrders,
    sendingId,
    sendToCourier, // ✅ Updated function
    updateStatus,
    deleteOrder,
  };
}
