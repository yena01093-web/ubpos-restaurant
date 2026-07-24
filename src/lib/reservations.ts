import type { AvailabilitySettings, DayHours, TimeSlot, Weekday } from '@/types';

const WEEKDAYS: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function weekdayOf(dateStr: string): Weekday {
  const d = new Date(`${dateStr}T00:00:00`);
  return WEEKDAYS[d.getDay()];
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function toHHMM(mins: number): string {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/** 특정 날짜의 영업시간을 반환한다 (휴무일이면 null). */
export function getDayHours(settings: AvailabilitySettings, dateStr: string): DayHours | null {
  if (settings.closedDates.includes(dateStr)) return null;
  const hours = settings.weeklyHours[weekdayOf(dateStr)];
  if (!hours || hours.closed) return null;
  return hours;
}

/** 영업시간 + 슬롯 간격으로 해당 날짜의 시간 슬롯 목록을 만든다. */
export function generateSlots(settings: AvailabilitySettings, dateStr: string): string[] {
  const hours = getDayHours(settings, dateStr);
  if (!hours) return [];
  const start = toMinutes(hours.open);
  const end = toMinutes(hours.close);
  const slots: string[] = [];
  for (let t = start; t < end; t += settings.slotIntervalMinutes) {
    slots.push(toHHMM(t));
  }
  return slots;
}

/** 슬롯 목록에 시간별 예약 인원 합계를 반영해 잔여 좌석 수를 계산한다. */
export function computeAvailableSlots(
  settings: AvailabilitySettings,
  dateStr: string,
  bookedGuestsByTime: Record<string, number>
): TimeSlot[] {
  return generateSlots(settings, dateStr).map(time => {
    const booked = bookedGuestsByTime[time] ?? 0;
    const remaining = Math.max(0, settings.maxGuestsPerSlot - booked);
    return { time, remaining, full: remaining <= 0 };
  });
}

export const DEFAULT_AVAILABILITY: AvailabilitySettings = {
  weeklyHours: {
    sun: { closed: true, open: '11:00', close: '21:00' },
    mon: { closed: false, open: '11:00', close: '21:00' },
    tue: { closed: false, open: '11:00', close: '21:00' },
    wed: { closed: false, open: '11:00', close: '21:00' },
    thu: { closed: false, open: '11:00', close: '21:00' },
    fri: { closed: false, open: '11:00', close: '21:30' },
    sat: { closed: false, open: '11:00', close: '21:30' },
  },
  slotIntervalMinutes: 60,
  maxGuestsPerSlot: 100,
  closedDates: [],
};
