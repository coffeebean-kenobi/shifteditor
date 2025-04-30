'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Calendar, Users, ClipboardCheck, AreaChart } from 'lucide-react';

export default function ReportsDashboard() {
  const reportTypes = [
    {
      title: 'シフトレポート',
      description: 'シフト分布、部署別配置、希望達成率などの分析',
      icon: <Calendar className="h-12 w-12 text-primary" />,
      link: '/admin/reports/shifts',
      features: [
        '期間別シフト分析',
        '部署/役割別人員配置',
        'シフト充足率の確認',
        '希望シフト達成率'
      ]
    },
    {
      title: '勤怠レポート',
      description: '出勤状況、遅刻・欠勤傾向、勤務時間の分析',
      icon: <ClipboardCheck className="h-12 w-12 text-primary" />,
      link: '/admin/reports/attendance',
      features: [
        '勤怠状況のトレンド分析',
        '遅刻・欠勤傾向の把握',
        '勤務時間の集計',
        '定時出勤率の確認'
      ]
    },
    {
      title: 'スタッフレポート',
      description: 'スタッフごとのパフォーマンス、勤務実績、給与予測',
      icon: <Users className="h-12 w-12 text-primary" />,
      link: '/admin/reports/staff',
      features: [
        'スタッフ別勤務実績',
        'パフォーマンス評価',
        '勤務効率の分析',
        '給与予測計算'
      ]
    }
  ];

  return (
    <div className="container p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">レポート &amp; 分析</h1>
        <p className="text-muted-foreground mt-2">
          シフト管理、勤怠状況、スタッフパフォーマンスの詳細分析と統計レポート
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* レポートタイプカード */}
        {reportTypes.map((report, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                {report.icon}
                <AreaChart className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardTitle className="mt-4">{report.title}</CardTitle>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-4">
                {report.features.map((feature, idx) => (
                  <li key={idx}>{feature}</li>
                ))}
              </ul>
              <Link href={report.link} passHref>
                <Button className="w-full">
                  レポートを表示
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 最近のレポート */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>最近のレポート</CardTitle>
          <CardDescription>
            最近生成・閲覧したレポートの履歴
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto rounded-md border">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted">
                <tr>
                  <th scope="col" className="px-6 py-3">レポート名</th>
                  <th scope="col" className="px-6 py-3">タイプ</th>
                  <th scope="col" className="px-6 py-3">期間</th>
                  <th scope="col" className="px-6 py-3">生成日時</th>
                  <th scope="col" className="px-6 py-3">アクション</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white border-b hover:bg-muted/50">
                  <td className="px-6 py-4 font-medium">4月度シフト分析</td>
                  <td className="px-6 py-4">シフト</td>
                  <td className="px-6 py-4">2025/04/01 - 2025/04/30</td>
                  <td className="px-6 py-4">2025/04/15 13:45</td>
                  <td className="px-6 py-4">
                    <Link href="/admin/reports/shifts" className="text-primary hover:underline">表示</Link>
                  </td>
                </tr>
                <tr className="bg-white border-b hover:bg-muted/50">
                  <td className="px-6 py-4 font-medium">第1週勤怠状況</td>
                  <td className="px-6 py-4">勤怠</td>
                  <td className="px-6 py-4">2025/04/01 - 2025/04/07</td>
                  <td className="px-6 py-4">2025/04/08 09:30</td>
                  <td className="px-6 py-4">
                    <Link href="/admin/reports/attendance" className="text-primary hover:underline">表示</Link>
                  </td>
                </tr>
                <tr className="bg-white hover:bg-muted/50">
                  <td className="px-6 py-4 font-medium">スタッフパフォーマンス分析</td>
                  <td className="px-6 py-4">スタッフ</td>
                  <td className="px-6 py-4">2025/03/01 - 2025/03/31</td>
                  <td className="px-6 py-4">2025/04/02 11:20</td>
                  <td className="px-6 py-4">
                    <Link href="/admin/reports/staff" className="text-primary hover:underline">表示</Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* レポート作成 */}
      <Card>
        <CardHeader>
          <CardTitle>カスタムレポート作成</CardTitle>
          <CardDescription>
            必要な情報を組み合わせた独自のレポートを作成
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/reports/shifts" passHref>
            <Button variant="outline" className="w-full flex items-center justify-center gap-2 h-auto py-4">
              <BarChart3 className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">シフト分析レポート</div>
                <div className="text-xs text-muted-foreground">カスタム期間でシフト状況を分析</div>
              </div>
            </Button>
          </Link>
          <Link href="/admin/reports/attendance" passHref>
            <Button variant="outline" className="w-full flex items-center justify-center gap-2 h-auto py-4">
              <ClipboardCheck className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">勤怠分析レポート</div>
                <div className="text-xs text-muted-foreground">勤怠データの詳細分析</div>
              </div>
            </Button>
          </Link>
          <Link href="/admin/reports/staff" passHref>
            <Button variant="outline" className="w-full flex items-center justify-center gap-2 h-auto py-4">
              <Users className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">スタッフ分析レポート</div>
                <div className="text-xs text-muted-foreground">スタッフごとのパフォーマンス分析</div>
              </div>
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
} 