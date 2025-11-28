"use client";
import { useEffect, useState } from "react";

export default function CourierSettingsPage() {
  const API = process.env.NEXT_PUBLIC_API_URL;
  const [couriers, setCouriers] = useState([]);
  const [activeCourier, setActiveCourier] = useState(null);
  const [form, setForm] = useState({
    courier: "steadfast",
    merchantName: "",
    apiKey: "",
    secretKey: "",
    baseUrl: "",
  });
  const [loading, setLoading] = useState(false);

  // 🔹 Load couriers and active courier separately
  const fetchCouriers = async () => {
    try {
      const [courierRes, activeRes] = await Promise.all([
        fetch(`${API}/api/courier-settings`),
        fetch(`${API}/api/active-courier`),
      ]);

      const list = await courierRes.json();
      const active = await activeRes.json();

      setCouriers(Array.isArray(list) ? list : []);
      setActiveCourier(active || null);
    } catch (e) {
      console.error("Fetch error:", e);
    }
  };

  useEffect(() => {
    fetchCouriers();
  }, []);

  // 🔹 Save or update courier
  const saveCourier = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/courier-settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      alert(data.message);
      await fetchCouriers();
      setForm({
        courier: "steadfast",
        merchantName: "",
        apiKey: "",
        secretKey: "",
        baseUrl: "",
      });
    } catch (err) {
      console.error(err);
      alert("❌ Failed to save courier!");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Set active courier (Only one active allowed)
  const setActive = async (courier, merchantName) => {
    if (!confirm(`Activate ${courier} (${merchantName})?`)) return;
    try {
      const res = await fetch(`${API}/api/set-active-courier`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courier, merchantName }),
      });
      const data = await res.json();

      if (!res.ok)
        throw new Error(data.message || "Failed to activate courier");

      alert(data.message);

      // ✅ Re-fetch active courier immediately (to update UI instantly)
      const activeRes = await fetch(`${API}/api/active-courier`);
      const active = await activeRes.json();
      setActiveCourier(active);

      // ✅ Refresh the courier list too
      const courierRes = await fetch(`${API}/api/courier-settings`);
      const list = await courierRes.json();
      setCouriers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      alert("❌ Could not set active courier!");
    }
  };

  // 🔹 Delete courier
  const deleteCourier = async (id) => {
    if (!confirm("Are you sure you want to delete this courier?")) return;
    try {
      const res = await fetch(`${API}/api/courier-settings/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      alert(data.message);
      await fetchCouriers();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to delete courier!");
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">🚚 Courier Settings</h2>

      {/* Form */}
      <div className="bg-white p-4 rounded-lg shadow border space-y-3">
        <h3 className="text-lg font-semibold">Add / Update Courier</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Courier</label>
            <select
              className="w-full border rounded p-2"
              value={form.courier}
              onChange={(e) => setForm({ ...form, courier: e.target.value })}
            >
              <option value="steadfast">Steadfast</option>
              <option value="pathao">Pathao</option>
              <option value="redx">RedX</option>
              <option value="ecourier">eCourier</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Merchant Name</label>
            <input
              className="w-full border rounded p-2"
              placeholder="Merchant name"
              value={form.merchantName}
              onChange={(e) =>
                setForm({ ...form, merchantName: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium">API Key</label>
            <input
              className="w-full border rounded p-2"
              placeholder="Enter API Key"
              value={form.apiKey}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Secret Key</label>
            <input
              className="w-full border rounded p-2"
              placeholder="Enter Secret Key"
              value={form.secretKey}
              onChange={(e) => setForm({ ...form, secretKey: e.target.value })}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Base URL</label>
            <input
              className="w-full border rounded p-2"
              placeholder="https://portal.packzy.com/api/v1"
              value={form.baseUrl}
              onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
            />
          </div>
        </div>

        <button
          onClick={saveCourier}
          disabled={loading}
          className={`${
            loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          } text-white px-4 py-2 rounded mt-3`}
        >
          {loading ? "Saving..." : "Save Courier"}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <h3 className="text-lg font-semibold mb-3">Courier Accounts</h3>
        <table className="w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Courier</th>
              <th className="p-2 text-left">Merchant</th>
              <th className="p-2 text-left">Base URL</th>
              <th className="p-2 text-center">Active</th>
              <th className="p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {couriers.map((c) => {
              const isActive =
                activeCourier?.courier?.toLowerCase() ===
                  c.courier?.toLowerCase() &&
                activeCourier?.merchantName === c.merchantName;

              return (
                <tr
                  key={c._id}
                  className={`border-t ${
                    isActive ? "bg-green-50 border-green-400" : ""
                  }`}
                >
                  <td className="p-2 font-medium">{c.courier}</td>
                  <td className="p-2">{c.merchantName}</td>
                  <td className="p-2 text-gray-600">{c.baseUrl}</td>
                  <td className="p-2 text-center">
                    {isActive ? (
                      <span className="text-green-600 font-semibold">
                        🟢 Active
                      </span>
                    ) : (
                      <span className="text-gray-500">Inactive</span>
                    )}
                  </td>
                  <td className="p-2 text-center">
                    {!isActive && (
                      <button
                        onClick={() => setActive(c.courier, c.merchantName)}
                        className="bg-indigo-600 text-white px-3 py-1 rounded text-xs hover:bg-indigo-700"
                      >
                        Set Active
                      </button>
                    )}
                    <button
                      onClick={() => deleteCourier(c._id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 ml-2"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
