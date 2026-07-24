import 'server-only';
import { NextRequest } from 'next/server';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { adminAuth } from './firebase/admin';

/** Authorization: Bearer <idToken> 헤더를 검증해 디코딩된 토큰을 반환한다. 실패 시 null. */
export async function verifyIdToken(req: NextRequest): Promise<DecodedIdToken | null> {
  const header = req.headers.get('authorization') ?? '';
  const match = header.match(/^Bearer (.+)$/);
  if (!match) return null;
  try {
    return await adminAuth().verifyIdToken(match[1]);
  } catch {
    return null;
  }
}

/**
 * 관리자 전용 API 가드. 관리자 계정은 Firebase 콘솔에서 이메일/비밀번호로만 수동
 * 생성하므로, 토큰의 로그인 방식이 'password'인지로 안전하게 구분할 수 있다
 * (고객은 전화번호 인증 'phone' 방식이라 자동으로 걸러진다).
 */
export async function requireAdmin(req: NextRequest): Promise<DecodedIdToken | null> {
  const decoded = await verifyIdToken(req);
  if (!decoded) return null;
  if (decoded.firebase?.sign_in_provider !== 'password') return null;
  return decoded;
}
