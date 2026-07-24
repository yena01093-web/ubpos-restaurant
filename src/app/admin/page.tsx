'use client';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { getAdminAuth } from '@/lib/firebase/client';
import LoginForm from '@/components/admin/LoginForm';
import ReservationsPanel from '@/components/admin/ReservationsPanel';
import AvailabilityPanel from '@/components/admin/AvailabilityPanel';
import MenusPanel from '@/components/admin/MenusPanel';

type Tab = 'reservations' | 'availability' | 'menus';

export default function AdminPage() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>('reservations');

  useEffect(() => {
    return onAuthStateChanged(getAdminAuth(), setUser);
  }, []);

  if (user === undefined) {
    return <div className="flex min-h-dvh items-center justify-center text-sm text-stone-400">불러오는 중…</div>;
  }

  if (!user) {
    return (
      <main className="min-h-dvh bg-stone-100 px-4 py-12">
        <LoginForm />
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-stone-100 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-stone-900">약채락 예약 관리</h1>
          <button onClick={() => signOut(getAdminAuth())} className="text-sm text-stone-400 underline">
            로그아웃
          </button>
        </div>

        <div className="mb-6 flex gap-2 border-b border-stone-200">
          <TabButton active={tab === 'reservations'} onClick={() => setTab('reservations')}>
            예약 목록
          </TabButton>
          <TabButton active={tab === 'availability'} onClick={() => setTab('availability')}>
            예약 가능 시간대 설정
          </TabButton>
          <TabButton active={tab === 'menus'} onClick={() => setTab('menus')}>
            메뉴 관리
          </TabButton>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200 sm:p-8">
          {tab === 'reservations' && <ReservationsPanel />}
          {tab === 'availability' && <AvailabilityPanel />}
          {tab === 'menus' && <MenusPanel />}
        </div>
      </div>
    </main>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={[
        'border-b-2 px-1 pb-3 text-sm font-medium transition',
        active ? 'border-stone-800 text-stone-900' : 'border-transparent text-stone-400 hover:text-stone-600',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
