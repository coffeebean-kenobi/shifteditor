import React from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">ダッシュボード</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 今日のシフト */}
        <div className="bg-card shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">今日のシフト</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">今日はシフトが登録されていません</p>
            <Link href="/shifts" className="text-primary hover:underline block">
              シフト一覧を見る &rarr;
            </Link>
          </div>
        </div>

        {/* シフト希望提出 */}
        <div className="bg-card shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">シフト希望提出</h2>
          <div className="space-y-4">
            <p className="text-muted-foreground">次回のシフト希望提出期限: 2023年4月15日</p>
            <Link href="/requests" className="text-primary hover:underline block">
              シフト希望を提出する &rarr;
            </Link>
          </div>
        </div>

        {/* お知らせ */}
        <div className="bg-card shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">お知らせ</h2>
          <div className="space-y-4">
            <div className="border-b pb-2">
              <p className="font-medium">4月のシフト確定のお知らせ</p>
              <p className="text-sm text-muted-foreground">2023年3月25日</p>
            </div>
            <div className="border-b pb-2">
              <p className="font-medium">システムメンテナンスのお知らせ</p>
              <p className="text-sm text-muted-foreground">2023年3月20日</p>
            </div>
            <Link href="#" className="text-primary hover:underline block">
              すべてのお知らせを見る &rarr;
            </Link>
          </div>
        </div>

        {/* 勤務実績 */}
        <div className="bg-card shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">今月の勤務実績</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>総勤務時間</span>
              <span className="font-semibold">42時間</span>
            </div>
            <div className="flex justify-between">
              <span>勤務日数</span>
              <span className="font-semibold">8日</span>
            </div>
            <Link href="/attendance" className="text-primary hover:underline block">
              勤務実績詳細 &rarr;
            </Link>
          </div>
        </div>

        {/* 次回シフト */}
        <div className="bg-card shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">次回のシフト</h2>
          <div className="space-y-4">
            <div className="font-medium">2023年4月2日 (日)</div>
            <div className="text-lg">10:00 - 18:00</div>
            <Link href="/shifts" className="text-primary hover:underline block">
              今後のシフトを見る &rarr;
            </Link>
          </div>
        </div>

        {/* クイックリンク */}
        <div className="bg-card shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">クイックリンク</h2>
          <div className="space-y-2">
            <Link href="/profile" className="text-primary hover:underline block">
              プロフィール設定
            </Link>
            <Link href="/swap-requests" className="text-primary hover:underline block">
              シフト交代申請
            </Link>
            <Link href="#" className="text-primary hover:underline block">
              マニュアル
            </Link>
            <Link href="#" className="text-primary hover:underline block">
              ヘルプ・お問い合わせ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 