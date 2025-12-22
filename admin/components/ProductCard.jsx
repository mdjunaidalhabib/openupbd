"use client";

export default function ProductCard({ product, onEdit, onDelete }) {
  const cat = product?.category;
  const isHidden = product?.isActive === false;

  // ১. ইমেজ লজিক: মেইন ইমেজ না থাকলে প্রথম কালারের প্রথম ছবি নিবে
  const displayImage =
    product.image ||
    (product.colors &&
      product.colors.length > 0 &&
      product.colors[0].images?.[0]);

  return (
    <div
      className={`relative border rounded-xl shadow-md p-4 flex flex-col transition
        ${isHidden ? "bg-gray-100 opacity-80" : "bg-white hover:shadow-lg"}
      `}
    >
      {/* 🖼️ প্রোডাক্ট ছবি (মেইন অথবা ভেরিয়েন্ট থেকে) */}
      <div className="w-full h-40 overflow-hidden rounded-lg mb-3 relative bg-gray-50">
        {displayImage ? (
          <img
            src={displayImage}
            alt={product.name}
            className={`w-full h-full object-cover transition-transform duration-300
              ${isHidden ? "brightness-90" : "hover:scale-105"}
            `}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            No Image
          </div>
        )}

        {/* ✅ Hidden Overlay */}
        {isHidden && (
          <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
            <span className="text-white text-sm font-semibold tracking-wide">
              Hidden Product
            </span>
          </div>
        )}

        {/* 🎨 কালার ডট প্রিভিউ (যদি ভেরিয়েন্ট থাকে) */}
        {product.colors?.length > 0 && (
          <div className="absolute bottom-2 left-2 flex gap-1 bg-white/70 p-1 rounded-full backdrop-blur-sm">
            {product.colors.slice(0, 4).map((c, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full border border-gray-300"
                style={{ backgroundColor: c.name.toLowerCase() }}
                title={c.name}
              />
            ))}
            {product.colors.length > 4 && (
              <span className="text-[8px] font-bold text-gray-600">+</span>
            )}
          </div>
        )}
      </div>

      {/* 📋 প্রোডাক্ট তথ্য */}
      <h2 className="font-semibold text-lg truncate text-gray-800">
        {product.name}
      </h2>

      <p className="text-gray-700 font-medium mt-1">
        ৳ {product.price}{" "}
        {product.oldPrice ? (
          <span className="line-through text-sm text-gray-500 ml-1">
            ৳ {product.oldPrice}
          </span>
        ) : null}
      </p>

      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-500 mt-1">স্টক: {product.stock}</p>
        <span className="text-[10px] sm:text-xs text-gray-500 ">
          Sold: {product.sold || 0}
        </span>
      </div>

      {/* ✅ Status Tags */}
      <div className="mt-1 flex items-center gap-2 text-[11px] flex-wrap">
        <span className="px-2 py-0.5 rounded bg-gray-100 border text-gray-700">
          Serial: {product.order || 0}
        </span>

        {product.colors?.length > 0 && (
          <span className="px-2 py-0.5 rounded bg-purple-100 border border-purple-200 text-purple-700 font-medium">
            {product.colors.length} Colors
          </span>
        )}

        {product.isActive ? (
          <span className="px-2 py-0.5 rounded bg-green-100 border text-green-700 font-semibold">
            Active
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded bg-gray-200 border text-gray-700 font-semibold">
            Hidden
          </span>
        )}
      </div>

      {/* ✅ Category */}
      {cat ? (
        <div className="mt-2 space-y-1">
          <p className="text-xs text-gray-500">
            ক্যাটাগরি:{" "}
            <span className="font-medium text-gray-800">{cat.name}</span>
          </p>
        </div>
      ) : (
        <p className="text-xs text-gray-400 mt-2">ক্যাটাগরি নেই</p>
      )}

      {/* ⭐ রেটিং */}
      <div className="flex items-center gap-1 mt-2">
        <span className="text-yellow-500">⭐</span>
        <span className="text-sm font-medium text-gray-700">
          {product.rating || 0}
        </span>
      </div>

      {/* 🎯 বাটন */}
      <div className="mt-auto pt-4 flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition"
        >
          ✏ সম্পাদনা
        </button>

        <button
          onClick={onDelete}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition"
        >
          🗑 মুছুন
        </button>
      </div>
    </div>
  );
}
