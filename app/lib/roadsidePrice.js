/** Flat service prices, in USD. Fuel delivery includes one gallon of gas. */
export const ROADSIDE_PRICES = Object.freeze({

  tire_change: 50,
  lockout: 50,
  fuel_delivery: 75,
});
export const JUMP_TYPES = [
  { id: 'sedan_suv', en: 'Sedan or SUV', es: 'Sedán o SUV', price: 65 },
  { id: 'pickup', en: 'Pickup truck', es: 'Camioneta pickup', price: 85 },
  { id: 'box_van', en: 'Box truck or van', es: 'Camión de caja o van', price: 95 },
  { id: 'semi', en: 'Semi-truck', es: 'Tractocamión', price: 145 },
];
export function roadsidePrice(service, vehicleType) {
  if (typeof service !== 'string') return null;
  if (service === 'jump_start') return JUMP_TYPES.find(v => v.id === vehicleType)?.price ?? null;
  return Object.prototype.hasOwnProperty.call(ROADSIDE_PRICES, service) ? ROADSIDE_PRICES[service] : null;
}
