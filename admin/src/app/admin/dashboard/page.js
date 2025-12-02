"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";
import DashboardSkeleton from "../../../../components/Skeleton/DashboardSkeleton.jsx";

export default function DashboardPage() {
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSales: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
  });

  useEffect(() => {
    async function fetchOrders() {
      try {
        setErr("");
        setLoading(true);

        // ✅ cookie সহ request যাবে
        const res = await fetch(`${API}/admin/orders`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Orders fetch failed");
        }

        const data = await res.json();

        if (Array.isArray(data)) {
          setOrders(data);

          const totalOrders = data.length;
          const totalSales = data.reduce((sum, o) => sum + (o.total || 0), 0);
          const pendingOrders = data.filter(
            (o) => o.status === "pending"
          ).length;
          const deliveredOrders = data.filter(
            (o) => o.status === "delivered"
          ).length;

          setStats({ totalOrders, totalSales, pendingOrders, deliveredOrders });
        } else {
          setOrders([]);
        }
      } catch (error) {
        console.error("Failed to fetch orders:", error);
        setErr("❌ Orders load করা যায়নি");
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [API]);

  // ====== chart data calculations (ag er motoi) ======
  const salesData = (() => {
    const last7 = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      last7[key] = 0;
    }
    orders.forEach((o) => {
      const key = o.createdAt?.slice(0, 10);
      if (last7[key] !== undefined) last7[key] += o.total || 0;
    });
    return Object.entries(last7).map(([date, total]) => ({ date, total }));
  })();

  const topProducts = (() => {
    const map = {};
    orders.forEach((o) => {
      o.items?.forEach((it) => {
        if (!map[it.productId]) {
          map[it.productId] = { name: it.name, qty: 0, revenue: 0 };
        }
        map[it.productId].qty += it.qty;
        map[it.productId].revenue += it.price * it.qty;
      });
    });
    return Object.values(map)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  })();

  const monthlySales = (() => {
    const map = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      map[key] = 0;
    }
    orders.forEach((o) => {
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      if (map[key] !== undefined) map[key] += o.total || 0;
    });
    return Object.entries(map).map(([month, sales]) => ({ month, sales }));
  })();

  return (
    <div className="space-y-6 p-3 sm:p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-bold">
          📊 Dashboard Overview
        </h1>
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm shadow hover:scale-105 transition-all"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : err ? (
        <div className="bg-white shadow rounded-xl p-6 text-red-500">{err}</div>
      ) : (
        <>
          {/* 🔹 Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Total Orders",
                value: stats.totalOrders,
                color: "from-indigo-500 to-blue-500",
              },
              {
                label: "Total Sales (৳)",
                value: stats.totalSales,
                color: "from-green-500 to-emerald-500",
              },
              {
                label: "Pending Orders",
                value: stats.pendingOrders,
                color: "from-yellow-400 to-amber-500",
              },
              {
                label: "Delivered Orders",
                value: stats.deliveredOrders,
                color: "from-purple-500 to-indigo-600",
              },
            ].map((card, i) => (
              <div
                key={i}
                className={`bg-gradient-to-r ${card.color} text-white rounded-xl shadow-lg p-4 sm:p-5 hover:scale-[1.02] transition-all`}
              >
                <div className="text-sm opacity-80">{card.label}</div>
                <div className="text-xl sm:text-2xl font-bold mt-1">
                  {card.value}
                </div>
              </div>
            ))}
          </div>

          {/* 🏆 Top Products */}
          <div className="bg-white shadow rounded-xl p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4">
              🏆 Top Selling Products
            </h2>
            {topProducts.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 text-left">Product</th>
                        <th className="p-2 text-left">Quantity</th>
                        <th className="p-2 text-left">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts.map((p, idx) => (
                        <tr key={idx} className="border-t hover:bg-gray-50">
                          <td className="p-2">{p.name}</td>
                          <td className="p-2">{p.qty}</td>
                          <td className="p-2 font-medium text-green-600">
                            ৳{p.revenue}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProducts}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="qty" fill="#10b981" radius={[5, 5, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-10">
                No product data
              </div>
            )}
          </div>

          {/* 📈 Monthly Sales */}
          <div className="bg-white shadow rounded-xl p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4">
              📅 Monthly Sales (Last 12 Months)
            </h2>
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlySales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#6366f1"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
