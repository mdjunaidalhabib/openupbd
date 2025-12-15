import OrderInfo from "./OrderInfo";
import CustomerInfo from "./CustomerInfo";
import OrderItems from "./OrderItems";
import OrderTotals from "./OrderTotals";
import OrderStatus from "./OrderStatus";
import OrderActions from "./OrderActions";

export default function OrderRow({
  order,
  selected,
  toggleOne,
  bulkEnabled,
  ...handlers
}) {
  const locked = order.status === "delivered" || order.status === "cancelled";

  return (
    <tr className="border-t hover:bg-gray-50">
      <td className="p-3 align-top">
        {bulkEnabled && (
          <input
            type="checkbox"
            checked={selected.includes(order._id)}
            onChange={() => toggleOne(order._id)}
            disabled={locked}
          />
        )}
      </td>

      <OrderInfo order={order} />
      <CustomerInfo order={order} />
      <OrderItems items={order.items} />
      <OrderTotals order={order} />
      <OrderStatus order={order} {...handlers} />
      <OrderActions order={order} {...handlers} />
    </tr>
  );
}
