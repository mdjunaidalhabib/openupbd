export default function Badge({ children, type }) {
  const base =
    "inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold border";

  const colors = {
    pending: "border-yellow-300 text-yellow-700 bg-yellow-50",
    ready_to_delivery: "border-blue-300 text-blue-700 bg-blue-50",
    send_to_courier: "border-purple-300 text-purple-700 bg-purple-50",
    delivered: "border-green-300 text-green-700 bg-green-50",
    cancelled: "border-red-300 text-red-700 bg-red-50",
  };

  return (
    <span
      className={`${base} ${
        colors[type] || "border-gray-300 text-gray-700 bg-gray-50"
      }`}
    >
      {children}
    </span>
  );
}
