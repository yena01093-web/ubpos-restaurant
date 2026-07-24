'use client';
import { useEffect, useState } from 'react';
import { formatPhoneInput, toE164Korea } from '@/lib/phone';
import type { Menu, ReservationDraft, TimeSlot } from '@/types';

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
  const [menus, setMenus] = useState<Menu[] | null>(null);
  const [menusError, setMenusError] = useState<string | null>(null);
  const [menuQty, setMenuQty] = useState<Record<string, number>>({});
  const [specialRequests, setSpecialRequests] = useState('');
  const [name, setName] = useState('');
  const [phoneDisplay, setPhoneDisplay] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/menus');
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error ?? '메뉴를 불러오지 못했습니다.');
        setMenus(data.menus);
      } catch (err) {
        if (!cancelled) setMenusError(err instanceof Error ? err.message : '메뉴를 불러오지 못했습니다.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const menuTotal = Object.values(menuQty).reduce((sum, n) => sum + n, 0);

  const setQty = (menuId: string, qty: number) => {
    setMenuQty(prev => {
      const next = { ...prev };
      if (qty <= 0) delete next[menuId];
      else next[menuId] = qty;
      return next;
    });
  };

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

  // 인원 수를 늘렸을 때 이미 골라둔 시간대의 남은 좌석이 부족해지면 선택을 풀어준다.
  useEffect(() => {
    if (!time || !slots) return;
    const selected = slots.find(s => s.time === time);
    if (!selected || selected.remaining < partySize) setTime(null);
  }, [partySize, slots, time]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!time) return setError('예약 시간을 선택해주세요.');
    if (menuTotal !== partySize) return setError('메뉴 선택 인원이 예약 인원과 일치해야 합니다.');
    if (name.trim().length === 0) return setError('예약자 이름을 입력해주세요.');
    const phoneE164 = toE164Korea(phoneDisplay);
    if (!phoneE164) return setError('휴대폰 번호를 다시 확인해주세요.');

    const menuSelections = (menus ?? [])
      .filter(m => (menuQty[m.id] ?? 0) > 0)
      .map(m => ({ menuId: m.id, menuName: m.name, quantity: menuQty[m.id] }));

    onNext({
      date,
      time,
      partySize,
      menuSelections,
      specialRequests: specialRequests.trim(),
      name: name.trim(),
      phoneDisplay,
      phoneE164,
    });
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
            {slots.map(slot => {
              const notEnoughSeats = slot.remaining < partySize;
              const disabled = slot.full || notEnoughSeats;
              return (
                <button
                  key={slot.time}
                  type="button"
                  disabled={disabled}
                  onClick={() => setTime(slot.time)}
                  className={[
                    'flex flex-col items-center rounded-lg border px-3 py-2 text-sm transition',
                    disabled
                      ? 'cursor-not-allowed border-stone-200 text-stone-300 line-through'
                      : time === slot.time
                        ? 'border-stone-800 bg-stone-800 text-white'
                        : 'border-stone-300 text-stone-700 hover:border-stone-500',
                  ].join(' ')}
                >
                  {slot.time}
                  {!slot.full && slot.remaining <= 20 && (
                    <span className={['text-[10px]', time === slot.time ? 'text-stone-300' : 'text-stone-400'].join(' ')}>
                      {slot.remaining}석 남음
                    </span>
                  )}
                </button>
              );
            })}
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
        <div className="mb-2 flex items-baseline justify-between">
          <label className="text-sm font-medium text-stone-700">메뉴 선택</label>
          <span className={['text-xs', menuTotal === partySize ? 'text-emerald-600' : 'text-stone-400'].join(' ')}>
            선택 인원 {menuTotal}/{partySize}명
          </span>
        </div>

        {menusError && <p className="text-sm text-red-600">{menusError}</p>}
        {!menusError && menus === null && <p className="text-sm text-stone-400">메뉴를 불러오는 중…</p>}
        {!menusError && menus?.length === 0 && <p className="text-sm text-stone-400">현재 선택 가능한 메뉴가 없습니다.</p>}

        {!menusError && menus && menus.length > 0 && (
          <div className="space-y-2">
            {menus.map(menu => {
              const qty = menuQty[menu.id] ?? 0;
              return (
                <div key={menu.id} className="rounded-xl border border-stone-300 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-stone-900">{menu.name}</div>
                      {menu.description && <p className="mt-1 text-xs leading-relaxed text-stone-500">{menu.description}</p>}
                      {menu.price !== null && (
                        <div className="mt-1 text-xs font-medium text-stone-600">{menu.price.toLocaleString('ko-KR')}원</div>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setQty(menu.id, qty - 1)}
                        disabled={qty <= 0}
                        className="h-8 w-8 rounded-full border border-stone-300 text-stone-700 hover:border-stone-500 disabled:opacity-30"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-medium text-stone-900">{qty}</span>
                      <button
                        type="button"
                        onClick={() => setQty(menu.id, qty + 1)}
                        className="h-8 w-8 rounded-full border border-stone-300 text-stone-700 hover:border-stone-500"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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

      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700">특별 요청사항 (선택)</label>
        <textarea
          value={specialRequests}
          onChange={e => setSpecialRequests(e.target.value)}
          maxLength={200}
          rows={3}
          placeholder="알레르기, 매운 음식 조절 등 요청사항을 적어주세요."
          className="w-full resize-none rounded-xl border border-stone-300 px-4 py-3 text-stone-900 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
        />
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
