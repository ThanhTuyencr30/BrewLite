import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Colden Coffee — Cà phê ngon, bắt đầu ngày mới",
  description: "Chọn món yêu thích và đặt cà phê nhanh chóng cùng Colden Coffee.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
