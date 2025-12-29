import { FaShoppingBag } from "react-icons/fa";
import QuantityController from "../home/QuantityController";
import CheckoutButton from "../home/CheckoutButton";

export default function PurchaseActions({
  product,
  cartKey,
  quantity,
  totalPrice,
  isOutOfStock,
  currentStock,
  updateCart,
  handleCheckout,
}) {
  return (
    <div className="space-y-3 pt-2 border-t border-gray-100">
      {!quantity ? (
        <div className="flex gap-4">
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={() => updateCart(cartKey, +1, currentStock)}
            className={`flex-1 h-12 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              isOutOfStock
                ? "bg-gray-200 cursor-not-allowed text-gray-400"
                : "bg-pink-600 text-white hover:bg-pink-700"
            }`}
          >
            <FaShoppingBag className="text-sm" />
            {isOutOfStock ? "Sold Out" : "Add to Cart"}
          </button>

          <div
            className={`flex-1 ${
              isOutOfStock ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <CheckoutButton
              product={product}
              productId={product._id}
              qty={1}
              onClick={handleCheckout}
              disabled={isOutOfStock}
              stock={currentStock}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-2xl">
          <div className="flex justify-center min-w-[110px]">
            <QuantityController
              qty={quantity}
              stock={currentStock}
              onChange={(change) => updateCart(cartKey, change, currentStock)}
              allowZero={true}
            />
          </div>

          <div className="text-center">
            <p className="text-blue-700 font-extrabold text-xl">
              ৳{totalPrice}
            </p>
          </div>

          <div
            className={`flex justify-end ${
              isOutOfStock ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <CheckoutButton
              product={product}
              productId={product._id}
              qty={quantity}
              onClick={handleCheckout}
              disabled={isOutOfStock}
              stock={currentStock}
            />
          </div>
        </div>
      )}
    </div>
  );
}
