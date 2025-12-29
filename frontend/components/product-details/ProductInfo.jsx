import { FaStar, FaHeart, FaFire } from "react-icons/fa";
import VariantSelector from "./VariantSelector";

export default function ProductInfo({
  product,
  category,
  isOutOfStock,
  currentStock,
  soldCount,
  hasOldPrice,
  discountPct,
  isInWishlist,
  toggleWishlist,
  selectedColor,
  setSelectedColor,
}) {
  return (
    <div>
      <div className="flex justify-between items-start mb-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 leading-tight">
          {product.name}
        </h1>
      </div>

      <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">
        Category:{" "}
        <span className="text-gray-800">{category?.name || "N/A"}</span>
      </p>

      <div className="flex items-center gap-4 mb-3">
        <p
          className={`text-sm font-bold flex items-center gap-1 ${
            isOutOfStock ? "text-red-500" : "text-green-600"
          }`}
        >
          {isOutOfStock ? "✕ Out of Stock" : "✓ In Stock"}
          <span className="font-normal text-gray-400 ml-1">
            ({currentStock} left)
          </span>
        </p>

        <div className="h-4 w-[1px] bg-gray-200"></div>

        <div className="flex items-center gap-1.5 bg-orange-50 text-orange-600 px-3 py-1 rounded-full border border-orange-100">
          <FaFire className="text-[10px] animate-bounce" />
          <span className="text-xs font-bold">{soldCount} Sold</span>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-1">
          <div className="flex text-yellow-400 text-sm">
            {[...Array(5)].map((_, i) => (
              <FaStar
                key={i}
                className={i < (product.rating || 0) ? "" : "text-gray-200"}
              />
            ))}
          </div>

          <span className="text-xs font-bold text-gray-500 ml-1">
            ({product.rating || 0}/5)
          </span>
        </div>
      </div>

      <div className="md:my-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
            <p className="text-blue-600 font-extrabold text-4xl tracking-tight">
              ৳{product.price}
            </p>

            {hasOldPrice && (
              <p className="text-gray-400 text-sm font-medium">
                <span className="line-through decoration-gray-400 decoration-2">
                  ৳{product.oldPrice}
                </span>
              </p>
            )}

            {discountPct && (
              <span className="bg-pink-600/90 text-white px-2.5 py-1 rounded-full text-xs font-bold uppercase shadow-sm">
                {discountPct}% OFF
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => toggleWishlist(product._id)}
            className={`p-3 rounded-full shadow-md transition-all ${
              isInWishlist
                ? "bg-red-500 text-white"
                : "bg-white text-gray-400 hover:text-red-500"
            }`}
          >
            <FaHeart />
          </button>
        </div>

        {hasOldPrice && discountPct && (
          <p className="mt-1 text-sm text-emerald-600 font-semibold">
            You save ৳{product.oldPrice - product.price}
          </p>
        )}
      </div>

      <VariantSelector
        colors={product.colors}
        selectedColor={selectedColor}
        onSelect={setSelectedColor}
      />
    </div>
  );
}
