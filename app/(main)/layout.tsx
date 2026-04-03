import type { Metadata } from "next";
import { Geist, Geist_Mono, Mulish } from "next/font/google";
import "./globals.css";

const mulish = Mulish({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"], // tùy chọn
});

export const metadata: Metadata = {
  title: "Game App",
  description: "Game App On PC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${mulish.className} h-full antialiased`}

    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
