export type BookingSource = "Direct" | "Booking.com" | "Expedia" | "Airbnb" | "Phone" | "Walk-in";

export const ROOM_TYPES = [
  { id: "STD", name: "Standard", color: "#3B82F6" },
  { id: "DLX", name: "Deluxe", color: "#8B5CF6" },
  { id: "PRM", name: "Premium", color: "#F59E0B" },
  { id: "STE", name: "Suite", color: "#10B981" },
];

export const RES_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  confirmed: { label: "Confirmed", bg: "#DBEAFE", text: "#1D4ED8" },
  checked_in: { label: "Checked In", bg: "#D1FAE5", text: "#065F46" },
  checked_out: { label: "Checked Out", bg: "#F3F4F6", text: "#374151" },
  cancelled: { label: "Cancelled", bg: "#FEE2E2", text: "#991B1B" },
  no_show: { label: "No Show", bg: "#FEF3C7", text: "#92400E" },
  pending: { label: "Pending", bg: "#FEF9C3", text: "#854D0E" },
};
