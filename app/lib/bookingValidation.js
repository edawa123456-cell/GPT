import { readBookingTiming } from './bookingTiming';

const messages = {
  body: ['Please check your booking details and try again.', 'Revisa los datos de tu solicitud e inténtalo de nuevo.'],
  pickup: ['Enter a pickup address or confirm a GPS pickup pin.', 'Ingresa una dirección de recogida o confirma un pin de GPS.'],
  destination: ['Enter a drop-off address.', 'Ingresa una dirección de destino.'],
  coordinates: ['The pickup pin is invalid. Select and confirm your location again.', 'El pin de recogida no es válido. Selecciona y confirma tu ubicación otra vez.'],
  vehicleType: ['Choose a vehicle type: Sedan, SUV, or Pickup.', 'Selecciona el tipo de vehículo: sedán, SUV o camioneta pickup.'],
  rolls: ['Choose whether the vehicle can roll.', 'Indica si el vehículo puede rodar.'],
  timing: ['Choose ASAP or schedule a future pickup date and time (Central Time).', 'Selecciona lo antes posible o programa una fecha y hora futuras (hora del centro).'],
  customerName: ['Enter your name.', 'Ingresa tu nombre.'],
  customerPhone: ['Enter a valid phone number: 10 digits for a US number, or + and the country code for an international number.', 'Ingresa un teléfono válido: 10 dígitos para EE. UU., o + y el código de país para un número internacional.'],
  vehicleDetails: ['Enter the vehicle make and model.', 'Ingresa la marca y el modelo del vehículo.'],
  smsConsent: ['The text confirmation choice must be checked or unchecked.', 'La opción de confirmación por mensaje debe estar marcada o desmarcada.'],
  tooLong: ['One of your entries is too long. Please shorten it.', 'Uno de los datos es demasiado largo. Acórtalo.'],
};

export class BookingValidationError extends Error {
  constructor(field, code = field) {
    super(messages[code]?.[0] || messages.body[0]);
    this.name = 'BookingValidationError';
    this.field = field;
    this.code = code;
  }
}

export function validationMessage(error, locale = 'en') {
  return (messages[error?.code] || messages.body)[locale === 'es' ? 1 : 0];
}

function text(value, field, maxLength, required = true) {
  if (typeof value !== 'string') {
    if (!required && value == null) return '';
    throw new BookingValidationError(field);
  }
  const trimmed = value.trim();
  if (required && !trimmed) throw new BookingValidationError(field);
  if (trimmed.length > maxLength) throw new BookingValidationError(field, 'tooLong');
  return trimmed;
}

export function normalizePhone(value) {
  const raw = text(value, 'customerPhone', 40);
  if (!/^\+?[\d\s().-]+$/.test(raw)) throw new BookingValidationError('customerPhone');
  const digits = raw.replace(/\D/g, '');
  const national = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if ((!raw.startsWith('+') && (digits.length === 10 || (digits.length === 11 && digits.startsWith('1')))) || (raw.startsWith('+1') && digits.length === 11)) {
    if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(national) || /^(\d)\1+$/.test(national)) throw new BookingValidationError('customerPhone');
    return `+1${national}`;
  }
  if (raw.startsWith('+') && !digits.startsWith('1') && /^[1-9]\d{7,14}$/.test(digits) && !/^(\d)\1+$/.test(digits)) return `+${digits}`;
  throw new BookingValidationError('customerPhone');
}

export function validateLocations(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new BookingValidationError('body');
  const pin = body.pickupCoordinates;
  if (pin != null && (typeof pin !== 'object' || Array.isArray(pin) || typeof pin.lat !== 'number' || typeof pin.lng !== 'number' || !Number.isFinite(pin.lat) || !Number.isFinite(pin.lng) || Math.abs(pin.lat) > 90 || Math.abs(pin.lng) > 180)) {
    throw new BookingValidationError('pickup', 'coordinates');
  }
  const pickup = pin != null
    ? (text(body.pickup, 'pickup', 500, false) || `GPS: ${pin.lat.toFixed(6)}, ${pin.lng.toFixed(6)}`)
    : text(body.pickup, 'pickup', 500);
  return { pickup, pickupCoordinates: pin == null ? null : { lat: pin.lat, lng: pin.lng }, destination: text(body.destination, 'destination', 500) };
}

export function validateBooking(body, { requireContact = true, now = new Date() } = {}) {
  const locations = validateLocations(body);
  if (!['Sedan', 'SUV', 'Pickup'].includes(body.vehicleType)) throw new BookingValidationError('vehicleType');
  if (body.rolls != null && !['Yes', 'No'].includes(body.rolls)) throw new BookingValidationError('rolls');
  if (body.nonRolling != null && typeof body.nonRolling !== 'boolean') throw new BookingValidationError('rolls');
  if (body.rolls == null && typeof body.nonRolling !== 'boolean') throw new BookingValidationError('rolls');
  if (body.rolls != null && typeof body.nonRolling === 'boolean' && body.nonRolling !== (body.rolls === 'No')) throw new BookingValidationError('rolls');
  if (body.timing != null && !['ASAP', 'Schedule for later', 'scheduled'].includes(body.timing)) throw new BookingValidationError('timing');
  for (const key of ['when', 'scheduledDate', 'scheduledTime', 'date', 'time']) {
    if (body[key] != null && (typeof body[key] !== 'string' || body[key].length > 40)) throw new BookingValidationError('timing');
  }
  let requestedTiming;
  try {
    requestedTiming = readBookingTiming(body, now);
    if (requestedTiming.kind === 'unknown') throw new Error('Missing timing');
    if (body.timing === 'ASAP' && requestedTiming.kind !== 'asap') throw new Error('Conflicting timing');
  } catch {
    throw new BookingValidationError('timing');
  }
  if (body.smsConsent != null && typeof body.smsConsent !== 'boolean') throw new BookingValidationError('smsConsent');
  const nonRolling = body.rolls != null ? body.rolls === 'No' : body.nonRolling;
  const normalized = {
    ...body, ...locations, nonRolling, rolls: nonRolling ? 'No' : 'Yes',
    smsConsent: body.smsConsent === true,
  };
  if (requireContact) {
    normalized.customerName = text(body.customerName, 'customerName', 100);
    normalized.customerPhone = normalizePhone(body.customerPhone);
    normalized.vehicleDetails = text(body.vehicleDetails, 'vehicleDetails', 200);
  }
  return { booking: normalized, requestedTiming };
}
