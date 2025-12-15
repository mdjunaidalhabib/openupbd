export default function CustomerBlock({ order }) {
  return (
    <div className="col-span-5 rounded-md bg-gray-50 p-2 space-y-1">
      <div className="text-[11px] font-bold">Customer</div>
      <div className="font-semibold">{order.billing?.name}</div>
      <div className="text-[11px]">{order.billing?.phone}</div>
      <div className="text-[11px] text-gray-600 line-clamp-2">
        {order.billing?.address}
      </div>
    </div>
  );
}
