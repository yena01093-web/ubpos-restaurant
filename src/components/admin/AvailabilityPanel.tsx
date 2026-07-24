'use client';
import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/adminFetch';
import { DEFAULT_AVAILABILITY } from '@/lib/reservations';
import type { AvailabilitySettings, Weekday } from '@/types';

const DAY_LABEL: Record<Weekday, string> = { sun: '일', mon: '월', tue: '화', wed: '수', thu: '목', fri: '금', sat: '토' };
const WEEKDAYS: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export default function AvailabilityPanel() {
  const [settings, setSettings] = useState<AvailabilitySettings | null>(null);
  const [newClosedDate, setNewClosedDate] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await adminFetch('/api/admin/availability');
        setSettings(data.settings ?? DEFAULT_AVAILABILITY);
      } catch (err) {
        setError(err instanceof Error ? err.message : '불러오기에 실패했습니다.');
      }
    })();
  }, []);

  const save = async () => {
    if (!settings) return;
    setStatus('saving');
    setError(null);
    try {
      await adminFetch('/api/admin/availability', { method: 'PUT', body: JSON.stringify(settings) });
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 1500);
    } catch (err) {
      setStatus('idle');
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
    }
  };

  if (error && !settings) return <p className="text-sm text-red-600">{error}</p>;
  if (!settings) return <p className="text-sm text-stone-400">불러오는 중…</p>;

  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-stone-900">요일별 영업시간</h3>
        <div className="space-y-2">
          {WEEKDAYS.map(day => {
            const hours = settings.weeklyHours[day];
            return (
              <div key={day} className="flex flex-wrap items-center gap-3 rounded-lg border border-stone-200 px-3 py-2">
                <span className="w-6 text-sm font-medium text-stone-700">{DAY_LABEL[day]}</span>
                <label className="flex items-center gap-1.5 text-xs text-stone-500">
                  <input
                    type="checkbox"
                    checked={hours.closed}
                    onChange={e =>
                      setSettings({
                        ...settings,
                        weeklyHours: { ...settings.weeklyHours, [day]: { ...hours, closed: e.target.checked } },
                      })
                    }
                  />
                  휴무
                </label>
                <input
                  type="time"
                  value={hours.open}
                  disabled={hours.closed}
                  onChange={e =>
                    setSettings({ ...settings, weeklyHours: { ...settings.weeklyHours, [day]: { ...hours, open: e.target.value } } })
                  }
                  className="rounded-md border border-stone-300 px-2 py-1 text-sm disabled:opacity-40"
                />
                <span className="text-stone-300">–</span>
                <input
                  type="time"
                  value={hours.close}
                  disabled={hours.closed}
                  onChange={e =>
                    setSettings({ ...settings, weeklyHours: { ...settings.weeklyHours, [day]: { ...hours, close: e.target.value } } })
                  }
                  className="rounded-md border border-stone-300 px-2 py-1 text-sm disabled:opacity-40"
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">예약 간격(분)</label>
          <input
            type="number"
            min={5}
            max={240}
            value={settings.slotIntervalMinutes}
            onChange={e => setSettings({ ...settings, slotIntervalMinutes: Number(e.target.value) })}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">시간대당 총 좌석 수</label>
          <input
            type="number"
            min={1}
            max={9999}
            value={settings.maxGuestsPerSlot}
            onChange={e => setSettings({ ...settings, maxGuestsPerSlot: Number(e.target.value) })}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-stone-400">해당 시간대 예약 인원 합계가 이 좌석 수를 넘으면 마감 처리됩니다.</p>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-stone-900">휴무일 지정</h3>
        <div className="flex gap-2">
          <input
            type="date"
            value={newClosedDate}
            onChange={e => setNewClosedDate(e.target.value)}
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => {
              if (!newClosedDate || settings.closedDates.includes(newClosedDate)) return;
              setSettings({ ...settings, closedDates: [...settings.closedDates, newClosedDate].sort() });
              setNewClosedDate('');
            }}
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-700 hover:border-stone-500"
          >
            추가
          </button>
        </div>
        {settings.closedDates.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {settings.closedDates.map(d => (
              <li key={d} className="flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600">
                {d}
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, closedDates: settings.closedDates.filter(x => x !== d) })}
                  className="text-stone-400 hover:text-stone-700"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={save}
        disabled={status === 'saving'}
        className="w-full rounded-xl bg-stone-800 py-3 text-sm font-semibold text-white transition hover:bg-stone-900 disabled:opacity-50"
      >
        {status === 'saving' ? '저장 중…' : status === 'saved' ? '저장됨 ✓' : '설정 저장'}
      </button>
    </div>
  );
}
