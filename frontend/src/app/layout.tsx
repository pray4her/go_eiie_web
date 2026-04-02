import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { ChunkLoadRecovery } from "@/components/system/chunk-load-recovery";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EIIE 工作台",
  description: "信息提取、简历与标注等业务工作台",
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NuqsAdapter>
          <ChunkLoadRecovery />
          {children}
          <Toaster />
        </NuqsAdapter>
      </body>
    </html>
  );
}
