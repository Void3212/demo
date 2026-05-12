/**
 * Example: Using the Reservation API in a React Component
 * 
 * This example shows how to integrate the reservation system with the backend API
 * Replace your current ReservationPage with this to use the database-backed system
 */

import { useEffect, useState } from 'react';
import { useReservations } from '../../hooks/useReservations';
import { getCurrentUser } from '../data/users';
import type { User } from '../data/users';

interface ExampleReservationPageProps {
  onNavigateBack: () => void;
}

export default function ExampleReservationPage({ onNavigateBack }: ExampleReservationPageProps) {
  const [user, setUser] = useState<User | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [partySize, setPartySize] = useState(4);
  const [specialRequests, setSpecialRequests] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { reservations, loading, error, createReservation, checkAvailability, deleteReservation } = useReservations({
    userId: user?.id,
    autoFetch: true,
  });

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Please log in first');
      return;
    }

    try {
      setIsSubmitting(true);

      // Check availability first
      const available = await checkAvailability(date, time, partySize);

      if (!available) {
        alert('Sorry, no availability for the selected date and time');
        return;
      }

      // Create reservation
      await createReservation({
        date,
        time,
        partySize,
        specialRequests: specialRequests || undefined,
      });

      alert('Reservation created successfully!');

      // Clear form
      setDate('');
      setTime('');
      setPartySize(4);
      setSpecialRequests('');
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to create reservation'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReservation = async (id: string) => {
    if (window.confirm('Are you sure you want to cancel this reservation?')) {
      try {
        await deleteReservation(id);
        alert('Reservation cancelled');
      } catch (err) {
        alert(`Error: ${err instanceof Error ? err.message : 'Failed to cancel reservation'}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold mb-6">Make a Reservation</h1>

          {user && <p className="mb-4 text-gray-600">Logged in as: {user.name}</p>}

          {error && <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

          <form onSubmit={handleCreateReservation} className="mb-8 space-y-4">
            <div>
              <label className="block font-medium mb-2">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-medium mb-2">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-medium mb-2">Party Size</label>
              <select
                value={partySize}
                onChange={(e) => setPartySize(parseInt(e.target.value))}
                className="w-full border rounded px-3 py-2"
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map((size) => (
                  <option key={size} value={size}>
                    {size} {size === 1 ? 'person' : 'people'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium mb-2">Special Requests (Optional)</label>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="e.g., window seat, high chair needed, dietary restrictions"
                className="w-full border rounded px-3 py-2"
                rows={3}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
            >
              {isSubmitting ? 'Creating...' : 'Create Reservation'}
            </button>

            <button
              type="button"
              onClick={onNavigateBack}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
            >
              Back to Ordering
            </button>
          </form>

          <div>
            <h2 className="text-2xl font-bold mb-4">Your Reservations</h2>

            {loading ? (
              <p className="text-gray-600">Loading reservations...</p>
            ) : reservations.length === 0 ? (
              <p className="text-gray-600">No reservations yet. Create one above!</p>
            ) : (
              <div className="space-y-4">
                {reservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="border rounded p-4 bg-gray-50 flex justify-between items-start"
                  >
                    <div>
                      <p className="font-medium">
                        {reservation.date} at {reservation.time}
                      </p>
                      <p className="text-sm text-gray-600">Party size: {reservation.partySize}</p>
                      {reservation.specialRequests && (
                        <p className="text-sm text-gray-600">Notes: {reservation.specialRequests}</p>
                      )}
                      <p className="text-sm font-medium mt-2">
                        Status:{' '}
                        <span className={`px-2 py-1 rounded text-xs ${
                          reservation.status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : reservation.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {reservation.status}
                        </span>
                      </p>
                    </div>
                    {reservation.status !== 'completed' && reservation.status !== 'cancelled' && (
                      <button
                        onClick={() => handleDeleteReservation(reservation.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
