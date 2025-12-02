export default function Badge({ children, type = "default" }) {
  const base = "inline-block rounded px-2 py-0.5 text-xs border";
  const colors = {
    pending: "border-yellow-300 text-yellow-700 bg-yellow-50",
    confirmed: "border-blue-300 text-blue-700 bg-blue-50",
    processing: "border-indigo-300 text-indigo-700 bg-indigo-50",
    shipped: "border-cyan-300 text-cyan-700 bg-cyan-50",
    delivered: "border-green-300 text-green-700 bg-green-50",
    cancelled: "border-red-300 text-red-700 bg-red-50",
    default: "border-gray-300 text-gray-700 bg-gray-50",
  };
  return <span className={`${base} ${colors[type] || colors.default}`}>{children}</span>;
}
