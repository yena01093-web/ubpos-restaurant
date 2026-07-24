# ubpos-restaurant — 약채락 예약 시스템

약채락 방문 예약을 위한 독립 웹 앱. 고객용 예약 페이지(날짜·시간·인원 선택 + 전화번호 SMS 인증)와 관리자 페이지(예약 목록, 예약 가능 시간대 설정)로 구성됩니다.

다른 사내 프로젝트(`ubpos-food` 등)와 코드/레포가 전혀 얽혀 있지 않은 완전 독립 프로젝트라, 이 저장소만 따로 넘겨도 그대로 실행됩니다.

## 기술 스택

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Firebase — Firestore(데이터) + Authentication(고객 전화번호 인증 / 관리자 이메일·비밀번호 로그인)
  - **새 Firebase 프로젝트가 아니라 기존 `cruise-unified` 프로젝트를 재사용합니다.** 아래 "Firebase 설정" 참고
- 배포: Vercel (Firebase는 백엔드로만 사용, Firebase Hosting은 쓰지 않음)

## 보안 구조 (중요)

이 앱은 브라우저에서 Firestore에 **직접** 접근하지 않습니다. 모든 읽기/쓰기는 Next.js API route가 `firebase-admin`(서버 전용 관리자 SDK)을 통해 처리합니다. 그래서:

- Firestore 보안 규칙을 전혀 건드리지 않아도 되고, `cruise-unified`의 기존 규칙/다른 앱에 영향을 주지 않습니다.
- 클라이언트는 Firebase Auth(로그인/전화 인증)와 이 프로젝트의 API만 호출합니다.
- 고객 예약 생성(`POST /api/reservations`)은 전화번호 인증을 마친 사용자의 ID Token을 서버가 직접 검증해서, 요청 본문이 아니라 **토큰 안의 검증된 전화번호**를 신뢰합니다.
- 관리자 전용 API는 ID Token의 `firebase.sign_in_provider`가 `password`(이메일/비밀번호 로그인)인지로 구분합니다. 회원가입 화면이 없고 관리자 계정은 Firebase 콘솔에서만 수동으로 만들 수 있기 때문에 안전하게 성립합니다.

## Firestore 데이터

기존 유람선(cruise) 관련 컬렉션과 절대 섞이지 않도록, 이 앱은 `restaurant_` 접두사가 붙은 컬렉션만 사용합니다. 기존 컬렉션은 읽지도 쓰지도 않습니다.

- `restaurant_reservations/{id}` — `{ name, phone, date, time, partySize, status, createdAt }`
- `restaurant_settings/availability` (문서 1개) — 요일별 영업시간, 예약 간격(분), 시간대당 최대 예약 건수, 휴무일 목록

## Firebase 설정 (cruise-unified 프로젝트 재사용)

1. [Firebase 콘솔](https://console.firebase.google.com/)에서 `cruise-unified` 프로젝트를 엽니다.
2. **Authentication → Sign-in method**에서 아래 두 로그인 방식을 켭니다 (이미 켜져 있으면 넘어가도 됨):
   - **전화** (고객 SMS 인증용)
   - **이메일/비밀번호** (관리자 로그인용)
3. **Authentication → Users**에서 관리자 계정을 최소 1개 수동으로 추가합니다 (이메일 + 비밀번호). 이 계정으로 `/admin`에 로그인합니다.
4. **프로젝트 설정 → 일반 → 내 앱**에 웹 앱이 있으면 그 설정값을, 없으면 웹 앱을 하나 추가해서 `firebaseConfig` 값을 확인 후 `.env.local`의 `NEXT_PUBLIC_FIREBASE_*` 항목에 채웁니다.
5. **프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성**을 눌러 JSON 키 파일을 내려받습니다. 파일 안의 `project_id`, `client_email`, `private_key` 값을 `.env.local`의 `FIREBASE_*` 항목에 채웁니다. (이 키는 절대 커밋하지 마세요 — `.env.local`은 `.gitignore`에 포함되어 있습니다.)
6. (선택, 실제 SMS 비용 없이 테스트하고 싶을 때) **Authentication → Sign-in method → 전화 → 테스트용 전화번호**에 테스트 번호와 고정 인증번호(예: `+821000000000` / `123456`)를 등록해두면 실제 SMS 발송 없이 예약 플로우를 끝까지 확인할 수 있습니다.
7. Firestore가 아직 없다면 **Firestore Database**에서 데이터베이스를 생성합니다 (이미 유람선 앱이 쓰고 있다면 생성할 필요 없음 — 같은 데이터베이스 안에 새 컬렉션만 추가됩니다).

## 로컬 실행

```bash
cp .env.example .env.local   # 위 단계에서 받은 값으로 채우기
npm install
npm run dev
```

- 고객 예약 페이지: http://localhost:3000
- 관리자 페이지: http://localhost:3000/admin

## 배포 (Vercel)

1. 이 저장소를 GitHub에 올립니다.
2. Vercel에서 새 프로젝트로 이 저장소를 연결합니다.
3. Vercel 프로젝트의 Environment Variables에 `.env.local`과 동일한 항목을 모두 등록합니다 (`FIREBASE_PRIVATE_KEY`는 줄바꿈이 `\n`으로 이스케이프된 문자열 그대로 넣으면 됩니다).
4. 배포.

## 폴더 구조

```
src/
  app/
    page.tsx                 예약 페이지 (고객)
    admin/page.tsx            관리자 페이지 (로그인 + 대시보드)
    api/
      availability/           GET  특정 날짜의 예약 가능 시간대 조회 (공개)
      reservations/            POST 예약 생성 (전화 인증 필요)
      admin/reservations/      GET  예약 목록 / [id] PATCH 상태 변경 (관리자 전용)
      admin/availability/      GET·PUT 예약 가능 시간대 설정 (관리자 전용)
  components/
    reservation/               예약 위저드(날짜·시간·인원 → 전화 인증 → 확정) 구성 컴포넌트
    admin/                     관리자 대시보드 구성 컴포넌트
  lib/
    firebase/client.ts         브라우저용 Firebase SDK 초기화 (관리자 로그인 앱 / 고객 전화인증 앱 분리)
    firebase/admin.ts          서버 전용 firebase-admin 초기화
    auth.ts                    API route에서 쓰는 ID Token 검증 / 관리자 권한 확인 헬퍼
    reservations.ts            영업시간·예약 간격으로 시간 슬롯을 계산하는 공용 로직
    phone.ts                   한국 휴대폰 번호 ↔ E.164 변환
  types/index.ts                공용 타입
```

## 주의: firebase-admin 버전 고정

`firebase-admin`은 `^13.10.0`으로 고정되어 있습니다. `14.x`부터는 내부적으로 `jwks-rsa@4.x`(→ ESM 전용 `jose@6.x`)를 물고 오는데, 이걸 Vercel의 Next.js 서버리스 런타임이 번들링하면서 `require()`가 실패해 **모든 API route가 500(ERR_REQUIRE_ESM)** 으로 죽습니다 (로컬 `next dev`/`next build`에서는 증상이 안 나타나서 배포하고 나서야 발견하기 쉬운 문제입니다). `npm update`나 의존성 업그레이드 시 `firebase-admin`을 14 이상으로 올리지 마세요 — 꼭 올려야 한다면 배포 후 API route를 실제로 호출해보고 확인하세요.

## 향후 확장 아이디어

- 예약 취소 시 고객에게 알림톡/SMS 발송 (현재는 관리자가 목록에서 상태만 변경)
- 시간대 용량을 "예약 건수" 대신 "총 인원수" 기준으로 바꾸고 싶다면 `src/lib/reservations.ts`의 `computeAvailableSlots`만 손보면 됩니다.
- 관리자 계정 여러 명 운영 시, 별도 UI 없이 Firebase 콘솔에서 계정을 추가/삭제하면 됩니다.
