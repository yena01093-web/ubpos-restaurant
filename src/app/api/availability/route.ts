import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { computeAvailableSlots, DEFAULT_AVAILABILITY } from '@/lib/reservations';
import type { AvailabilitySettings } from '@/types';

// GET /api/availability?date=YYYY-MM-DD — 공개. 해당 날짜의 시간대별 잔여석을 계산해 돌려준다.
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date');
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'date(YYYY-MM-DD) 쿼리 파라미터가 필요합니다.' }, { status: 400 });
  }

  const db = adminDb();
  const settingsSnap = await db.doc('restaurant_settings/availability').get();
  const settings = (settingsSnap.data() as AvailabilitySettings | undefined) ?? DEFAULT_AVAILABILITY;

  const reservedSnap = await db
    .collection('restaurant_reservations')
    .where('date', '==', date)
    .where('status', '==', 'confirmed')
    .get();

  const bookedGuestsByTime: Record<string, number> = {};
  reservedSnap.forEach(doc => {
    const time = doc.get('time') as string;
    const partySize = doc.get('partySize') as number;
    bookedGuestsByTime[time] = (bookedGuestsByTime[time] ?? 0) + partySize;
  });

  const slots = computeAvailableSlots(settings, date, bookedGuestsByTime);
  return NextResponse.json({ date, slots });
}
