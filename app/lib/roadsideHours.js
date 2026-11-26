import { centralNow } from './bookingTiming.js';

export function roadsideHours(now = new Date()) {
  const { date, time } = centralNow(now);
  const day = new Date(date + 'T12:00:00Z').getUTCDay();
  const start = day === 0 ? '10:00' : '07:00';
  const end = day === 0 ? '18:00' : '19:00';
  const tomorrow = time >= end;
  return { open: time >= start && time < end, tomorrow, opensAt: (tomorrow ? (day + 1) % 7 : day) === 0 ? 10 : 7 };
}
