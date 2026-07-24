'use client';
import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/adminFetch';
import type { Reservation } from '@/types';

const STATUS_LABEL: Record<string, string> = { confirmed: '확정', cancelled: '취소', completed: '완료' };
const STATUS_COLOR: Record<string, string> = {
  confirmed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-stone-200 text-stone-500 line-through',
  completed: 'bg-blue-100 text-blue-700',
};

export default function ReservationsPanel() {
  const [date, setDate] = useState('');
  const [reservations, setReservations] = useState<Reservation[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const qs = date ? `?date=${date}` : '';
      const data = await adminFetch(`/api/admin/reservations${qs}`);
      setReservations(data.reservations);
    } catch (err) {
      setError(err instanceof Error ? err.message : '불러오기에 실패했습니다.');
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await adminFetch(`/api/admin/reservations/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setReservations(prev => prev?.map(r => (r.id === id ? { ...r, status: status as Reservation['status'] } : r)) ?? null);
    } catch (err) {
      alert(err instanceof Error ? err.message : '변경에 실패했습니다.');
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />
        {date && (
          <button onClick={() => setDate('')} className="text-xs text-stone-400 underline">
            전체 보기
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {!error && reservations === null && <p className="text-sm text-stone-400">불러오는 중…</p>}
      {!error && reservations?.length === 0 && <p className="text-sm text-stone-400">예약이 없습니다.</p>}

      {!error && reservations && reservations.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-stone-400">
                <th className="py-2 pr-4 font-medium">날짜</th>
                <th className="py-2 pr-4 font-medium">시간</th>
                <th className="py-2 pr-4 font-medium">이름</th>
                <th className="py-2 pr-4 font-medium">연락처</th>
                <th className="py-2 pr-4 font-medium">인원</th>
                <th className="py-2 pr-4 font-medium">상태</th>
                <th className="py-2 font-medium">처리</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map(r => (
                <tr key={r.id} className="border-b border-stone-100">
                  <td className="py-2 pr-4">{r.date}</td>
                  <td className="py-2 pr-4">{r.time}</td>
                  <td className="py-2 pr-4">{r.name}</td>
                  <td className="py-2 pr-4">{r.phone}</td>
                  <td className="py-2 pr-4">{r.partySize}명</td>
                  <td className="py-2 pr-4">
                    <span className={`rounded-full px-2 py-1 text-xs ${STATUS_COLOR[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                  </td>
                  <td className="py-2 whitespace-nowrap">
                    {r.status !== 'cancelled' && (
                      <button onClick={() => updateStatus(r.id, 'cancelled')} className="mr-3 text-xs text-red-500 underline">
                        취소
                      </button>
                    )}
                    {r.status !== 'completed' && (
                      <button onClick={() => updateStatus(r.id, 'completed')} className="text-xs text-blue-500 underline">
                        완료
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
