"use client";
import { useUser } from "../../../context/UserContext";
import Image from "next/image";
import { FaUser } from "react-icons/fa";
import { useEffect, useState } from "react";
import { apiFetch } from "../../../utils/api";

export default function ProfilePage() {
  const { me, setMe, loadingUser } = useUser();
  const [orderCount, setOrderCount] = useState(0);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (me?.userId) {
      (async () => {
        try {
          const data = await apiFetch(`/api/orders?userId=${me.userId}`);
          setOrderCount(data.length || 0);
        } catch (err) {
          console.error("❌ Failed to fetch orders:", err);
        } finally {
          setLoadingOrders(false);
        }
      })();
    }
  }, [me]);

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-500 mb-4">You are not logged in</p>
        <a
          href="/"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go Home
        </a>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setMe(null);
    window.location.href = "/";
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white shadow rounded">
      <div className="flex items-center gap-4 mb-6">
        {me.avatar ? (
          <Image
            src={me.avatar}
            alt={me.name}
            width={80}
            height={80}
            className="rounded-full"
          />
        ) : (
          <FaUser className="w-16 h-16 text-gray-400" />
        )}
        <div>
          <h1 className="text-2xl font-bold">{me.name}</h1>
          <p className="text-gray-600">{me.email}</p>
        </div>
      </div>

      <div className="border-t pt-4 space-y-2">
        <p>
          <strong>User ID:</strong> {me.userId}
        </p>
        <p>
          <strong>Joined:</strong>{" "}
          {me.createdAt ? new Date(me.createdAt).toLocaleDateString() : "N/A"}
        </p>
        <p>
          <strong>Total Orders:</strong>{" "}
          {loadingOrders ? "Loading..." : orderCount}
        </p>
      </div>

      {/* ✅ Logout button */}
      <div className="mt-6">
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
