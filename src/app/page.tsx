import Link from 'next/link';
import Image from 'next/image';
import { adminDb } from '@/lib/firebase/admin';
import { DEFAULT_AVAILABILITY, summarizeWeeklyHours } from '@/lib/reservations';
import type { AvailabilitySettings, Menu } from '@/types';

export const dynamic = 'force-dynamic';

const RESTAURANT = {
  name: '약채락 성현',
  address: '충북 제천시 청풍면 청풍호로54길 14-7',
  phone: '043-647-8892',
};

const HERO_IMAGE = 'https://images.unsplash.com/photo-1646416018801-8a9c84669350?auto=format&fit=crop&w=1600&q=80';
const MENU_IMAGE = 'https://images.unsplash.com/photo-1761303506087-9788d0a98e87?auto=format&fit=crop&w=1400&q=80';

const fmt = (n: number) => n.toLocaleString('ko-KR') + '원';

async function getMenus(): Promise<Menu[]> {
  const snap = await adminDb().collection('restaurant_menus').where('isActive', '==', true).get();
  return snap.docs
    .map(doc => ({ id: doc.id, ...(doc.data() as Omit<Menu, 'id'>) }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

async function getWeeklyHours() {
  const snap = await adminDb().doc('restaurant_settings/availability').get();
  const settings = (snap.data() as AvailabilitySettings | undefined) ?? DEFAULT_AVAILABILITY;
  return summarizeWeeklyHours(settings.weeklyHours);
}

export default async function Home() {
  const [menus, hours] = await Promise.all([getMenus(), getWeeklyHours()]);
  const mapUrl = `https://map.kakao.com/link/search/${encodeURIComponent(RESTAURANT.address)}`;

  return (
    <main className="bg-stone-50 text-stone-900">
      <SiteHeader />

      {/* 히어로 */}
      <section className="relative flex h-[92dvh] min-h-[560px] items-end overflow-hidden">
        <Image src={HERO_IMAGE} alt="청풍호" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/35 to-stone-950/10" />
        <div className="relative z-10 mx-auto w-full max-w-3xl px-6 pb-20 text-center text-stone-50">
          <p className="text-xs font-medium tracking-[0.3em] text-emerald-200">청풍호를 마주한 건강한 밥상</p>
          <h1 className="mt-4 font-[family-name:var(--font-song-myung)] text-5xl sm:text-6xl">{RESTAURANT.name}</h1>
          <p className="mt-5 text-sm leading-relaxed text-stone-200 sm:text-base">
            맛있는 것은 당연, 몸에도 이롭게 하는 것이 약채락 메뉴 만들기의 기본 생각입니다.
          </p>
          <Link
            href="/reserve"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-700 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            예약하기 <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {/* 소개 */}
      <section id="about" className="mx-auto max-w-2xl px-6 py-24 text-center">
        <span className="inline-block rounded-full border border-emerald-700/30 px-4 py-1 text-xs font-medium tracking-wide text-emerald-800">
          ※ 한식대가의 집 ※
        </span>
        <h2 className="mt-6 font-[family-name:var(--font-song-myung)] text-3xl">약채락의 마음</h2>
        <p className="mt-8 text-[15px] leading-[2] text-stone-600">
          맛있는 것은 당연, 몸에도 이롭게 하는 것이 약채락 메뉴 만들기의 기본 생각입니다.
          <br />
          우리땅 산약채를 우리 손으로 다듬고, 안전, 안심, 건강, 선도의 치열한 고집이 우리 생각의 중심입니다.
          <br />
          약채락이기 때문에 할 수 있는 것을 하나하나, 한잎한잎 정성을 다하겠습니다.
        </p>
      </section>

      {/* 메뉴 */}
      <section id="menu" className="bg-stone-100">
        <div className="mx-auto max-w-4xl px-6 py-24">
          <div className="mb-12 text-center">
            <p className="text-xs font-medium tracking-[0.3em] text-emerald-700">MENU</p>
            <h2 className="mt-3 font-[family-name:var(--font-song-myung)] text-3xl">정성으로 짓는 약채 한 상</h2>
          </div>

          <div className="relative mb-12 h-64 overflow-hidden rounded-2xl sm:h-80">
            <Image src={MENU_IMAGE} alt="약채락 한 상" fill sizes="(min-width: 640px) 896px, 100vw" className="object-cover" />
          </div>

          {menus.length === 0 ? (
            <p className="text-center text-sm text-stone-400">메뉴 준비 중입니다.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {menus.map(menu => (
                <div key={menu.id} className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-stone-200">
                  <h3 className="font-[family-name:var(--font-song-myung)] text-xl text-stone-900">{menu.name}</h3>
                  {menu.description && <p className="mt-3 text-sm leading-relaxed text-stone-500">{menu.description}</p>}
                  {menu.price !== null && <p className="mt-4 text-sm font-semibold text-emerald-800">{fmt(menu.price)}</p>}
                </div>
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <Link
              href="/reserve"
              className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-stone-800"
            >
              예약하기 <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 오시는 길 */}
      <section id="location" className="mx-auto max-w-2xl px-6 py-24">
        <div className="text-center">
          <p className="text-xs font-medium tracking-[0.3em] text-emerald-700">LOCATION</p>
          <h2 className="mt-3 font-[family-name:var(--font-song-myung)] text-3xl">오시는 길</h2>
        </div>

        <div className="mt-10 space-y-4 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-stone-200">
          <p className="text-[15px] text-stone-700">{RESTAURANT.address}</p>
          <a href={`tel:${RESTAURANT.phone}`} className="block text-[15px] font-medium text-stone-900">
            {RESTAURANT.phone}
          </a>

          <div className="!mt-6 border-t border-stone-100 pt-6">
            <dl className="mx-auto flex max-w-xs flex-col gap-1.5">
              {hours.map(row => (
                <div key={row.label} className="flex justify-between text-sm">
                  <dt className="text-stone-400">{row.label}</dt>
                  <dd className="font-medium text-stone-700">{row.hours}</dd>
                </div>
              ))}
            </dl>
          </div>

          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="!mt-6 inline-flex items-center gap-2 rounded-full border border-stone-300 px-6 py-2.5 text-sm font-medium text-stone-700 transition hover:border-stone-500"
          >
            카카오맵에서 길찾기 <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-6 text-stone-50 sm:px-10">
      <span className="font-[family-name:var(--font-song-myung)] text-lg">{RESTAURANT.name}</span>
      <nav className="hidden items-center gap-8 text-sm sm:flex">
        <a href="#about" className="hover:text-emerald-200">
          소개
        </a>
        <a href="#menu" className="hover:text-emerald-200">
          메뉴
        </a>
        <a href="#location" className="hover:text-emerald-200">
          오시는 길
        </a>
      </nav>
      <Link
        href="/reserve"
        className="rounded-full bg-stone-50/10 px-5 py-2 text-sm font-medium ring-1 ring-inset ring-stone-50/40 backdrop-blur transition hover:bg-stone-50/20"
      >
        예약하기
      </Link>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="bg-stone-900 px-6 py-12 text-center text-stone-400">
      <p className="font-[family-name:var(--font-song-myung)] text-lg text-stone-100">{RESTAURANT.name}</p>
      <p className="mt-3 text-sm">
        {RESTAURANT.address} · {RESTAURANT.phone}
      </p>
      <p className="mt-6 text-xs text-stone-500">
        © {new Date().getFullYear()} {RESTAURANT.name}. ·{' '}
        <Link href="/admin" className="underline hover:text-stone-300">
          관리자
        </Link>
      </p>
    </footer>
  );
}
