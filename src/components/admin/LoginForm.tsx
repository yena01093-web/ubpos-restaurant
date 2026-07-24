'use client';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getAdminAuth } from '@/lib/firebase/client';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(getAdminAuth(), email, password);
    } catch {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-24 max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-stone-200">
      <h1 className="text-lg font-semibold text-stone-900">관리자 로그인</h1>
      <p className="mt-1 text-sm text-stone-400">약채락 예약 관리 페이지</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="이메일"
          className="w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
        />
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="비밀번호"
          className="w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-900 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-stone-800 py-3 text-sm font-semibold text-white transition hover:bg-stone-900 disabled:opacity-50"
        >
          {loading ? '로그인 중…' : '로그인'}
        </button>
      </form>
    </div>
  );
}
