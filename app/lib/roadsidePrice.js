/** Flat service prices, in USD. Fuel delivery includes one gallon of gas. */
export const ROADSIDE_PRICES = Object.freeze({
  jump_start: 50,
  tire_change: 50,
  lockout: 50,
  fuel_delivery: 75,
});
export function roadsidePrice(service) {
  return Object.prototype.hasOwnProperty.call(ROADSIDE_PRICES, service) ? ROADSIDE_PRICES[service] : null;
}
