/** Flat service prices, in USD. Fuel delivery includes one gallon of gas. */
export const ROADSIDE_PRICES = Object.freeze({
  lockout: 65,
  fuel_delivery: 75,
});
export const JUMP_TYPES = [
  { id: 'sedan_suv', en: 'Sedan or SUV', es: 'Sedán o SUV', price: 65 },
  { id: 'pickup', en: 'Pickup truck', es: 'Camioneta pickup', price: 85 },
  { id: 'box_van', en: 'Box truck or van', es: 'Camión de caja o van', price: 95 },
  { id: 'semi', en: 'Semi-truck', es: 'Tractocamión', price: 145 },
];
const TIRE_TYPES = [
  { id: 'sedan', en: 'Sedan', es: 'Sedán', price: 95 },
  { id: 'suv', en: 'SUV', es: 'SUV', price: 165 },
  { id: 'pickup', en: 'Pickup truck', es: 'Camioneta pickup', price: 165 },
];
export function vehicleOptions(service) {
  return service === 'tire_change' ? TIRE_TYPES : service === 'jump_start' ? JUMP_TYPES : null;
}
export function roadsidePrice(service, vehicleType) {
  if (typeof service !== 'string') return null;
  const options = vehicleOptions(service);
  if (options) return options.find(v => v.id === vehicleType)?.price ?? null;
  return Object.prototype.hasOwnProperty.call(ROADSIDE_PRICES, service) ? ROADSIDE_PRICES[service] : null;
}

export function roadsideQuote(service, vehicleType, miles) {
  const base = roadsidePrice(service, vehicleType);
  if (base === null || !Number.isFinite(miles) || miles < 0) return null;
  if (miles > 30) return { outsideServiceArea: true };
  const distance = Number(miles.toFixed(1));
  // Determine tier from the actual route distance, not its rounded display value.
  const travel = miles <= 10 ? 0 : miles <= 20 ? 15 : 50;
  return { base, miles: distance, travel, total: base + travel };
}
