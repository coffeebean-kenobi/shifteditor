import React from 'react';
import Link from 'next/link';

export default function SwapRequestsPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">シフト交代申請</h1>
      
      <div className="bg-card shadow rounded-lg p-6 mb-6">
        <p className="text-muted-foreground mb-4">シフト交代申請機能は現在準備中です。近日中に公開予定です。</p>
        <Link href="/dashboard" className="text-primary hover:underline">
          &larr; ダッシュボードに戻る
        </Link>
      </div>
    </div>
  );
} 