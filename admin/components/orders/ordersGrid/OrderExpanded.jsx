import CustomerBlock from "./CustomerBlock";
import ItemsBlock from "./ItemsBlock";
import TotalsBlock from "./TotalsBlock";
import OrderActions from "./OrderActions";

export default function OrderExpanded(props) {
  const { order } = props;

  return (
    <div className="mt-2 space-y-3 text-xs text-gray-700">
      <div className="grid grid-cols-12 gap-2">
        <CustomerBlock order={order} />
        <ItemsBlock items={order.items || []} />
      </div>

      <TotalsBlock order={order} />

      <OrderActions {...props} />

      {order.status === "cancelled" && order.cancelReason && (
        <div className="text-red-700 text-[11px]">
          <b>Reason:</b> {order.cancelReason}
        </div>
      )}

      {order.trackingId && (
        <div className="text-[11px]">
          <b>Tracking:</b>{" "}
          <span className="text-indigo-600">{order.trackingId}</span>
        </div>
      )}
    </div>
  );
}
