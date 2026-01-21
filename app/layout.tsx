import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import TtsInitializer from "@/components/TtsInitializer";
import DevTtsPanel from "@/src/components/DevTtsPanel";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Happy Sentences - 행복을 주는 문장",
  description: "단어 하나만 적어도 됩니다. 행복과 안정을 주는 문장 3개를 만들어드립니다.",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover", // 🆕 iOS safe-area 지원
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <TtsInitializer />
          {children}
          <DevTtsPanel />
        </Providers>
      </body>
    </html>
  );
}
