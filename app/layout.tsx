import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import React from 'react';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { SessionProvider } from '@/components/providers/SessionProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Shift Editor - アルバイトシフト管理アプリ',
  description: 'シフト希望の提出から確定、勤怠管理までを効率化するアルバイトシフト管理システム',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <SessionProvider>
          {children}
          {/* Toasterは主にシステムからのフィードバック通知（エラーや成功メッセージ）に使用 */}
          <Toaster />
          {/* SonnerToasterはユーザーアクション後の一時的な通知に使用 */}
          <SonnerToaster position="top-right" richColors closeButton />
        </SessionProvider>
      </body>
    </html>
  );
} 