import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Audax Coupons",
  description: "Coupon management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
