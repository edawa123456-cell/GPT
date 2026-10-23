export const VEHICLE_SURCHARGE = {
  Sedan: 0,
  SUV: 15,
  Pickup: 15,
};

export const HOOKUP_FEE = 80;
export const PER_MILE = 7;
export const MINIMUM_CHARGE = 100;
export const NON_ROLLING_SURCHARGE = 40;
export const AFTER_HOURS_SURCHARGE = 60;

export function calculateTowPrice({ billedMiles, vehicle, rolls, afterHours }) {
  if (billedMiles == null) return null;
  return Math.max(MINIMUM_CHARGE,
    HOOKUP_FEE + billedMiles * PER_MILE + (VEHICLE_SURCHARGE[vehicle] || 0)
    + (rolls === 'No' ? NON_ROLLING_SURCHARGE : 0)
    + (afterHours ? AFTER_HOURS_SURCHARGE : 0));
}

// A new amount must be displayed and accepted with another submission.
export function reviewTowPrice(displayedTotal, options) {
  const total = calculateTowPrice(options);
  return { total, needsConfirmation: total !== displayedTotal };
}
