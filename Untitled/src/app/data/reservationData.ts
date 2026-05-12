export type ReservationServiceId = "billiard" | "karaoke" | "darts" | "basketball" | "function-room";

export interface ReservationServiceCategory {
  id: ReservationServiceId;
  label: string;
  subtitle: string;
}

export interface ReservationUnit {
  id: string;
  serviceId: ReservationServiceId;
  name: string;
  description: string;
  imageUrl: string;
  active: boolean;
}

const STORAGE_KEY = "chillingan-reservation-units";

export const reservationServiceCategories: ReservationServiceCategory[] = [
  { id: "billiard", label: "Billiard", subtitle: "4 tables" },
  { id: "karaoke", label: "Karaoke", subtitle: "3 rooms" },
  { id: "darts", label: "Darts", subtitle: "3 boards" },
  { id: "basketball", label: "Basketball", subtitle: "2 courts" },
  { id: "function-room", label: "Function Room", subtitle: "1 room" },
];

export const defaultReservationUnits: ReservationUnit[] = [
  {
    id: "billiard-1",
    serviceId: "billiard",
    name: "Table 1",
    description: "Corner table with soft lighting.",
    imageUrl: "https://via.placeholder.com/320x220.png?text=Table+1",
    active: true,
  },
  {
    id: "billiard-2",
    serviceId: "billiard",
    name: "Table 2",
    description: "Center pool table with premium cues.",
    imageUrl: "https://via.placeholder.com/320x220.png?text=Table+2",
    active: true,
  },
  {
    id: "billiard-3",
    serviceId: "billiard",
    name: "Table 3",
    description: "Large table with private seating.",
    imageUrl: "https://via.placeholder.com/320x220.png?text=Table+3",
    active: true,
  },
  {
    id: "billiard-4",
    serviceId: "billiard",
    name: "Table 4",
    description: "Cozy table near the bar.",
    imageUrl: "https://via.placeholder.com/320x220.png?text=Table+4",
    active: true,
  },
  {
    id: "karaoke-1",
    serviceId: "karaoke",
    name: "Room 1",
    description: "Private room for 8 guests.",
    imageUrl: "https://via.placeholder.com/320x220.png?text=Karaoke+1",
    active: true,
  },
  {
    id: "karaoke-2",
    serviceId: "karaoke",
    name: "Room 2",
    description: "Stage lighting and sound system.",
    imageUrl: "https://via.placeholder.com/320x220.png?text=Karaoke+2",
    active: true,
  },
  {
    id: "karaoke-3",
    serviceId: "karaoke",
    name: "Room 3",
    description: "Large seating lounge.",
    imageUrl: "https://via.placeholder.com/320x220.png?text=Karaoke+3",
    active: true,
  },
  {
    id: "darts-1",
    serviceId: "darts",
    name: "Board 1",
    description: "Regulation electronic board.",
    imageUrl: "https://via.placeholder.com/320x220.png?text=Darts+1",
    active: true,
  },
  {
    id: "darts-2",
    serviceId: "darts",
    name: "Board 2",
    description: "Premium scoring system.",
    imageUrl: "https://via.placeholder.com/320x220.png?text=Darts+2",
    active: true,
  },
  {
    id: "darts-3",
    serviceId: "darts",
    name: "Board 3",
    description: "Cozy corner layout.",
    imageUrl: "https://via.placeholder.com/320x220.png?text=Darts+3",
    active: true,
  },
  {
    id: "basketball-1",
    serviceId: "basketball",
    name: "Court 1",
    description: "Half-court with hoops.",
    imageUrl: "https://via.placeholder.com/320x220.png?text=Court+1",
    active: true,
  },
  {
    id: "basketball-2",
    serviceId: "basketball",
    name: "Court 2",
    description: "Full-court arcade experience.",
    imageUrl: "https://via.placeholder.com/320x220.png?text=Court+2",
    active: true,
  },
  {
    id: "function-1",
    serviceId: "function-room",
    name: "Function Room",
    description: "Private event room with seating.",
    imageUrl: "https://via.placeholder.com/320x220.png?text=Function+Room",
    active: true,
  },
];

export function loadReservationUnits(): ReservationUnit[] {
  if (typeof window === "undefined") {
    return defaultReservationUnits;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultReservationUnits));
      return defaultReservationUnits;
    }

    const parsed = JSON.parse(stored) as ReservationUnit[];
    if (!Array.isArray(parsed)) {
      throw new Error("Invalid reservation unit data");
    }
    return parsed;
  } catch {
    return defaultReservationUnits;
  }
}

export function saveReservationUnits(units: ReservationUnit[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(units));
}
