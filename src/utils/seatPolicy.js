const DEFAULT_SEAT_LIMIT = 60;

const VEHICLE_SEAT_LIMITS = {
  Motorcycle: 1,
  Car: 8,
  'A minibus': 20,
  'A bus': 60,
  Other: 60,
  'seeking-driver': 1,
};

export function getSeatLimitForVehicle(vehicle) {
  return VEHICLE_SEAT_LIMITS[vehicle] || DEFAULT_SEAT_LIMIT;
}

export function clampSeatCount(value, vehicle) {
  const maxSeats = getSeatLimitForVehicle(vehicle);
  const seats = Number(value);

  if (!Number.isInteger(seats)) {
    return 1;
  }

  return Math.min(Math.max(seats, 1), maxSeats);
}

export function formatSeatsLabel(availableSeats, totalSeats) {
  const safeAvailable = Number.isInteger(Number(availableSeats))
    ? Number(availableSeats)
    : Number(totalSeats) || 1;
  const safeTotal = Number.isInteger(Number(totalSeats))
    ? Number(totalSeats)
    : safeAvailable;

  return `${safeAvailable}/${safeTotal}`;
}
