import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { CartProvider } from "@/components/cart/cart-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "BrewLite — Cà phê ngon, bắt đầu ngày mới",
  description: "Chọn món yêu thích và đặt cà phê nhanh chóng cùng BrewLite.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F5EBDD",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
