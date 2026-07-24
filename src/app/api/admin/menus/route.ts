import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth';
import type { Menu } from '@/types';

// GET /api/admin/menus — 관리자 전용. 비활성 메뉴 포함 전체 목록.
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 403 });

  const snap = await adminDb().collection('restaurant_menus').get();
  const menus: Menu[] = snap.docs
    .map(doc => ({ id: doc.id, ...(doc.data() as Omit<Menu, 'id'>) }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return NextResponse.json({ menus });
}

// POST /api/admin/menus — 관리자 전용. 새 메뉴 추가.
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const name = body?.name;
  const description = body?.description;
  const price = body?.price;

  if (
    typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 60 ||
    typeof description !== 'string' || description.length > 500 ||
    !(price === null || (typeof price === 'number' && price >= 0))
  ) {
    return NextResponse.json({ error: '입력값을 확인해주세요.' }, { status: 400 });
  }

  const db = adminDb();
  const existing = await db.collection('restaurant_menus').get();
  const sortOrder = existing.size;

  const ref = await db.collection('restaurant_menus').add({
    name: name.trim(),
    description: description.trim(),
    price: price ?? null,
    isActive: true,
    sortOrder,
  });

  return NextResponse.json({ id: ref.id }, { status: 201 });
}
