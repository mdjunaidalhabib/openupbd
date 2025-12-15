import OrderHeader from "./OrderHeader";
import OrderExpanded from "./OrderExpanded";

export default function OrderCard({
  order,
  expanded,
  toggle,
  bulkEnabled,
  selected,
  toggleOne,
  updating,
  ...handlers
}) {
  const locked = order.status === "delivered" || order.status === "cancelled";

  const itemCount = order.items?.reduce((s, it) => s + (it.qty || 0), 0) || 0;

  return (
    <div className="px-3 py-2">
      <OrderHeader
        order={order}
        expanded={expanded}
        toggle={toggle}
        bulkEnabled={bulkEnabled}
        selected={selected}
        toggleOne={toggleOne}
        locked={locked}
        itemCount={itemCount}
      />

      {expanded && (
        <OrderExpanded
          order={order}
          locked={locked}
          updating={updating}
          {...handlers}
        />
      )}
    </div>
  );
}
