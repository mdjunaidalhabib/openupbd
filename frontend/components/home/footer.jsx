"use client";

import Link from "next/link";
import Image from "next/image";
import FooterSkeleton from "../skeletons/FooterSkeleton";
import { useEffect, useState } from "react";
import {
  FaFacebookF,
  FaYoutube,
  FaInstagram,
  FaTiktok,
  FaPhoneAlt,
  FaEnvelope,
  FaGlobe,
  FaMapMarkerAlt,
  FaUserCircle,
} from "react-icons/fa";

const iconMap = { FaFacebookF, FaYoutube, FaInstagram, FaTiktok };

const socialLinksData = [
  { icon: "FaFacebookF", url: "https://www.facebook.com/habibsfashion" },
  { icon: "FaYoutube", url: "https://youtube.com" },
  { icon: "FaInstagram", url: "https://instagram.com" },
  { icon: "FaTiktok", url: "https://tiktok.com" },
];

const quickLinksData = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/products" },
  { label: "Categories", href: "/categories" },
  { label: "Return & Refund", href: "/ReturnRefund" },
  { label: "FAQ", href: "/faq" },
];

export default function Footer() {
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    const apiUrl = `${apiBase}/api/footer`;
    const categoriesUrl = `${apiBase}/api/categories`;

    const fetchData = async () => {
      try {
        const [footerRes, categoriesRes] = await Promise.all([
          fetch(apiUrl, { signal: controller.signal }),
          fetch(categoriesUrl, { signal: controller.signal }),
        ]);

        const footerJson = await footerRes.json();
        const categoriesJson = await categoriesRes.json();

        setData(footerJson);

        const cats = Array.isArray(categoriesJson)
          ? categoriesJson
          : categoriesJson?.data || [];
        setCategories(cats);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("❌ Failed to load footer or categories", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, []);

  if (loading) return <FooterSkeleton />;
  if (!data) return null;

  const { brand = {}, contact = {}, copyrightText } = data;

  return (
    <footer className="bg-pink-100 text-gray-900 pt-10 pb-2 px-6 md:px-12 mb-14 md:mb-0">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* 1. Brand + About */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            {brand.logo && !imgError ? (
              <Image
                src={brand.logo}
                alt={brand.title || "Brand"}
                width={40}
                height={40}
                className="w-8 h-8 md:w-10 md:h-10 rounded-lg object-cover"
                onError={() => setImgError(true)}
                unoptimized
              />
            ) : (
              <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-pink-50 rounded-lg">
                <FaUserCircle className="text-gray-400 w-6 h-6" />
              </div>
            )}

            <span className="text-xl font-bold text-pink-600 block min-w-[100px] truncate">
              {brand.title || "Habib's Fashion"}
            </span>
          </div>

          <p className="text-sm mb-4">
            {brand.about || "Your fashion destination."}
          </p>

          <div className="flex gap-4 text-xl">
            {socialLinksData.map((s, idx) => {
              const Icon = iconMap[s.icon] || FaGlobe;
              return (
                <Link
                  key={idx}
                  href={s.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.icon}
                >
                  <Icon className="hover:text-pink-600" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* 2. Quick Links */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
          <ul className="space-y-2 text-sm">
            {quickLinksData.map((l, i) => (
              <li key={i}>
                <Link href={l.href} className="hover:text-pink-600">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* 3. Categories */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Categories</h2>
          <ul className="space-y-2 text-sm">
            {categories.length > 0 ? (
              categories.map((cat) => (
                <li key={cat._id || cat.name}>
                  <Link
                    href={`/categories/${cat._id}`}
                    className="hover:text-pink-600 block min-w-[100px] truncate"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))
            ) : (
              <li className="text-gray-600">No categories yet.</li>
            )}
          </ul>
        </div>

        {/* 4. Contact */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
          <ul className="space-y-2 text-sm">
            {contact.address && (
              <li className="flex items-center gap-2">
                <FaMapMarkerAlt />
                <a
                  href={`https://www.google.com/maps/search/${encodeURIComponent(
                    contact.address
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-pink-600"
                >
                  {contact.address}
                </a>
              </li>
            )}

            {contact.phone && (
              <li className="flex items-center gap-2">
                <FaPhoneAlt />
                <a
                  href={`tel:${contact.phone}`}
                  className="hover:text-pink-600"
                >
                  {contact.phone}
                </a>
              </li>
            )}

            {contact.email && (
              <li className="flex items-center gap-2">
                <FaEnvelope />
                <a
                  href={`mailto:${contact.email}`}
                  className="hover:text-pink-600"
                >
                  {contact.email}
                </a>
              </li>
            )}

            {contact.website && (
              <li className="flex items-center gap-2">
                <FaGlobe />
                <a
                  href={
                    contact.website.startsWith("http")
                      ? contact.website
                      : `https://${contact.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-pink-600"
                >
                  {contact.website}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      <hr className="border-t border-gray-400 mt-6" />

      <div className="mt-2 text-center text-xs text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis px-2">
        <span>© {new Date().getFullYear()} All Rights Reserved</span>
        <span className="mx-1 text-gray-400">•</span>
        <span className="text-gray-600">
          Developed by{" "}
          <a
            href="https://hikmahit.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-pink-600 hover:underline underline-offset-4"
          >
            Hikmah IT
          </a>
        </span>
      </div>
    </footer>
  );
}
