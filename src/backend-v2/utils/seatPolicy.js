const DEFAULT_SEAT_LIMIT = 60;

const VEHICLE_SEAT_LIMITS = {
  Motorcycle: 1,
  Car: 8,
  'A minibus': 20,
  'A bus': 60,
  Other: 60,
  'seeking-driver': 1,
};

function getSeatLimitForVehicle(vehicle) {
  return VEHICLE_SEAT_LIMITS[vehicle] || DEFAULT_SEAT_LIMIT;
}

function validateSeatCount(value, vehicle) {
  const seats = Number(value);
  const maxSeats = getSeatLimitForVehicle(vehicle);

  if (!Number.isInteger(seats) || seats < 1 || seats > maxSeats) {
    return {
      isValid: false,
      seats: null,
      error: `Free seats must be between 1 and ${maxSeats}.`,
    };
  }

  return {isValid: true, seats, error: null};
}

module.exports = {
  getSeatLimitForVehicle,
  validateSeatCount,
};
