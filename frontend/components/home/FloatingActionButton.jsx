"use client";
import React, { useState } from "react";
import {
  FaPhoneAlt,
  FaWhatsapp,
  FaFacebookMessenger,
  FaTimes,
  FaRegCommentDots,
} from "react-icons/fa";

const FloatingActionButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-18 right-4 flex flex-col items-center space-y-3 z-[9999]">
      {/* সোশ্যাল আইকনগুলো */}
      <div
        className={`flex flex-col items-center space-y-3 transition-all duration-300 ${
          open
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-5 pointer-events-none"
        }`}
      >
        {/* ফোন আইকন */}
        <a
          href="tel:+8801624114405"
          className={`bg-green-500 text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform ${
            open ? "animate-bounce delay-100" : ""
          }`}
        >
          <FaPhoneAlt size={22} />
        </a>

        {/* WhatsApp আইকন */}
        <a
          href="https://wa.me/8801624114405"
          target="_blank"
          rel="noopener noreferrer"
          className={`bg-[#25D366] text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform ${
            open ? "animate-bounce delay-200" : ""
          }`}
        >
          <FaWhatsapp size={22} />
        </a>

        {/* Messenger আইকন */}
        <a
          href="https://www.facebook.com/habibsfashion"
          target="_blank"
          rel="noopener noreferrer"
          className={`bg-[#0084FF] text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform ${
            open ? "animate-bounce delay-300" : ""
          }`}
        >
          <FaFacebookMessenger size={22} />
        </a>
      </div>

      {/* মূল বাটন */}
      <button
        onClick={() => setOpen(!open)}
        className="bg-pink-600 text-white p-3 rounded-full shadow-xl hover:bg-pink-700 transition-all duration-300 flex items-center justify-center transform-gpu z-[9999]"
        style={{ transition: "transform 0.6s ease-out" }}
      >
        <div
          className={`${
            open ? "rotate-180" : "rotate-0"
          } transition-all duration-500 ease-in-out`}
        >
          {open ? <FaTimes size={20} /> : <FaRegCommentDots size={20} />}
        </div>
      </button>
    </div>
  );
};

export default FloatingActionButton;
