import { useState, useCallback, useEffect } from 'react';
import { ReservationAPI, Reservation } from '../api/reservationAPI';

interface UseReservationsOptions {
  userId?: string;
  autoFetch?: boolean;
}

interface UseReservationsReturn {
  reservations: Reservation[];
  loading: boolean;
  error: string | null;
  createReservation: (data: {
    date: string;
    time: string;
    partySize: number;
    specialRequests?: string;
  }) => Promise<Reservation>;
  updateReservation: (id: string, updates: Partial<Reservation>) => Promise<Reservation | null>;
  deleteReservation: (id: string) => Promise<void>;
  checkAvailability: (date: string, time: string, partySize: number) => Promise<boolean>;
  refetch: () => Promise<void>;
}

/**
 * Hook for managing restaurant reservations
 * Provides CRUD operations and availability checking for reservations
 */
export function useReservations(options: UseReservationsOptions = {}): UseReservationsReturn {
  const { userId, autoFetch = true } = options;
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await ReservationAPI.getReservations(userId);
      setReservations(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch reservations';
      setError(message);
      console.error('Error fetching reservations:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const createReservation = useCallback(
    async (data: {
      date: string;
      time: string;
      partySize: number;
      specialRequests?: string;
    }) => {
      if (!userId) {
        throw new Error('User ID is required to create a reservation');
      }

      setError(null);

      try {
        const reservation = await ReservationAPI.createReservation(userId, data);
        setReservations((prev) => [reservation, ...prev]);
        return reservation;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create reservation';
        setError(message);
        throw err;
      }
    },
    [userId]
  );

  const updateReservation = useCallback(
    async (id: string, updates: Partial<Reservation>) => {
      setError(null);

      try {
        const updated = await ReservationAPI.updateReservation(id, updates);
        setReservations((prev) =>
          prev.map((res) => (res.id === id ? updated : res))
        );
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update reservation';
        setError(message);
        throw err;
      }
    },
    []
  );

  const deleteReservation = useCallback(async (id: string) => {
    setError(null);

    try {
      await ReservationAPI.deleteReservation(id);
      setReservations((prev) => prev.filter((res) => res.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete reservation';
      setError(message);
      throw err;
    }
  }, []);

  const checkAvailability = useCallback(
    async (date: string, time: string, partySize: number) => {
      try {
        return await ReservationAPI.checkAvailability(date, time, partySize);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to check availability';
        setError(message);
        throw err;
      }
    },
    []
  );

  // Auto-fetch reservations when userId changes
  useEffect(() => {
    if (autoFetch && userId) {
      refetch();
    }
  }, [userId, autoFetch, refetch]);

  return {
    reservations,
    loading,
    error,
    createReservation,
    updateReservation,
    deleteReservation,
    checkAvailability,
    refetch
  };
}
