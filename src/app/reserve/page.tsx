import Link from 'next/link';
import ReservationWizard from '@/components/reservation/ReservationWizard';

export default function ReservePage() {
  return (
    <main className="min-h-dvh bg-stone-100 px-4 py-12">
      <div className="mx-auto mb-10 max-w-md text-center">
        <Link href="/" className="text-xs text-stone-400 underline">
          ← 약채락 성현 홈으로
        </Link>
        <p className="mt-4 text-xs font-medium tracking-widest text-stone-400">RESERVATION</p>
        <h1 className="mt-2 text-2xl font-semibold text-stone-900">약채락 예약</h1>
        <p className="mt-2 text-sm text-stone-500">날짜와 시간을 선택하고, 전화번호 인증 후 예약을 확정해주세요.</p>
      </div>

      <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200 sm:p-8">
        <ReservationWizard />
      </div>
    </main>
  );
}
