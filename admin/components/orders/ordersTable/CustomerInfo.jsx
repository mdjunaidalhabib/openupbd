export default function CustomerInfo({ order }) {
  return (
    <td className="p-3 align-top">
      <div className="font-semibold">{order.billing?.name}</div>
      <div className="text-gray-600">{order.billing?.phone}</div>
      <div className="text-xs text-gray-500">{order.billing?.address}</div>
    </td>
  );
}
