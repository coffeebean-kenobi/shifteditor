import React from 'react';
import { StatsCard } from './components/StatsCard';
import { ActivityFeed } from './components/ActivityFeed';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { 
  Users, 
  Calendar, 
  ClipboardCheck, 
  AlertTriangle 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { ja } from 'date-fns/locale';
import AttendanceChart from '@/components/attendance/AttendanceChart';

// モックデータ（実際のプロジェクトではデータベースから取得）
const mockActivities = [
  {
    id: '1',
    type: 'SHIFT_CREATED' as const,
    message: '5月のシフトを作成しました',
    userId: 'user1',
    userName: '管理者 太郎',
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30分前
  },
  {
    id: '2',
    type: 'REQUEST_APPROVED' as const,
    message: '田中さんのシフト希望を承認しました',
    userId: 'user1',
    userName: '管理者 太郎',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2時間前
  },
  {
    id: '3',
    type: 'STAFF_ADDED' as const,
    message: '新しいスタッフ「山田 花子」を追加しました',
    userId: 'user1',
    userName: '管理者 太郎',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1日前
  },
];

const mockAttendanceData = [
  {
    id: '1',
    userId: 'user1',
    userName: '田中 一郎',
    date: new Date(2023, 3, 1),
    status: 'NORMAL',
    workingMinutes: 480,
  },
  {
    id: '2',
    userId: 'user2',
    userName: '佐藤 二郎',
    date: new Date(2023, 3, 1),
    status: 'LATE',
    workingMinutes: 420,
  },
  {
    id: '3',
    userId: 'user3',
    userName: '鈴木 三郎',
    date: new Date(2023, 3, 1),
    status: 'NORMAL',
    workingMinutes: 480,
  },
  {
    id: '4',
    userId: 'user1',
    userName: '田中 一郎',
    date: new Date(2023, 3, 2),
    status: 'NORMAL',
    workingMinutes: 480,
  },
  {
    id: '5',
    userId: 'user2',
    userName: '佐藤 二郎',
    date: new Date(2023, 3, 2),
    status: 'NORMAL',
    workingMinutes: 480,
  },
];

export default async function AdminDashboardPage() {
  // 認証情報を取得
  const session = await getServerSession(authOptions);
  const storeId = session?.user.storeId;
  
  // 現在の日付情報
  const now = new Date();
  const currentMonth = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  
  // データベースからの取得処理（実際のプロジェクトで実装）
  // ここではモックデータ使用
  const staffCount = 12; // モック
  const pendingShiftsCount = 5; // モック
  const todayAttendanceCount = 8; // モック
  const alertsCount = 2; // モック
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">管理者ダッシュボード</h1>
        <p className="text-muted-foreground">
          {format(now, 'yyyy年MM月dd日 (EEE)', { locale: ja })}
        </p>
      </div>
      
      {/* 統計情報カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="スタッフ数" 
          value={staffCount} 
          description="登録済みスタッフの総数" 
          icon={<Users className="h-5 w-5 text-blue-500" />}
          trend={{ value: 8.2, label: "先月比", isPositive: true }}
        />
        
        <StatsCard 
          title="未確定シフト" 
          value={pendingShiftsCount} 
          description="承認待ちのシフト希望" 
          icon={<Calendar className="h-5 w-5 text-amber-500" />}
        />
        
        <StatsCard 
          title="本日の出勤" 
          value={todayAttendanceCount} 
          description="本日シフトが入っているスタッフ" 
          icon={<ClipboardCheck className="h-5 w-5 text-green-500" />}
        />
        
        <StatsCard 
          title="アラート" 
          value={alertsCount} 
          description="確認が必要な項目" 
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
        />
      </div>
      
      {/* グラフと最近のアクティビティ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>勤怠状況</CardTitle>
            </CardHeader>
            <CardContent>
              <AttendanceChart attendanceData={mockAttendanceData} />
            </CardContent>
          </Card>
        </div>
        
        <div>
          <ActivityFeed activities={mockActivities} />
        </div>
      </div>
      
      {/* クイックリンクカード */}
      <Card>
        <CardHeader>
          <CardTitle>管理業務クイックアクセス</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a 
            href="/admin/shifts" 
            className="flex items-center p-4 bg-primary/5 rounded-md hover:bg-primary/10 transition-colors"
          >
            <Calendar className="h-6 w-6 mr-4 text-primary" />
            <div>
              <h3 className="font-medium">シフト作成</h3>
              <p className="text-sm text-muted-foreground">次回シフトの作成へ</p>
            </div>
          </a>
          
          <a 
            href="/admin/staff" 
            className="flex items-center p-4 bg-primary/5 rounded-md hover:bg-primary/10 transition-colors"
          >
            <Users className="h-6 w-6 mr-4 text-primary" />
            <div>
              <h3 className="font-medium">スタッフ管理</h3>
              <p className="text-sm text-muted-foreground">スタッフ情報の管理へ</p>
            </div>
          </a>
          
          <a 
            href="/admin/attendance" 
            className="flex items-center p-4 bg-primary/5 rounded-md hover:bg-primary/10 transition-colors"
          >
            <ClipboardCheck className="h-6 w-6 mr-4 text-primary" />
            <div>
              <h3 className="font-medium">勤怠管理</h3>
              <p className="text-sm text-muted-foreground">勤怠記録の確認へ</p>
            </div>
          </a>
        </CardContent>
      </Card>
    </div>
  );
} 