import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "BrewLite — Cà phê cho ngày nhẹ tênh",
  description: "Chọn món yêu thích và đặt cà phê nhanh chóng cùng BrewLite.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
