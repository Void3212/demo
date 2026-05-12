import { useState } from "react";

interface ReservationPageProps {
  onNavigateBack: () => void;
}

type Table = {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
};

type ServiceCategory = {
  id: string;
  label: string;
  subtitle: string;
};

const serviceCategories: ServiceCategory[] = [
  { id: "billiard", label: "Billiard", subtitle: "4 tables" },
  { id: "karaoke", label: "Karaoke", subtitle: "3 machines" },
  { id: "darts", label: "Darts", subtitle: "3 boards" },
  { id: "basketball", label: "Basketball", subtitle: "2 courts" },
  { id: "function-room", label: "Function Room", subtitle: "1 room" },
];

const billiardTables: Table[] = [
  {
    id: "billiard-1",
    name: "Table 1",
    imageUrl: "https://via.placeholder.com/280x180.png?text=Table+1",
    description: "Corner table with soft lighting.",
  },
  {
    id: "billiard-2",
    name: "Table 2",
    imageUrl: "https://via.placeholder.com/280x180.png?text=Table+2",
    description: "Center pool table with premium cues.",
  },
  {
    id: "billiard-3",
    name: "Table 3",
    imageUrl: "https://via.placeholder.com/280x180.png?text=Table+3",
    description: "Large table with private seating.",
  },
  {
    id: "billiard-4",
    name: "Table 4",
    imageUrl: "https://via.placeholder.com/280x180.png?text=Table+4",
    description: "Cozy table near the bar.",
  },
];

const karaokeRooms: Table[] = [
  { id: "karaoke-1", name: "Room 1", imageUrl: "https://via.placeholder.com/280x180.png?text=Karaoke+1", description: "Private room for 8 guests." },
  { id: "karaoke-2", name: "Room 2", imageUrl: "https://via.placeholder.com/280x180.png?text=Karaoke+2", description: "Stage lighting and sound system." },
  { id: "karaoke-3", name: "Room 3", imageUrl: "https://via.placeholder.com/280x180.png?text=Karaoke+3", description: "Large seating lounge." },
];

const dartsBoards: Table[] = [
  { id: "darts-1", name: "Board 1", imageUrl: "https://via.placeholder.com/280x180.png?text=Darts+1", description: "Regulation electronic board." },
  { id: "darts-2", name: "Board 2", imageUrl: "https://via.placeholder.com/280x180.png?text=Darts+2", description: "Premium scoring system." },
  { id: "darts-3", name: "Board 3", imageUrl: "https://via.placeholder.com/280x180.png?text=Darts+3", description: "Cozy corner layout." },
];

const basketballCourts: Table[] = [
  { id: "basketball-1", name: "Court 1", imageUrl: "https://via.placeholder.com/280x180.png?text=Court+1", description: "Half-court with hoops." },
  { id: "basketball-2", name: "Court 2", imageUrl: "https://via.placeholder.com/280x180.png?text=Court+2", description: "Full-court arcade experience." },
];

const functionRoom: Table[] = [
  { id: "function-1", name: "Function Room", imageUrl: "https://via.placeholder.com/280x180.png?text=Function+Room", description: "Private event room with seating." },
];

const timeSlots = Array.from({ length: 24 }, (_, index) => `${index.toString().padStart(2, "0")}:00`);

const slotAvailability: Record<string, Record<string, boolean>> = {
  "billiard-1": {
    "9:00 AM": true,
    "10:00 AM": true,
    "11:00 AM": false,
    "12:00 PM": false,
    "1:00 PM": true,
    "2:00 PM": true,
    "3:00 PM": true,
    "4:00 PM": false,
    "5:00 PM": true,
    "6:00 PM": true,
    "7:00 PM": true,
    "8:00 PM": false,
    "9:00 PM": true,
  },
  "billiard-2": {
    "9:00 AM": true,
    "10:00 AM": false,
    "11:00 AM": true,
    "12:00 PM": true,
    "1:00 PM": false,
    "2:00 PM": true,
    "3:00 PM": true,
    "4:00 PM": true,
    "5:00 PM": false,
    "6:00 PM": true,
    "7:00 PM": true,
    "8:00 PM": true,
    "9:00 PM": false,
  },
  "billiard-3": {
    "9:00 AM": false,
    "10:00 AM": true,
    "11:00 AM": true,
    "12:00 PM": true,
    "1:00 PM": true,
    "2:00 PM": false,
    "3:00 PM": true,
    "4:00 PM": true,
    "5:00 PM": true,
    "6:00 PM": false,
    "7:00 PM": true,
    "8:00 PM": true,
    "9:00 PM": true,
  },
  "billiard-4": {
    "9:00 AM": true,
    "10:00 AM": true,
    "11:00 AM": true,
    "12:00 PM": false,
    "1:00 PM": true,
    "2:00 PM": true,
    "3:00 PM": false,
    "4:00 PM": true,
    "5:00 PM": true,
    "6:00 PM": true,
    "7:00 PM": false,
    "8:00 PM": true,
    "9:00 PM": true,
  },
  "karaoke-1": {
    "9:00 AM": true,
    "10:00 AM": true,
    "11:00 AM": true,
    "12:00 PM": true,
    "1:00 PM": false,
    "2:00 PM": true,
    "3:00 PM": true,
    "4:00 PM": true,
    "5:00 PM": false,
    "6:00 PM": true,
    "7:00 PM": true,
    "8:00 PM": true,
    "9:00 PM": false,
  },
  "karaoke-2": {
    "9:00 AM": true,
    "10:00 AM": false,
    "11:00 AM": true,
    "12:00 PM": true,
    "1:00 PM": true,
    "2:00 PM": true,
    "3:00 PM": false,
    "4:00 PM": true,
    "5:00 PM": true,
    "6:00 PM": true,
    "7:00 PM": false,
    "8:00 PM": true,
    "9:00 PM": true,
  },
  "karaoke-3": {
    "9:00 AM": false,
    "10:00 AM": true,
    "11:00 AM": true,
    "12:00 PM": true,
    "1:00 PM": true,
    "2:00 PM": true,
    "3:00 PM": true,
    "4:00 PM": true,
    "5:00 PM": true,
    "6:00 PM": false,
    "7:00 PM": true,
    "8:00 PM": true,
    "9:00 PM": true,
  },
  "darts-1": {
    "9:00 AM": true,
    "10:00 AM": true,
    "11:00 AM": false,
    "12:00 PM": true,
    "1:00 PM": true,
    "2:00 PM": true,
    "3:00 PM": true,
    "4:00 PM": true,
    "5:00 PM": false,
    "6:00 PM": true,
    "7:00 PM": true,
    "8:00 PM": true,
    "9:00 PM": false,
  },
  "darts-2": {
    "9:00 AM": true,
    "10:00 AM": true,
    "11:00 AM": true,
    "12:00 PM": false,
    "1:00 PM": true,
    "2:00 PM": true,
    "3:00 PM": true,
    "4:00 PM": false,
    "5:00 PM": true,
    "6:00 PM": true,
    "7:00 PM": true,
    "8:00 PM": true,
    "9:00 PM": true,
  },
  "darts-3": {
    "9:00 AM": false,
    "10:00 AM": true,
    "11:00 AM": true,
    "12:00 PM": true,
    "1:00 PM": true,
    "2:00 PM": true,
    "3:00 PM": true,
    "4:00 PM": true,
    "5:00 PM": true,
    "6:00 PM": false,
    "7:00 PM": true,
    "8:00 PM": true,
    "9:00 PM": true,
  },
  "basketball-1": {
    "9:00 AM": true,
    "10:00 AM": true,
    "11:00 AM": true,
    "12:00 PM": false,
    "1:00 PM": true,
    "2:00 PM": true,
    "3:00 PM": true,
    "4:00 PM": true,
    "5:00 PM": false,
    "6:00 PM": true,
    "7:00 PM": true,
    "8:00 PM": true,
    "9:00 PM": true,
  },
  "basketball-2": {
    "9:00 AM": true,
    "10:00 AM": false,
    "11:00 AM": true,
    "12:00 PM": true,
    "1:00 PM": true,
    "2:00 PM": true,
    "3:00 PM": false,
    "4:00 PM": true,
    "5:00 PM": true,
    "6:00 PM": false,
    "7:00 PM": true,
    "8:00 PM": true,
    "9:00 PM": true,
  },
  "function-1": {
    "9:00 AM": true,
    "10:00 AM": true,
    "11:00 AM": true,
    "12:00 PM": true,
    "1:00 PM": false,
    "2:00 PM": true,
    "3:00 PM": true,
    "4:00 PM": true,
    "5:00 PM": true,
    "6:00 PM": true,
    "7:00 PM": true,
    "8:00 PM": false,
    "9:00 PM": true,
  },
};

const convertSlotTo24Hour = (slot: string) => {
  const [time, period] = slot.split(" ");
  const [hour, minute] = time.split(":").map(Number);
  let normalizedHour = hour;
  if (period === "PM" && hour < 12) normalizedHour += 12;
  if (period === "AM" && hour === 12) normalizedHour = 0;
  return `${normalizedHour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
};

const normalizedSlotAvailability: Record<string, Record<string, boolean>> = Object.fromEntries(
  Object.entries(slotAvailability).map(([itemId, availability]) => [
    itemId,
    Object.fromEntries(
      Object.entries(availability).map(([slot, available]) => [convertSlotTo24Hour(slot), available])
    ),
  ])
);

const serviceItems: Record<string, Table[]> = {
  billiard: billiardTables,
  karaoke: karaokeRooms,
  darts: dartsBoards,
  basketball: basketballCourts,
  "function-room": functionRoom,
};

export default function ReservationPage({ onNavigateBack }: ReservationPageProps) {
  const [selectedService, setSelectedService] = useState<string>(serviceCategories[0].id);
  const [selectedItem, setSelectedItem] = useState<string>(billiardTables[0].id);
  const [selectedSlot, setSelectedSlot] = useState<string>("09:00");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<string>("visa");

  const items = serviceItems[selectedService];
  const selectedAvailability = normalizedSlotAvailability[selectedItem] ?? {};
  const selectedItemInfo = items.find((item) => item.id === selectedItem) ?? items[0];
  const serviceInfo = serviceCategories.find((service) => service.id === selectedService);

  const changeService = (serviceId: string) => {
    const nextItems = serviceItems[serviceId];
    setSelectedService(serviceId);
    setSelectedItem(nextItems[0].id);
    setSelectedSlot("09:00");
  };

  return (
    <div className="min-h-screen bg-[#f7ebdd] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1400px] gap-6 lg:grid-cols-[1.4fr_1fr_0.95fr]">
        <section className="rounded-[40px] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_rgba(0,0,0,0.08)] lg:p-10">
          <div className="flex flex-col gap-6">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-[#d94b1f]">Reservation Schedule</p>
                <h1 className="mt-2 text-5xl font-[Alegreya-Bold] tracking-[-0.03em] text-[#0f2c4f] sm:text-6xl">{serviceInfo?.label}</h1>
                <p className="mt-4 max-w-2xl text-sm text-slate-600 sm:text-base">
                  Choose your experience, reserve the best slot, and finish your booking with a quick payment.
                </p>
              </div>
              <button
                onClick={onNavigateBack}
                className="rounded-full bg-[#ff5f1f] px-6 py-4 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(255,95,31,0.22)] transition hover:bg-[#e64b12]"
              >
                Back to ordering
              </button>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-[#fff4eb] p-5 shadow-sm sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-[#d94b1f]">Service</p>
                  <h2 className="mt-2 text-3xl font-semibold text-slate-900">Choose a category</h2>
                </div>
                <div className="rounded-full bg-[#fff0e3] px-4 py-2 text-sm font-semibold text-[#b7501f] shadow-sm">
                  {serviceInfo?.subtitle}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {serviceCategories.map((service) => {
                  const isSelected = service.id === selectedService;
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => changeService(service.id)}
                      className={`rounded-full border px-5 py-3 text-left text-sm font-semibold transition ${
                        isSelected
                          ? "border-[#ff4d0d] bg-[#ff7a05] text-white shadow-[0_10px_30px_rgba(255,87,35,0.22)]"
                          : "border-slate-200 bg-white text-slate-700 hover:border-[#ff7a05] hover:bg-[#fff4ea]"
                      }`}
                    >
                      <div>{service.label}</div>
                      <div className="mt-1 text-xs text-slate-500">{service.subtitle}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-[#fff4eb] p-5 shadow-sm sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-[#b7501f]">Available units</p>
                  <h2 className="mt-2 text-3xl font-semibold text-slate-900">Select your {serviceInfo?.label.toLowerCase()}</h2>
                </div>
                <div className="rounded-full bg-[#fff0e3] px-4 py-2 text-sm font-semibold text-[#b7501f] shadow-sm">
                  {selectedItemInfo?.name}
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {items.map((item) => {
                  const isSelected = item.id === selectedItem;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedItem(item.id);
                        setSelectedSlot("09:00");
                      }}
                      className={`group overflow-hidden rounded-[28px] border p-0 text-left transition duration-300 ${
                        isSelected ? "border-[#ff4d0d] bg-[#fff4eb] shadow-[0_22px_48px_rgba(255,122,5,0.2)]" : "border-slate-200 bg-white hover:border-[#ff7a05]"
                      }`}
                    >
                      <div className="relative h-[170px] overflow-hidden bg-slate-100">
                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3 text-white">
                          <p className="text-base font-semibold">{item.name}</p>
                        </div>
                      </div>
                      <div className="space-y-2 bg-white px-5 py-5">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0a376e]">{item.name}</p>
                        <p className="text-sm leading-6 text-slate-600">{item.description}</p>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            isSelected ? "bg-[#ffedd5] text-[#b7501f]" : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {isSelected ? "Selected" : "Select"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </section>

        <section className="rounded-[40px] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_rgba(0,0,0,0.08)] lg:p-8">
          <div className="inline-flex items-center gap-3 rounded-full bg-[#fff0e3] px-4 py-2 text-sm font-semibold text-[#d94b1f] shadow-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff7a05]" />
            Time booking
          </div>

          <div className="mt-5">
            <h2 className="text-3xl font-semibold text-slate-900">Pick a slot</h2>
            <p className="mt-2 text-sm text-slate-600">Book the perfect time for your selected unit.</p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto] items-end">
            <div>
              <label className="block text-sm font-semibold text-slate-700">Choose date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="mt-3 w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#ff7a05] focus:ring-2 focus:ring-[#ffdcc6]/70"
              />
            </div>
            <div className="rounded-full bg-[#fff0e3] px-4 py-3 text-sm font-semibold text-[#b7501f] shadow-sm">
              {new Date(selectedDate).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {timeSlots.map((slot) => {
              const isOpen = selectedAvailability[slot] ?? true;
              const isSelected = selectedSlot === slot && isOpen;
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => isOpen && setSelectedSlot(slot)}
                  className={`flex items-center justify-between rounded-[28px] border px-4 py-4 text-left text-sm font-semibold transition duration-200 ${
                    isOpen
                      ? isSelected
                        ? "border-[#ff7a05] bg-[#fff3e8] text-[#963f08] shadow-[0_12px_30px_rgba(255,122,5,0.16)]"
                        : "border-slate-200 bg-white text-slate-900 hover:border-[#ff7a05]"
                      : "border-[#f5c2c7] bg-[#f8d7da] text-[#842029] opacity-90"
                  }`}
                >
                  <span>{slot}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isOpen ? "bg-[#ffedd5] text-[#b7501f]" : "bg-[#f5c2c7] text-[#842029]"}`}>
                    {isOpen ? "Open" : "Closed"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="rounded-[40px] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_rgba(0,0,0,0.08)] lg:p-8">
          <div className="rounded-[32px] bg-[#ff7a05] p-6 text-white shadow-[0_18px_45px_rgba(255,122,5,0.18)]">
            <p className="text-sm uppercase tracking-[0.35em] text-orange-100">Payment</p>
            <h2 className="mt-3 text-3xl font-semibold">Complete your booking</h2>
            <p className="mt-3 text-sm leading-6 text-orange-100/90">
              Confirm your {serviceInfo?.label.toLowerCase()} reservation with a secure payment method and your contact details.
            </p>
          </div>

          <div className="mt-6 space-y-5">
            <div className="rounded-[28px] border border-slate-200 bg-[#fff7f0] p-4">
              <p className="text-sm uppercase tracking-[0.35em] text-[#b7501f]">Reservation details</p>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <p>
                  <span className="font-semibold text-slate-900">Date:</span> {new Date(selectedDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Unit:</span> {selectedItemInfo?.name}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Slot:</span> {selectedSlot}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Status:</span> {selectedAvailability[selectedSlot] ?? true ? "Available" : "Unavailable"}
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              {[
                { id: "visa", label: "Visa" },
                { id: "mastercard", label: "Mastercard" },
                { id: "amex", label: "American Express" },
                { id: "discover", label: "Discover" },
              ].map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={`rounded-[24px] border px-4 py-4 text-left text-sm font-semibold transition ${
                    paymentMethod === method.id
                      ? "border-[#ff7a05] bg-[#fff2e4] text-[#963f08] shadow-[0_12px_30px_rgba(255,122,5,0.18)]"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-[#ff7a05]"
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700">Full name</label>
              <input className="w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#ff7a05] focus:ring-2 focus:ring-[#ffdcc6]/70" placeholder="Enter your name" />
              <label className="block text-sm font-semibold text-slate-700">Phone number</label>
              <input className="w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#ff7a05] focus:ring-2 focus:ring-[#ffdcc6]/70" placeholder="09xx xxx xxxx" />
              <label className="block text-sm font-semibold text-slate-700">Notes</label>
              <textarea rows={4} className="w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#ff7a05] focus:ring-2 focus:ring-[#ffdcc6]/70" placeholder="Add any requests or details" />
            </div>

            <button className="mt-5 w-full rounded-[28px] bg-[#ff7a05] px-6 py-4 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(255,122,5,0.22)] transition hover:bg-[#e66b00]">
              Reserve now
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
