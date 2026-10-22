// Booking times are wall-clock times in the towing service's Central time zone.
export const SERVICE_TIME_ZONE = 'America/Chicago';

export function centralNow(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: SERVICE_TIME_ZONE, year: 'numeric', month: '2-digit',
    day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now).map(({ type, value }) => [type, value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

export function isAfterHoursCentral(date, time) {
  if (!date || !time) return false;
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  return day === 0 || time < '08:00' || time >= '18:00';
}

export function readBookingTiming(body, now = new Date()) {
  const legacy = typeof body.when === 'string'
    ? /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})$/.exec(body.when.trim())
    : null;
  const date = body.scheduledDate || body.date || legacy?.[1] || '';
  const time = body.scheduledTime || body.time || legacy?.[2] || '';
  const isScheduled = body.timing === 'Schedule for later' || body.timing === 'scheduled' || Boolean(legacy || date || time);
  if (isScheduled) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      throw new Error('Please choose a valid pickup date and time.');
    }
    const parsed = new Date(`${date}T12:00:00Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
      throw new Error('Please choose a valid pickup date and time.');
    }
    const current = centralNow(now);
    if (`${date} ${time}` <= `${current.date} ${current.time}`) {
      throw new Error('Please choose a future pickup date and time (Central Time).');
    }
    const dateLabel = parsed.toLocaleDateString('en-US', {
      timeZone: 'UTC', weekday: 'short', month: 'long', day: 'numeric', year: 'numeric',
    });
    const [hour, minute] = time.split(':').map(Number);
    const timeLabel = `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
    return {
      kind: 'scheduled', date, time, afterHours: isAfterHoursCentral(date, time),
      label: `${dateLabel} at ${timeLabel} Central Time`,
      subject: `SCHEDULED — ${dateLabel}, ${timeLabel} CT`,
    };
  }
  if (body.timing === 'ASAP' || body.when === 'ASAP') {
    const current = centralNow(now);
    return { kind: 'asap', date: '', time: '', afterHours: isAfterHoursCentral(current.date, current.time), label: 'ASAP — as soon as available', subject: 'ASAP' };
  }
  return {
    kind: 'unknown', date: '', time: '', afterHours: null,
    label: 'Pickup time not provided — contact customer before dispatch',
    subject: 'TIME NOT PROVIDED — CONFIRM BEFORE DISPATCH',
  };
}
