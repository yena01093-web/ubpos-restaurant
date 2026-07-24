import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth';
import { DEFAULT_AVAILABILITY } from '@/lib/reservations';
import type { AvailabilitySettings, Weekday } from '@/types';

const WEEKDAYS: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

// GET /api/admin/availability — 관리자 전용. 현재 예약 가능 시간대 설정 조회.
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 403 });

  const snap = await adminDb().doc('restaurant_settings/availability').get();
  const settings = (snap.data() as AvailabilitySettings | undefined) ?? DEFAULT_AVAILABILITY;
  return NextResponse.json({ settings });
}

// PUT /api/admin/availability — 관리자 전용. 예약 가능 시간대 설정 저장.
export async function PUT(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!isValidSettings(body)) {
    return NextResponse.json({ error: '설정값을 확인해주세요.' }, { status: 400 });
  }

  await adminDb().doc('restaurant_settings/availability').set(body);
  return NextResponse.json({ ok: true });
}

function isValidSettings(body: unknown): body is AvailabilitySettings {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  if (typeof b.slotIntervalMinutes !== 'number' || b.slotIntervalMinutes < 5 || b.slotIntervalMinutes > 240) return false;
  if (typeof b.maxReservationsPerSlot !== 'number' || b.maxReservationsPerSlot < 1 || b.maxReservationsPerSlot > 999) return false;
  if (!Array.isArray(b.closedDates) || !b.closedDates.every(d => typeof d === 'string')) return false;

  const wh = b.weeklyHours as Record<string, unknown> | undefined;
  if (!wh || typeof wh !== 'object') return false;
  for (const day of WEEKDAYS) {
    const d = wh[day] as Record<string, unknown> | undefined;
    if (!d || typeof d.closed !== 'boolean' || typeof d.open !== 'string' || typeof d.close !== 'string') return false;
  }
  return true;
}
