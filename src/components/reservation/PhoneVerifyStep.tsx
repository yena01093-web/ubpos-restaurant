'use client';
import { useRef, useState } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { getCustomerAuth } from '@/lib/firebase/client';
import type { ReservationDraft } from '@/types';

type Phase = 'idle' | 'sending' | 'sent' | 'verifying';

export default function PhoneVerifyStep({
  draft,
  onBack,
  onConfirmed,
}: {
  draft: ReservationDraft;
  onBack: () => void;
  onConfirmed: (reservationId: string) => void;
}) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);

  const sendCode = async () => {
    setError(null);
    setPhase('sending');
    try {
      const auth = getCustomerAuth();
      if (!verifierRef.current) {
        verifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      }
      const confirmation = await signInWithPhoneNumber(auth, draft.phoneE164, verifierRef.current);
      confirmationRef.current = confirmation;
      setPhase('sent');
    } catch (err) {
      setError(toFriendlyError(err));
      setPhase('idle');
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationRef.current) return;
    setError(null);
    setPhase('verifying');
    try {
      const credential = await confirmationRef.current.confirm(code);
      const idToken = await credential.user.getIdToken();
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          date: draft.date,
          time: draft.time,
          partySize: draft.partySize,
          name: draft.name,
          menuSelections: draft.menuSelections.map(({ menuId, quantity }) => ({ menuId, quantity })),
          specialRequests: draft.specialRequests || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '예약에 실패했습니다.');
      onConfirmed(data.id);
    } catch (err) {
      setError(toFriendlyError(err));
      setPhase('sent');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-stone-50 p-4 text-sm text-stone-600">
        <p className="font-medium text-stone-900">
          {draft.date} · {draft.time} · {draft.partySize}명
        </p>
        <p className="mt-1">
          {draft.name} · {draft.phoneDisplay}
        </p>
        <p className="mt-2 text-stone-500">
          {draft.menuSelections.map(s => `${s.menuName} ${s.quantity}인분`).join(', ')}
        </p>
        {draft.specialRequests && <p className="mt-1 text-stone-500">요청사항: {draft.specialRequests}</p>}
      </div>

      {phase !== 'sent' && phase !== 'verifying' ? (
        <button
          type="button"
          onClick={sendCode}
          disabled={phase === 'sending'}
          className="w-full rounded-xl bg-stone-800 py-3.5 text-sm font-semibold text-white transition hover:bg-stone-900 disabled:opacity-50"
        >
          {phase === 'sending' ? '전송 중…' : `${draft.phoneDisplay}로 인증번호 받기`}
        </button>
      ) : (
        <form onSubmit={verifyCode} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700">인증번호 6자리</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="123456"
              className="w-full rounded-xl border border-stone-300 px-4 py-3 text-center text-lg tracking-[0.5em] text-stone-900 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
            />
          </div>
          <button
            type="submit"
            disabled={phase === 'verifying' || code.length !== 6}
            className="w-full rounded-xl bg-stone-800 py-3.5 text-sm font-semibold text-white transition hover:bg-stone-900 disabled:opacity-50"
          >
            {phase === 'verifying' ? '확인 중…' : '인증하고 예약 확정하기'}
          </button>
          <button type="button" onClick={sendCode} className="w-full text-center text-xs text-stone-400 underline">
            인증번호 다시 받기
          </button>
        </form>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="button" onClick={onBack} className="w-full text-center text-sm text-stone-400 underline">
        이전으로
      </button>

      {/* Firebase Phone Auth 보이지 않는 reCAPTCHA가 렌더링되는 자리 */}
      <div id="recaptcha-container" />
    </div>
  );
}

function toFriendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  if (code === 'auth/invalid-verification-code') return '인증번호가 올바르지 않습니다.';
  if (code === 'auth/code-expired') return '인증번호가 만료되었습니다. 다시 받아주세요.';
  if (code === 'auth/too-many-requests') return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
  if (err instanceof Error) return err.message;
  return '알 수 없는 오류가 발생했습니다.';
}
