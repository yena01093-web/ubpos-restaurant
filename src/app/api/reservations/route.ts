import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { verifyIdToken } from '@/lib/auth';
import { generateSlots, DEFAULT_AVAILABILITY } from '@/lib/reservations';
import type { AvailabilitySettings } from '@/types';

// POST /api/reservations — 전화번호 인증(Firebase Phone Auth)을 마친 고객만 호출 가능.
// Authorization: Bearer <idToken> 을 검증해 전화번호는 토큰에서만 신뢰하고, 클라이언트가
// 보낸 값은 쓰지 않는다(위조 방지).
export async function POST(req: NextRequest) {
  const decoded = await verifyIdToken(req);
  if (!decoded || decoded.firebase?.sign_in_provider !== 'phone' || !decoded.phone_number) {
    return NextResponse.json({ error: '전화번호 인증이 필요합니다.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const date = body?.date;
  const time = body?.time;
  const name = body?.name;
  const partySize = body?.partySize;

  if (
    typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    typeof time !== 'string' || !/^\d{2}:\d{2}$/.test(time) ||
    typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 30 ||
    typeof partySize !== 'number' || !Number.isInteger(partySize) || partySize < 1 || partySize > 20
  ) {
    return NextResponse.json({ error: '입력값을 확인해주세요.' }, { status: 400 });
  }

  const db = adminDb();
  const settingsSnap = await db.doc('restaurant_settings/availability').get();
  const settings = (settingsSnap.data() as AvailabilitySettings | undefined) ?? DEFAULT_AVAILABILITY;

  if (!generateSlots(settings, date).includes(time)) {
    return NextResponse.json({ error: '예약할 수 없는 시간대입니다.' }, { status: 400 });
  }

  try {
    const reservationId = await db.runTransaction(async tx => {
      const existingSnap = await tx.get(
        db
          .collection('restaurant_reservations')
          .where('date', '==', date)
          .where('time', '==', time)
          .where('status', '==', 'confirmed')
      );
      if (existingSnap.size >= settings.maxReservationsPerSlot) {
        throw new Error('SLOT_FULL');
      }
      const ref = db.collection('restaurant_reservations').doc();
      tx.set(ref, {
        name: name.trim(),
        phone: decoded.phone_number,
        date,
        time,
        partySize,
        status: 'confirmed',
        createdAt: FieldValue.serverTimestamp(),
      });
      return ref.id;
    });

    return NextResponse.json({ id: reservationId }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === 'SLOT_FULL') {
      return NextResponse.json({ error: '방금 마감된 시간대입니다. 다른 시간을 선택해주세요.' }, { status: 409 });
    }
    console.error('[POST /api/reservations]', err);
    return NextResponse.json({ error: '예약 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
