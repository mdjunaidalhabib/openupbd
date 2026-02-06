"use client";
import { useEffect, useState } from "react";
import Badge from "./Badge";

// Simple Modal Component
function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg p-4 max-w-lg w-full relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
          onClick={onClose}
        >
          ✖
        </button>
        {children}
      </div>
    </div>
  );
}

export default function CourierStatus({ trackingId, courier }) {
  const activeTrackingId = courier?.trackingId || trackingId;

  const [status, setStatus] = useState(courier?.status || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState(null);

  // Fetch current courier status
  useEffect(() => {
    if (!activeTrackingId) return;

    const fetchCourierStatus = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) throw new Error("NEXT_PUBLIC_API_URL is not defined");

        const url = `${apiUrl.replace(/\/$/, "")}/admin/api/courier/status?trackingId=${activeTrackingId}`;
        console.log("🌐 Fetching courier status:", url);

        const res = await fetch(url);
        if (!res.ok)
          throw new Error(`Failed to fetch courier status: ${res.status}`);

        const data = await res.json();
        console.log("✅ CourierStatus API response:", data);

        setStatus(data.status);
      } catch (err) {
        console.error("🚨 CourierStatus ERROR:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourierStatus();
  }, [activeTrackingId]);

  // Fetch live events for modal
  const fetchEvents = async () => {
    if (!activeTrackingId) return;

    setEventsLoading(true);
    setEventsError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) throw new Error("NEXT_PUBLIC_API_URL is not defined");

      const url = `${apiUrl.replace(/\/$/, "")}/admin/api/courier/live?trackingId=${activeTrackingId}`;
      console.log("🌐 Fetching live events:", url);

      const res = await fetch(url);
      if (!res.ok)
        throw new Error(`Failed to fetch live events: ${res.status}`);

      const data = await res.json();
      console.log("✅ Live events API response:", data);

      setEvents(data.events || []);
    } catch (err) {
      console.error("🚨 Live events fetch ERROR:", err);
      setEventsError(err.message);
    } finally {
      setEventsLoading(false);
    }
  };

  const openModal = () => {
    setModalOpen(true);
    fetchEvents();
  };

  const closeModal = () => setModalOpen(false);

  if (!activeTrackingId) {
    return (
      <div className="mt-1 text-[11px] text-gray-400">Courier not created</div>
    );
  }

  return (
    <div className="mt-1 flex items-center gap-2">
      {/* Current Status Badge */}
      {loading ? (
        <div className="text-[11px] text-gray-400">
          Loading courier status...
        </div>
      ) : error ? (
        <div className="text-[11px] text-red-500">Courier error: {error}</div>
      ) : (
        <Badge>
          🚚 {status?.replaceAll("_", " ").toUpperCase() || "IN REVIEW"}
        </Badge>
      )}

      {/* Live Tracking Button */}
      <button
        onClick={openModal}
        className="text-[11px] px-2 py- border rounded hover:bg-gray-100"
      >
        Live Tracking
      </button>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal}>
        <h3 className="text-sm font-semibold mb-2">Live Tracking</h3>
        {eventsLoading ? (
          <div className="text-sm text-gray-500">Loading events...</div>
        ) : eventsError ? (
          <div className="text-sm text-red-500">Error: {eventsError}</div>
        ) : events.length === 0 ? (
          <div className="text-sm text-gray-500">No events available yet.</div>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {events.map((e, idx) => (
              <li key={idx} className="text-sm border-l-2 border-blue-500 pl-2">
                <div className="font-semibold">
                  {e.status.replaceAll("_", " ").toUpperCase()}
                </div>
                {e.location && (
                  <div className="text-gray-500">{e.location}</div>
                )}
                <div className="text-gray-400 text-xs">
                  {new Date(e.timestamp).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
}
