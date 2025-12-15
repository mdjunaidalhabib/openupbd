export default function OrderTotals({ order }) {
  return (
    <td className="p-3 align-top">
      <div>Subtotal: ৳{order.subtotal}</div>
      <div>Delivery: ৳{order.deliveryCharge}</div>

      {!!order.discount && <div>Discount: -৳{order.discount}</div>}

      <div className="font-semibold">Total: ৳{order.total}</div>
    </td>
  );
}
