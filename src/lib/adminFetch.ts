'use client';
import { getAdminAuth } from './firebase/client';

/** 관리자 로그인 세션의 ID Token을 붙여 API route를 호출하는 fetch 헬퍼. */
export async function adminFetch(path: string, init?: RequestInit) {
  const user = getAdminAuth().currentUser;
  if (!user) throw new Error('로그인이 필요합니다.');
  const idToken = await user.getIdToken();

  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
      Authorization: `Bearer ${idToken}`,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `요청에 실패했습니다 (${res.status})`);
  return data;
}
