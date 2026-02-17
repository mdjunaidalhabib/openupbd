"use client";
import { useEffect, useState } from "react";
import Badge from "./Badge";

function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800">
            📦 Tracking Updates
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Body (Scroll Removed) */}
        <div className="p-10">{children}</div>
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

  const displayStatus = (status || courier?.status || "unknown")
    .replaceAll("_", " ")
    .toUpperCase();

  /* ================= FETCH STATUS ================= */
  useEffect(() => {
    if (!activeTrackingId) return;

    const fetchCourierStatus = async () => {
      setLoading(true);
      setError(null);

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const url = `${apiUrl}/admin/api/courier/status?trackingId=${activeTrackingId}`;

        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json();

        setStatus(data?.status || "unknown");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourierStatus();
  }, [activeTrackingId]);

  /* ================= FETCH EVENTS ================= */
  const fetchEvents = async () => {
    if (!activeTrackingId) return;

    setEventsLoading(true);
    setEventsError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const url = `${apiUrl}/admin/api/courier/live?trackingId=${activeTrackingId}`;

      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();

      const sorted = Array.isArray(data?.events)
        ? [...data.events].sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
          )
        : [];

      setEvents(sorted);
    } catch (err) {
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
      <div className="mt-1 text-[12px] text-gray-400">Courier not created</div>
    );
  }

  return (
    <div className="mt-1 flex items-center gap-2">
      {loading ? (
        <div className="text-[12px] text-gray-400">Loading status...</div>
      ) : error ? (
        <div className="text-[12px] text-red-500">{error}</div>
      ) : (
        <Badge>🚚 {displayStatus}</Badge>
      )}

      <button
        onClick={openModal}
        className="text-[12px] px-2 py-0 rounded-md border bg-white hover:bg-gray-100 transition"
      >
        Live Tracking
      </button>

      <Modal isOpen={modalOpen} onClose={closeModal}>
        {eventsLoading ? (
          <div className="text-center text-gray-500">Loading timeline...</div>
        ) : eventsError ? (
          <div className="text-red-500 text-center">{eventsError}</div>
        ) : events.length === 0 ? (
          <div className="text-gray-500 text-center">
            No tracking updates available.
          </div>
        ) : (
          <div className="relative pl-6 border-l-2 border-gray-300 space-y-3">
            {events.map((e, idx) => {
              const message = e?.status || "Unknown update";
              const date = e?.timestamp
                ? new Date(e.timestamp).toLocaleString()
                : "—";

              return (
                <div key={idx} className="relative">
                  {/* Dot (smaller) */}
                  <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-[10px] shadow">
                    ✓
                  </div>

                  {/* Compact Card */}
                  <div className="bg-gray-50 border rounded-lg px-5 py-3 shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">{date}</div>

                    <div className="text-sm font-medium text-gray-800 leading-snug">
                      {message}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}
