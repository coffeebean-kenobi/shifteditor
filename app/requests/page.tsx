import React from 'react';
import Link from 'next/link';

export default function RequestsPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">シフト希望提出</h1>
      
      <div className="bg-card shadow rounded-lg p-6 mb-6">
        <p className="text-muted-foreground mb-4">現在シフト希望の提出期間ではありません。次回の提出期間をお待ちください。</p>
        <Link href="/dashboard" className="text-primary hover:underline">
          &larr; ダッシュボードに戻る
        </Link>
      </div>
    </div>
  );
} 