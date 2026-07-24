'use client';
import { useState } from 'react';
import DetailsStep from './DetailsStep';
import PhoneVerifyStep from './PhoneVerifyStep';
import ConfirmStep from './ConfirmStep';
import type { ReservationDraft } from '@/types';

type Step = 'details' | 'verify' | 'done';

const STEP_LABEL: Record<Step, string> = {
  details: '예약 정보',
  verify: '본인 확인',
  done: '예약 완료',
};

export default function ReservationWizard() {
  const [step, setStep] = useState<Step>('details');
  const [draft, setDraft] = useState<ReservationDraft | null>(null);

  return (
    <div className="mx-auto w-full max-w-md">
      <StepIndicator step={step} />

      {step === 'details' && (
        <DetailsStep
          onNext={d => {
            setDraft(d);
            setStep('verify');
          }}
        />
      )}

      {step === 'verify' && draft && (
        <PhoneVerifyStep draft={draft} onBack={() => setStep('details')} onConfirmed={() => setStep('done')} />
      )}

      {step === 'done' && draft && (
        <ConfirmStep
          draft={draft}
          onRestart={() => {
            setDraft(null);
            setStep('details');
          }}
        />
      )}
    </div>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const steps: Step[] = ['details', 'verify', 'done'];
  const activeIndex = steps.indexOf(step);
  return (
    <div className="mb-8 flex items-center gap-2">
      {steps.map((s, i) => (
        <div key={s} className="flex flex-1 items-center gap-2">
          <div
            className={[
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
              i <= activeIndex ? 'bg-stone-800 text-white' : 'bg-stone-200 text-stone-400',
            ].join(' ')}
          >
            {i + 1}
          </div>
          <span className={['text-xs', i <= activeIndex ? 'text-stone-800' : 'text-stone-400'].join(' ')}>
            {STEP_LABEL[s]}
          </span>
          {i < steps.length - 1 && <div className={['h-px flex-1', i < activeIndex ? 'bg-stone-800' : 'bg-stone-200'].join(' ')} />}
        </div>
      ))}
    </div>
  );
}
