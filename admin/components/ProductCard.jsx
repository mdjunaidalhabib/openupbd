export default function ProductCard({ product, onEdit, onDelete }) {
  return (
    <div className="border rounded-xl shadow-md p-4 flex flex-col bg-white hover:shadow-lg transition">
      {/* 🖼️ প্রোডাক্ট ছবি */}
      {product.image && (
        <div className="w-full h-40 overflow-hidden rounded-lg mb-3">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      {/* 📋 প্রোডাক্ট তথ্য */}
      <h2 className="font-semibold text-lg truncate text-gray-800">{product.name}</h2>

      <p className="text-gray-700 font-medium mt-1">
        ৳ {product.price}{" "}
        {product.oldPrice && (
          <span className="line-through text-sm text-gray-500 ml-1">
            ৳ {product.oldPrice}
          </span>
        )}
      </p>

      <p className="text-sm text-gray-500 mt-1">স্টক: {product.stock}</p>

      {product.category && (
        <p className="text-xs text-gray-400">{product.category.name}</p>
      )}

      {/* ⭐ রেটিং */}
      <div className="flex items-center gap-1 mt-2">
        <span className="text-yellow-500">⭐</span>
        <span className="text-sm font-medium text-gray-700">{product.rating || 0}</span>
      </div>

      {/* 🎯 বাটন */}
      <div className="mt-4 flex gap-2">
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
