import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth';

// GET /api/admin/reservations?date=YYYY-MM-DD(선택) — 관리자 전용. date를 주면 그 날짜만,
// 없으면 최근 200건을 최신순으로 돌려준다.
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 403 });

  const date = req.nextUrl.searchParams.get('date');
  const db = adminDb();
  const query = date
    ? db.collection('restaurant_reservations').where('date', '==', date)
    : db.collection('restaurant_reservations').orderBy('date', 'desc').limit(200);

  const snap = await query.get();
  const reservations = snap.docs
    .map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name as string,
        phone: data.phone as string,
        date: data.date as string,
        time: data.time as string,
        partySize: data.partySize as number,
        status: data.status as string,
        createdAt: data.createdAt?.toDate?.().toISOString() ?? null,
      };
    })
    .sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : b.date.localeCompare(a.date)));

  return NextResponse.json({ reservations });
}
