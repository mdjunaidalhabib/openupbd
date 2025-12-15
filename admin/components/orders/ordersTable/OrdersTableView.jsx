import OrderRow from "./OrderRow";

export default function OrdersTableView({
  orders,
  bulkEnabled,
  selected,
  toggleOne,
  ...handlers
}) {
  if (!orders.length) {
    return (
      <div className="p-6 text-center text-gray-500">No orders found.</div>
    );
  }

  return (
    <table className="min-w-full text-sm">
      <thead className="bg-gray-100">
        <tr>
          <th className="p-3" />
          <th className="p-3 text-left">Order</th>
          <th className="p-3 text-left">Customer</th>
          <th className="p-3 text-left">Items</th>
          <th className="p-3 text-left">Totals</th>
          <th className="p-3 text-left">Payment</th>
          <th className="p-3 text-left">Status</th>
          <th className="p-3 text-left">Actions</th>
        </tr>
      </thead>

      <tbody>
        {orders.map((o) => (
          <OrderRow
            key={o._id}
            order={o}
            selected={selected}
            toggleOne={toggleOne}
            bulkEnabled={bulkEnabled}
            {...handlers}
          />
        ))}
      </tbody>
    </table>
  );
}
