export default function OrderInfo({ order }) {
  return (
    <td className="p-3 align-top">
      <div className="font-mono text-xs text-gray-500 break-all">
        #{order._id}
      </div>
      <div className="text-xs text-gray-500">
        {new Date(order.createdAt).toLocaleString()}
      </div>
    </td>
  );
}
