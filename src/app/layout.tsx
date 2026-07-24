import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "약채락 예약",
  description: "약채락 방문 예약",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
