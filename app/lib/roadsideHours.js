import { centralNow } from './bookingTiming.js';

export function roadsideHours(now = new Date()) {
  return { open: centralNow(now).time >= '06:00', opensAt: 6 };
}
