import { create } from "zustand";
import api from "@/lib/api";

export interface Room {
  id: string;
  number: string;
  status: string;
  typeId: string;
  typeName: string;
  basePrice: number;
  floor: number;
  capacity: number;
}

export interface Reservation {
  id: string;
  guestName: string;
  guestEmail: string;
  roomId: string;
  roomNumber: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  status: string;
  total: number;
  source: string;
  notes: string;
}

interface HotelState {
  rooms: Room[];
  reservations: Reservation[];
  loaded: boolean;
  loading: boolean;
  fetchData: () => Promise<void>;
  addReservation: (r: Reservation) => void;
}

export const useHotelStore = create<HotelState>((set, get) => ({
  rooms: [],
  reservations: [],
  loaded: false,
  loading: false,

  fetchData: async () => {
    if (get().loading) return;
    set({ loading: true });

    try {
      const [roomsData, reservationsData] = await Promise.all([
        api.rooms.list().catch(() => []),
        api.reservations.list().catch(() => ({ data: [] })),
      ]);

      // API returns { rooms: [...], byFloor: {...}, stats: {...} }
      const rawRooms = Array.isArray(roomsData) ? roomsData : (roomsData as any)?.rooms || [];
      const rooms: Room[] = rawRooms.map((r: any) => ({
        id: r.id,
        number: r.number || r.roomNumber || "",
        status: (r.status || "available").toLowerCase().replace(/_/g, "_"),
        typeId: r.roomType?.code || r.roomTypeId || "STD",
        typeName: r.roomType?.name || r.typeName || "Standard",
        basePrice: r.roomType?.basePrice ?? r.basePrice ?? 0,
        floor: r.floor ?? 1,
        capacity: r.roomType?.maxOccupancy ?? r.capacity ?? 2,
      }));

      // API returns { reservations: [...], pagination: {...} }
      const resList = Array.isArray(reservationsData) ? reservationsData : (reservationsData as any)?.reservations || (reservationsData as any)?.data || [];
      const reservations: Reservation[] = resList.map((r: any) => ({
        id: r.id || r.confirmationNumber || "",
        guestName: r.guest?.firstName && r.guest?.lastName
          ? `${r.guest.firstName} ${r.guest.lastName}`
          : r.guestName || "Guest",
        guestEmail: r.guest?.email || r.guestEmail || "",
        roomId: r.roomId || "",
        roomNumber: r.room?.number || r.roomNumber || "",
        roomType: r.room?.roomType?.name || r.roomType || "",
        checkIn: r.checkIn?.split("T")[0] || "",
        checkOut: r.checkOut?.split("T")[0] || "",
        nights: r.nights || 1,
        guests: r.adults || r.guests || 1,
        status: (r.status || "confirmed").toLowerCase(),
        total: Number(r.totalAmount ?? r.total ?? 0) || 0,
        source: r.source || r.channel || "Direct",
        notes: r.specialRequests || r.notes || "",
      }));

      set({ rooms, reservations, loaded: true, loading: false });
    } catch (err) {
      console.error("Failed to fetch hotel data:", err);
      set({ loading: false });
    }
  },

  addReservation: (r) =>
    set((state) => ({ reservations: [r, ...state.reservations] })),
}));
