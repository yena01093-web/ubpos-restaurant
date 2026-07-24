import type { ReservationDraft } from '@/types';

const WEEKDAY_LABEL = ['일', '월', '화', '수', '목', '금', '토'];

function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAY_LABEL[d.getDay()]})`;
}

export default function ConfirmStep({ draft, onRestart }: { draft: ReservationDraft; onRestart: () => void }) {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600">
        ✓
      </div>
      <div>
        <h2 className="text-lg font-semibold text-stone-900">예약이 확정되었어요</h2>
        <p className="mt-1 text-sm text-stone-500">아래 정보로 예약을 완료했습니다.</p>
      </div>

      <div className="space-y-2 rounded-xl bg-stone-50 p-5 text-left text-sm text-stone-700">
        <Row label="날짜" value={formatDate(draft.date)} />
        <Row label="시간" value={draft.time} />
        <Row label="인원" value={`${draft.partySize}명`} />
        <Row label="예약자" value={`${draft.name} (${draft.phoneDisplay})`} />
        <Row label="메뉴" value={draft.menuSelections.map(s => `${s.menuName} ${s.quantity}인분`).join(', ')} />
        {draft.specialRequests && <Row label="요청사항" value={draft.specialRequests} />}
      </div>

      <button
        type="button"
        onClick={onRestart}
        className="w-full rounded-xl border border-stone-300 py-3.5 text-sm font-semibold text-stone-700 transition hover:border-stone-500"
      >
        다른 예약하기
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-stone-400">{label}</span>
      <span className="font-medium text-stone-900">{value}</span>
    </div>
  );
}
