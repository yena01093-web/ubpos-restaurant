import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth';

const ALLOWED_STATUSES = ['confirmed', 'cancelled', 'completed'];

// PATCH /api/admin/reservations/[id] — 관리자 전용. 예약 상태 변경(취소/완료 처리).
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const status = body?.status;
  if (typeof status !== 'string' || !ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ error: '올바르지 않은 상태값입니다.' }, { status: 400 });
  }

  await adminDb().collection('restaurant_reservations').doc(params.id).update({ status });
  return NextResponse.json({ ok: true });
}
