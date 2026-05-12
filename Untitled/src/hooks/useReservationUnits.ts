import { useEffect, useMemo, useState } from "react";
import {
  loadReservationUnits,
  saveReservationUnits,
  reservationServiceCategories,
  type ReservationServiceCategory,
  type ReservationUnit,
} from "../app/data/reservationData";

export function useReservationUnits() {
  const [units, setUnits] = useState<ReservationUnit[]>([]);

  useEffect(() => {
    setUnits(loadReservationUnits());
  }, []);

  const saveUnits = (newUnits: ReservationUnit[]) => {
    setUnits(newUnits);
    saveReservationUnits(newUnits);
  };

  const addUnit = (unit: ReservationUnit) => {
    saveUnits([...units, unit]);
  };

  const updateUnit = (unitId: string, updates: Partial<ReservationUnit>) => {
    saveUnits(units.map((unit) => (unit.id === unitId ? { ...unit, ...updates } : unit)));
  };

  const deleteUnit = (unitId: string) => {
    saveUnits(units.filter((unit) => unit.id !== unitId));
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
