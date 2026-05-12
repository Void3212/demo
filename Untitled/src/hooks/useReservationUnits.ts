import { useEffect, useMemo, useState } from "react";
import {
  loadReservationUnits,
  saveReservationUnits,
  reservationServiceCategories,
  type ReservationServiceCategory,
  type ReservationUnit,
} from "../app/data/reservationData";
import { ReservationUnitAPI } from "../api/reservationUnitAPI";

export function useReservationUnits() {
  const [units, setUnits] = useState<ReservationUnit[]>([]);

  useEffect(() => {
    const loadUnits = async () => {
      try {
        const data = await ReservationUnitAPI.getAllUnits();
        // Convert active from 0|1 to boolean
        const convertedData = data.map(unit => ({
          ...unit,
          active: unit.active === 1,
        }));
        setUnits(convertedData);
      } catch (error) {
        console.error("Failed to load reservation units from API, falling back to localStorage:", error);
        // Fallback to localStorage if API fails
        setUnits(loadReservationUnits());
      }
    };

    loadUnits();

    const handleStorageUpdate = (event: StorageEvent) => {
      if (event.key === "chillingan-reservation-units") {
        setUnits(loadReservationUnits());
      }
    };

    window.addEventListener("storage", handleStorageUpdate);
    return () => window.removeEventListener("storage", handleStorageUpdate);
  }, []);

  const saveUnits = async (newUnits: ReservationUnit[]) => {
    setUnits(newUnits);
    try {
      // Try to save to API - this is a simplified approach
      // In a real app, you'd need to sync each unit individually
      await Promise.all(newUnits.map(unit =>
        ReservationUnitAPI.updateUnit(unit.id, unit).catch(() =>
          ReservationUnitAPI.createUnit(unit)
        )
      ));
    } catch (error) {
      console.error("Failed to save to API, falling back to localStorage:", error);
      saveReservationUnits(newUnits);
    }
  };

  const addUnit = async (unit: ReservationUnit) => {
    try {
      const apiUnit = {
        ...unit,
        active: unit.active ? 1 : 0,
      };
      const created = await ReservationUnitAPI.createUnit(apiUnit);
      const converted = {
        ...created,
        active: created.active === 1,
      };
      setUnits(prev => [...prev, converted]);
    } catch (error) {
      console.error("Failed to add unit via API, falling back to localStorage:", error);
      const newUnits = [...units, unit];
      setUnits(newUnits);
      saveReservationUnits(newUnits);
    }
  };

  const updateUnit = async (unitId: string, updates: Partial<ReservationUnit>) => {
    try {
      const apiUpdates = {
        ...updates,
        active: updates.active !== undefined ? (updates.active ? 1 : 0) : undefined,
      };
      const updated = await ReservationUnitAPI.updateUnit(unitId, apiUpdates);
      const converted = {
        ...updated,
        active: updated.active === 1,
      };
      setUnits(prev => prev.map(unit => unit.id === unitId ? converted : unit));
    } catch (error) {
      console.error("Failed to update unit via API, falling back to localStorage:", error);
      const newUnits = units.map((unit) => (unit.id === unitId ? { ...unit, ...updates } : unit));
      setUnits(newUnits);
      saveReservationUnits(newUnits);
    }
  };

  const deleteUnit = async (unitId: string) => {
    try {
      await ReservationUnitAPI.deleteUnit(unitId);
      setUnits(prev => prev.filter(unit => unit.id !== unitId));
    } catch (error) {
      console.error("Failed to delete unit via API, falling back to localStorage:", error);
      const newUnits = units.filter((unit) => unit.id !== unitId);
      setUnits(newUnits);
      saveReservationUnits(newUnits);
    }
  };

  const activeUnits = useMemo(() => units.filter((unit) => unit.active), [units]);

  const unitsByService = useMemo(
    () => (
      id: ReservationServiceCategory["id"]) => units.filter((unit) => unit.serviceId === id && unit.active),
    [units]
  );

  return {
    units,
    activeUnits,
    serviceCategories: reservationServiceCategories,
    addUnit,
    updateUnit,
    deleteUnit,
    unitsByService,
  };
}
