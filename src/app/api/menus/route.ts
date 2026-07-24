import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import type { Menu } from '@/types';

// 인자를 받지 않아 Next가 정적 라우트로 착각하고 빌드 시점에 한 번만 실행해버릴 수 있어
// 명시적으로 매 요청마다 새로 실행하도록 강제한다.
export const dynamic = 'force-dynamic';

// GET /api/menus — 공개. 예약 페이지에서 고를 수 있는 활성 메뉴 목록.
export async function GET() {
  const snap = await adminDb().collection('restaurant_menus').where('isActive', '==', true).get();
  const menus: Menu[] = snap.docs
    .map(doc => ({ id: doc.id, ...(doc.data() as Omit<Menu, 'id'>) }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return NextResponse.json({ menus });
}
