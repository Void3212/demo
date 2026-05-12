import { useEffect, useMemo, useState } from "react";
import { useReservationUnits } from "../../hooks/useReservationUnits";
import { ReservationAPI, type Reservation, type WalkIn } from "../../api/reservationAPI";
import { type User } from "../data/users";

interface ReservationPageProps {
  onNavigateBack: () => void;
  user: User;
}

const timeSlots = Array.from({ length: 24 }, (_, index) => `${index.toString().padStart(2, "0")}:00`);

function formatDateLabel(dateString: string) {
  return new Date(dateString).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatDetailDate(dateString: string) {
  return new Date(dateString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ReservationPage({ onNavigateBack, user }: ReservationPageProps) {
  const { serviceCategories, unitsByService } = useReservationUnits();
  const [selectedService, setSelectedService] = useState<string>(serviceCategories[0]?.id ?? "billiard");
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("09:00");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<string>("visa");
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  const [walkIns, setWalkIns] = useState<WalkIn[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reservationError, setReservationError] = useState<string | null>(null);

  const items = unitsByService(selectedService);
  const selectedItemInfo = items.find((item) => item.id === selectedItem) ?? items[0];
  const serviceInfo = serviceCategories.find((service) => service.id === selectedService);

  useEffect(() => {
    if (items.length && !items.some((item) => item.id === selectedItem)) {
      setSelectedItem(items[0].id);
      setSelectedSlot("09:00");
    }
  }, [items, selectedItem]);

  // Helper function to check if a time slot overlaps with any walk-in
  const getWalkInForSlot = (slot: string): WalkIn | undefined => {
    return walkIns.find((walkin) => {
      if (walkin.date !== selectedDate || walkin.unitId !== selectedItem) return false;
      const slotHour = parseInt(slot.split(':')[0], 10);
      const startHour = parseInt(walkin.startTime.split(':')[0], 10);
      const endHour = parseInt(walkin.endTime.split(':')[0], 10);
      return slotHour >= startHour && slotHour < endHour;
    });
  };

  const reservedSlotMap = useMemo(
    () =>
      new Map(
        allReservations
          .filter((reservation) => reservation.date === selectedDate && reservation.unitId === selectedItem)
          .map((reservation) => [reservation.time, reservation] as [string, Reservation])
      ),
    [allReservations, selectedDate, selectedItem]
  );

  const selectedSlotReservation = reservedSlotMap.get(selectedSlot);
  const selectedSlotWalkIn = getWalkInForSlot(selectedSlot);

  useEffect(() => {
    const loadReservations = async () => {
      try {
        const data = await ReservationAPI.getAllReservations();
        setAllReservations(data);
      } catch (error) {
        console.error("Failed to load reservations:", error);
      }
    };

    // Load walk-ins from localStorage
    try {
      const storedWalkIns = localStorage.getItem('walkins');
      if (storedWalkIns) {
        setWalkIns(JSON.parse(storedWalkIns));
      }
    } catch (error) {
      console.error("Failed to load walk-ins:", error);
    }

    loadReservations();
  }, []);

  const handleReserve = async () => {
    const activeWalkIn = getWalkInForSlot(selectedSlot);
    if (!selectedItem || reservedSlotMap.has(selectedSlot) || activeWalkIn) {
      if (activeWalkIn) {
        setReservationError("This slot is blocked by a walk-in and is not available for reservation.");
      }
      return;
    }

    setIsSubmitting(true);
    setReservationError(null);

    try {
      const reservation = await ReservationAPI.createReservation(user.id, {
        date: selectedDate,
        time: selectedSlot,
        partySize: 1,
        specialRequests: `Reserved ${selectedItemInfo?.name} for ${serviceInfo?.label}`,
        unitId: selectedItemInfo?.id ?? "",
        unitName: selectedItemInfo?.name ?? "",
        serviceId: selectedService,
      });

      setAllReservations((prev) => [reservation, ...prev]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create reservation";
      setReservationError(message);
    } finally {
      setIsSubmitting(false);
    }
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
                  Choose your experience, reserve the best slot, and finish your booking with a quick confirmation.
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
                      onClick={() => {
                        setSelectedService(service.id);
                        setSelectedSlot("09:00");
                      }}
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
                        isSelected
                          ? "border-[#ff4d0d] bg-[#fff4eb] shadow-[0_22px_48px_rgba(255,122,5,0.2)]"
                          : "border-slate-200 bg-white hover:border-[#ff7a05]"
                      }`}
                    >
                      <div className="relative h-[170px] overflow-hidden bg-slate-100">
                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3 text-white">
                          <p className="text-base font-semibold">{item.name}</p>
                        </div>
                      </div>
                      <div className="space-y-2 bg-white px-5 py-5">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0f2c4f]">{item.name}</p>
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
              {formatDateLabel(selectedDate)}
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {timeSlots.map((slot) => {
              const reservation = reservedSlotMap.get(slot);
              const isReserved = Boolean(reservation);
              const isReservedByCurrentUser = reservation?.userId === user.id;
              const walkIn = getWalkInForSlot(slot);
              const isBlockedByWalkIn = Boolean(walkIn);
              const isDisabled = isReserved || isBlockedByWalkIn;
              const isSelected = selectedSlot === slot && !isDisabled;
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => !isDisabled && setSelectedSlot(slot)}
                  disabled={isDisabled}
                  className={`flex items-center justify-between rounded-[28px] border px-4 py-4 text-left text-sm font-semibold transition duration-200 ${
                    isReservedByCurrentUser
                      ? "border-[#34a853] bg-[#e7f7eb] text-[#1d6f30]"
                      : isReserved
                      ? "border-[#d71f2a] bg-[#fdecea] text-[#9f2a2c]"
                      : isBlockedByWalkIn
                      ? "border-[#d97706] bg-[#fff7e0] text-[#92400e]"
                      : isSelected
                      ? "border-[#ff7a05] bg-[#fff3e8] text-[#963f08] shadow-[0_12px_30px_rgba(255,122,5,0.16)]"
                      : "border-slate-200 bg-white text-slate-900 hover:border-[#ff7a05]"
                  }`}
                >
                  <span>{slot}</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      isReservedByCurrentUser
                        ? "bg-[#dcf5d8] text-[#1e682f]"
                        : isReserved
                        ? "bg-[#fecaca] text-[#9f2a2c]"
                        : isBlockedByWalkIn
                        ? "bg-[#ffe4b5] text-[#92400e]"
                        : "bg-[#ffedd5] text-[#b7501f]"
                    }`}
                  >
                    {isReservedByCurrentUser
                      ? "Your reservation"
                      : isReserved
                      ? "Taken"
                      : isBlockedByWalkIn
                      ? "Walk-in"
                      : "Open"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="rounded-[40px] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_rgba(0,0,0,0.08)] lg:p-8">
          <div className="rounded-[32px] bg-gradient-to-br from-[#ff7a05] to-[#dd4124] p-6 text-white shadow-[0_18px_45px_rgba(255,122,5,0.18)]">
            <p className="text-sm uppercase tracking-[0.35em] text-orange-100">Payment</p>
            <h2 className="mt-3 text-3xl font-semibold">Complete your booking</h2>
            <p className="mt-3 text-sm leading-6 text-orange-100/90">
              Secure your {serviceInfo?.label.toLowerCase()} reservation with the details below.
            </p>
          </div>

          <div className="mt-6 space-y-5">
            <div className="rounded-[28px] border border-slate-200 bg-[#fff7f0] p-4">
              <p className="text-sm uppercase tracking-[0.35em] text-[#b7501f]">Reservation details</p>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <p>
                  <span className="font-semibold text-slate-900">Date:</span> {formatDetailDate(selectedDate)}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Unit:</span> {selectedItemInfo?.name}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Slot:</span> {selectedSlot}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Status:</span>{' '}
                  {selectedSlotReservation
                    ? selectedSlotReservation.userId === user.id
                      ? "Reserved by you"
                      : "Taken"
                    : selectedSlotWalkIn
                    ? "Blocked by walk-in"
                    : "Available"}
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

            {reservationError && <p className="text-sm text-red-700">{reservationError}</p>}

            <button
              onClick={handleReserve}
              disabled={isSubmitting || reservedSlotMap.has(selectedSlot) || Boolean(selectedSlotWalkIn)}
              className="mt-5 w-full rounded-[28px] bg-[#ff7a05] px-6 py-4 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(255,122,5,0.22)] transition hover:bg-[#e66b00] disabled:cursor-not-allowed disabled:bg-[#f1c3a0]"
            >
              {selectedSlotWalkIn
                ? "Walk-in occupied"
                : reservedSlotMap.has(selectedSlot)
                ? "Slot reserved"
                : isSubmitting
                ? "Reserving..."
                : "Reserve now"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
