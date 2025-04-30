import React from 'react';
import { AdminSidebar } from './components/AdminSidebar';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 認証チェック
  const session = await getServerSession(authOptions);
  
  // セッションがない場合やADMIN権限がない場合はリダイレクト
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login?callbackUrl=/admin');
  }

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  );
} 