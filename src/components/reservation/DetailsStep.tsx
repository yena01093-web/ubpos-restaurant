'use client';
import { useEffect, useState } from 'react';
import { formatPhoneInput, toE164Korea } from '@/lib/phone';
import type { ReservationDraft, TimeSlot } from '@/types';

function todayStr(): string {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

function maxDateStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 60);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export default function DetailsStep({ onNext }: { onNext: (draft: ReservationDraft) => void }) {
  const [date, setDate] = useState(todayStr());
  const [slots, setSlots] = useState<TimeSlot[] | null>(null);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [partySize, setPartySize] = useState(2);
  const [name, setName] = useState('');
  const [phoneDisplay, setPhoneDisplay] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSlots(null);
    setSlotsError(null);
    setTime(null);
    (async () => {
      try {
        const res = await fetch(`/api/availability?date=${date}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error ?? '조회 중 오류가 발생했습니다.');
        setSlots(data.slots);
      } catch (err) {
        if (!cancelled) setSlotsError(err instanceof Error ? err.message : '조회 중 오류가 발생했습니다.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [date]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!time) return setError('예약 시간을 선택해주세요.');
    if (name.trim().length === 0) return setError('예약자 이름을 입력해주세요.');
    const phoneE164 = toE164Korea(phoneDisplay);
    if (!phoneE164) return setError('휴대폰 번호를 다시 확인해주세요.');

    onNext({ date, time, partySize, name: name.trim(), phoneDisplay, phoneE164 });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700">날짜</label>
        <input
          type="date"
          value={date}
          min={todayStr()}
          max={maxDateStr()}
          onChange={e => setDate(e.target.value)}
          className="w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700">시간</label>
        {slotsError && <p className="text-sm text-red-600">{slotsError}</p>}
        {!slotsError && slots === null && <p className="text-sm text-stone-400">시간대를 불러오는 중…</p>}
        {!slotsError && slots?.length === 0 && (
          <p className="text-sm text-stone-400">이 날짜는 예약 가능한 시간이 없어요. 다른 날짜를 선택해주세요.</p>
        )}
        {!slotsError && slots && slots.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {slots.map(slot => (
              <button
                key={slot.time}
                type="button"
                disabled={slot.full}
                onClick={() => setTime(slot.time)}
                className={[
                  'rounded-lg border px-3 py-2 text-sm transition',
                  slot.full
                    ? 'cursor-not-allowed border-stone-200 text-stone-300 line-through'
                    : time === slot.time
                      ? 'border-stone-800 bg-stone-800 text-white'
                      : 'border-stone-300 text-stone-700 hover:border-stone-500',
                ].join(' ')}
              >
                {slot.time}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700">인원</label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setPartySize(n => Math.max(1, n - 1))}
            className="h-10 w-10 rounded-full border border-stone-300 text-lg text-stone-700 hover:border-stone-500"
          >
            −
          </button>
          <span className="w-10 text-center text-lg font-medium text-stone-900">{partySize}명</span>
          <button
            type="button"
            onClick={() => setPartySize(n => Math.min(20, n + 1))}
            className="h-10 w-10 rounded-full border border-stone-300 text-lg text-stone-700 hover:border-stone-500"
          >
            +
          </button>
          {partySize >= 20 && <span className="text-xs text-stone-400">20명 초과는 전화 문의해주세요</span>}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700">예약자 이름</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={30}
          placeholder="홍길동"
          className="w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700">휴대폰 번호</label>
        <input
          type="tel"
          inputMode="numeric"
          value={phoneDisplay}
          onChange={e => setPhoneDisplay(formatPhoneInput(e.target.value))}
          placeholder="010-1234-5678"
          className="w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
        />
        <p className="mt-1 text-xs text-stone-400">다음 단계에서 이 번호로 인증번호를 보내드려요.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        className="w-full rounded-xl bg-stone-800 py-3.5 text-sm font-semibold text-white transition hover:bg-stone-900"
      >
        인증하고 예약하기
      </button>
    </form>
  );
}
