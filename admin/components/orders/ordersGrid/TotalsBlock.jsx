export default function TotalsBlock({ order }) {
  return (
    <div className="rounded-md bg-gray-50 p-2 space-y-1">
      <div className="flex justify-between">
        <span>Subtotal</span>
        <span>৳{order.subtotal}</span>
      </div>
      <div className="flex justify-between">
        <span>Delivery</span>
        <span>৳{order.deliveryCharge}</span>
      </div>
      {!!order.discount && (
        <div className="flex justify-between text-red-600">
          <span>Discount</span>
          <span>-৳{order.discount}</span>
        </div>
      )}
      <div className="flex justify-between font-bold">
        <span>Total</span>
        <span>৳{order.total}</span>
      </div>
    </div>
  );
}
