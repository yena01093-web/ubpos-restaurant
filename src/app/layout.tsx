import type { Metadata } from "next";
import { Song_Myung } from "next/font/google";
import "./globals.css";

const songMyung = Song_Myung({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-song-myung",
});

export const metadata: Metadata = {
  title: "약채락 성현",
  description: "충북 제천 청풍호, 몸에 이로운 약채 한 상 — 약채락 성현",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={songMyung.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
