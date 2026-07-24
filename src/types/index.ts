export type ReservationStatus = 'confirmed' | 'cancelled' | 'completed';

export interface Reservation {
  id: string;
  name: string;
  phone: string;
  date: string; // 'YYYY-MM-DD'
  time: string; // 'HH:mm'
  partySize: number;
  status: ReservationStatus;
  createdAt: string; // ISO
}

export interface DayHours {
  closed: boolean;
  open: string; // 'HH:mm'
  close: string; // 'HH:mm'
}

export type Weekday = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

export interface AvailabilitySettings {
  weeklyHours: Record<Weekday, DayHours>;
  slotIntervalMinutes: number;
  maxGuestsPerSlot: number; // 시간대별 총 좌석 수 (예약 인원 합계 기준)
  closedDates: string[]; // 'YYYY-MM-DD'
}

export interface TimeSlot {
  time: string; // 'HH:mm'
  remaining: number; // 남은 좌석 수
  full: boolean; // 좌석이 하나도 안 남았는지
}

/** 예약 위저드가 단계 사이에서 들고 다니는 입력값. */
export interface ReservationDraft {
  date: string; // 'YYYY-MM-DD'
  time: string; // 'HH:mm'
  partySize: number;
  name: string;
  phoneDisplay: string; // 화면 표시용 '010-1234-5678'
  phoneE164: string; // Firebase Phone Auth용 '+8210...'
}
