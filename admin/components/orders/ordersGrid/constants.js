export const STATUS_OPTIONS = [
  "pending",
  "ready_to_delivery",
  "send_to_courier",
  "delivered",
  "cancelled",
];

export const STATUS_LABEL = {
  pending: "PENDING",
  ready_to_delivery: "READY TO DELIVERY",
  send_to_courier: "SEND TO COURIER",
  delivered: "DELIVERED",
  cancelled: "CANCELLED",
};

export const STATUS_COLORS = {
  pending: "text-yellow-700 bg-yellow-50 ring-yellow-200",
  ready_to_delivery: "text-blue-700 bg-blue-50 ring-blue-200",
  send_to_courier: "text-purple-700 bg-purple-50 ring-purple-200",
  delivered: "text-green-700 bg-green-50 ring-green-200",
  cancelled: "text-red-700 bg-red-50 ring-red-200",
};
