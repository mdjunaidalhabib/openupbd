"use client";
import { useEffect } from "react";
import axios from "axios";

const VisitorTracker = () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const trackVisit = async () => {
      try {
        // 🔹 DEVICE DETECT
        const ua = navigator.userAgent;
        const isMobile =
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            ua,
          );
        const deviceType = isMobile ? "Mobile" : "Desktop";

        // 🔹 SAME TAB BLOCK 30 sec
        const lastHit = sessionStorage.getItem("last_hit_time");
        const now = Date.now();
        if (lastHit && now - parseInt(lastHit) < 30000) return;

        // 🔹 SEND TO API
        await axios.post(`${API_URL}/visit`, {
          deviceType,
        });

        sessionStorage.setItem("last_hit_time", now.toString());
        console.log("Visitor tracked:", deviceType);
      } catch (err) {
        console.log("Tracking failed:", err.message);
      }
    };

    if (API_URL) trackVisit();
    else console.warn("NEXT_PUBLIC_API_URL missing in .env");
  }, [API_URL]);

  return null;
};

export default VisitorTracker;
