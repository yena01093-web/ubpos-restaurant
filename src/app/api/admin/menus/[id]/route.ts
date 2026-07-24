import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/auth';

// PATCH /api/admin/menus/[id] — 관리자 전용. 이름/설명/가격/활성화 여부/순서 수정.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: '입력값을 확인해주세요.' }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if ('name' in body) {
    if (typeof body.name !== 'string' || body.name.trim().length === 0 || body.name.trim().length > 60) {
      return NextResponse.json({ error: '메뉴 이름을 확인해주세요.' }, { status: 400 });
    }
    update.name = body.name.trim();
  }
  if ('description' in body) {
    if (typeof body.description !== 'string' || body.description.length > 500) {
      return NextResponse.json({ error: '설명을 확인해주세요.' }, { status: 400 });
    }
    update.description = body.description.trim();
  }
  if ('price' in body) {
    if (!(body.price === null || (typeof body.price === 'number' && body.price >= 0))) {
      return NextResponse.json({ error: '가격을 확인해주세요.' }, { status: 400 });
    }
    update.price = body.price;
  }
  if ('isActive' in body) {
    if (typeof body.isActive !== 'boolean') {
      return NextResponse.json({ error: '활성화 여부를 확인해주세요.' }, { status: 400 });
    }
    update.isActive = body.isActive;
  }
  if ('sortOrder' in body) {
    if (typeof body.sortOrder !== 'number') {
      return NextResponse.json({ error: '순서 값을 확인해주세요.' }, { status: 400 });
    }
    update.sortOrder = body.sortOrder;
  }

  await adminDb().collection('restaurant_menus').doc(params.id).update(update);
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/menus/[id] — 관리자 전용. 메뉴 삭제 (기존 예약은 스냅샷된 이름을 그대로 보여주므로 영향 없음).
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 403 });

  await adminDb().collection('restaurant_menus').doc(params.id).delete();
  return NextResponse.json({ ok: true });
}
