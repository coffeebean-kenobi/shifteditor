import React from 'react';
import { Metadata } from 'next';
import StaffManagement from './components/StaffManagement';

export const metadata: Metadata = {
  title: 'スタッフ管理 | 管理者ダッシュボード',
  description: 'スタッフの管理、招待、権限設定を行います。',
};

export default function StaffPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">スタッフ管理</h1>
      <StaffManagement />
    </div>
  );
} 