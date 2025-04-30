import React from 'react';
import { Metadata } from 'next';
import Settings from './components/Settings';

export const metadata: Metadata = {
  title: 'システム設定 | 管理者ダッシュボード',
  description: '店舗の営業時間、シフト設定、通知設定などシステム全体の設定を管理します。',
};

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">システム設定</h1>
      <Settings />
    </div>
  );
} 