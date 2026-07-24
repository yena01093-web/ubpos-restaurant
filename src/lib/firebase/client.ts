import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getOrInitApp(name?: string): FirebaseApp {
  const existing = getApps().find(a => a.name === (name ?? '[DEFAULT]'));
  if (existing) return existing;
  return name ? initializeApp(firebaseConfig, name) : initializeApp(firebaseConfig);
}

/** 관리자 로그인(이메일/비밀번호) 전용 Auth — 기본 앱. */
export function getAdminAuth(): Auth {
  return getAuth(getOrInitApp());
}

/**
 * 고객 전화번호 인증 전용 Auth — 이름을 붙인 별도 Firebase 앱 인스턴스라
 * 관리자 로그인 세션과 같은 브라우저에서도 서로 덮어쓰지 않는다.
 */
export function getCustomerAuth(): Auth {
  return getAuth(getOrInitApp('customer'));
}
