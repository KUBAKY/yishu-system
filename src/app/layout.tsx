import type { Metadata } from "next";
import { Noto_Serif_SC, Ma_Shan_Zheng } from "next/font/google";
import "./globals.css";

const notoSerifSC = Noto_Serif_SC({
  weight: ["400", "700"],
  preload: false,
  display: "swap",
  variable: "--font-noto-serif-sc",
});

const maShanZheng = Ma_Shan_Zheng({
  weight: ["400"],
  preload: false,
  display: "swap",
  variable: "--font-ma-shan-zheng",
});

export const metadata: Metadata = {
  title: {
    default: "易枢",
    template: "%s | 易枢",
  },
  description: "易枢智能术数推演系统，提供多范式术数入口与可解释推演体验。",
};

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/ui/Toast";
import { TabBar } from "@/components/ui/TabBar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${notoSerifSC.variable} ${maShanZheng.variable} antialiased`}
      >
        <ErrorBoundary>
          <ToastProvider>
            {children}
            <TabBar />
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
