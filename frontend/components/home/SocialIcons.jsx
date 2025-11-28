"use client";
import {
  FaFacebook,
  FaYoutube,
  FaWhatsapp,
  FaLinkedin,
  FaPhone,
} from "react-icons/fa";
import Link from "next/link";

const socialLinks = [
  {
    href: "https://wa.me/+8801788-563988",
    icon: <FaWhatsapp className="text-green-600 w-5 h-5" />,
    label: "WhatsApp",
    bg: "bg-green-100 border-green-300",
  },
  {
    href: "https://web.facebook.com/profile.php?id=61576316192170&rdid=C9yaZAxSQj0vTZBO#",
    icon: <FaFacebook className="text-blue-600 w-5 h-5" />,
    label: "Facebook",
    bg: "bg-blue-100 border-blue-300",
  },
  {
    href: "https://www.youtube.com/@hikmahit",
    icon: <FaYoutube className="text-red-600 w-5 h-5" />,
    label: "YouTube",
    bg: "bg-red-100 border-red-300",
  },

  {
    href: "/",
    icon: <FaLinkedin className="text-blue-700 w-5 h-5" />,
    label: "LinkedIn",
    bg: "bg-blue-50 border-blue-300",
  },
];

export default function SocialIcons() {
  return (
    <div className="w-full flex gap-4 my-2 py-2 flex-wrap ">
      {socialLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.label}
          className={`p-2 rounded-full border ${link.bg} hover:scale-110 sm:active:scale-95 transition-transform duration-300 shadow-sm hover:shadow-md active:scale-105 active:bg-green-200`}
        >
          {link.icon}
        </Link>
      ))}
    </div>
  );
}
