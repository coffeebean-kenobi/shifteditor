'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import NotificationList from '../components/notifications/NotificationList';
import NotificationDetail from '../components/notifications/NotificationDetail';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Notification } from '@/types/notifications';

// モックデータ - 実際の実装ではAPIから取得
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: '4月のシフト確定のお知らせ',
    message: '4月のシフトが確定しました。マイページから確認してください。\n\n変更がある場合は店舗マネージャーにご連絡ください。',
    type: 'SHIFT_CONFIRMED',
    isRead: false,
    createdAt: new Date('2023-03-25T10:00:00'),
    link: '/shifts'
  },
  {
    id: '2',
    title: 'シフト希望提出リマインダー',
    message: '5月のシフト希望提出期限が近づいています。4月15日までに提出してください。',
    type: 'SHIFT_REMINDER',
    isRead: true,
    createdAt: new Date('2023-03-20T09:30:00'),
    link: '/requests'
  },
  {
    id: '3',
    title: 'シフト交代申請が承認されました',
    message: '4月2日のシフト交代申請が承認されました。',
    type: 'REQUEST_APPROVED',
    isRead: false,
    createdAt: new Date('2023-03-18T14:20:00'),
    link: '/shifts/123'
  },
  {
    id: '4',
    title: 'システムメンテナンスのお知らせ',
    message: '3月31日 深夜2:00〜5:00の間、システムメンテナンスを実施いたします。この間はサービスをご利用いただけません。',
    type: 'SYSTEM_NOTIFICATION',
    isRead: true,
    createdAt: new Date('2023-03-15T11:15:00')
  }
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // 通知を既読にする処理
  const handleMarkAsRead = (id: string) => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
  };

  // すべての通知を既読にする処理
  const handleMarkAllAsRead = () => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => ({ ...notification, isRead: true }))
    );
  };

  // 通知詳細を表示
  const handleShowDetail = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsDetailOpen(true);
  };

  // 直近の未読通知を取得
  const recentUnreadNotifications = notifications
    .filter(notification => !notification.isRead)
    .slice(0, 2);

  // 管理者権限またはスーパーアドミン権限があるかチェック
  const isAdmin = session?.user?.role === 'ADMIN' || (session?.user as any)?.isSuperAdmin;

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
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            お知らせ
            {recentUnreadNotifications.length > 0 && (
              <span className="ml-2 bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                {recentUnreadNotifications.length}
              </span>
            )}
          </h2>
          <div className="space-y-4">
            {recentUnreadNotifications.length > 0 ? (
              recentUnreadNotifications.map(notification => (
                <div key={notification.id} className="border-b pb-2">
                  <p className="font-medium">{notification.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {notification.createdAt.toLocaleDateString('ja-JP')}
                  </p>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-primary"
                    onClick={() => handleShowDetail(notification)}
                  >
                    詳細を見る
                  </Button>
                </div>
              ))
            ) : (
              <div className="border-b pb-2">
                <p className="font-medium">新着のお知らせはありません</p>
              </div>
            )}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setIsDetailOpen(true)}
                >
                  すべてのお知らせを見る
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] p-0">
                <NotificationList 
                  notifications={notifications}
                  onMarkAsRead={handleMarkAsRead}
                  onMarkAllAsRead={handleMarkAllAsRead}
                />
              </DialogContent>
            </Dialog>
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
              シフト詳細 &rarr;
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
            <Link href="/notifications/settings" className="text-primary hover:underline block">
              通知設定
            </Link>
            {isAdmin && (
              <Link href="/admin" className="text-primary hover:underline block">
                管理者ダッシュボード
              </Link>
            )}
            <Link href="#" className="text-primary hover:underline block">
              ヘルプ・お問い合わせ
            </Link>
          </div>
        </div>
      </div>

      {/* 通知詳細ダイアログ */}
      {selectedNotification && (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <NotificationDetail 
              notification={selectedNotification}
              onClose={() => setIsDetailOpen(false)}
              onMarkAsRead={handleMarkAsRead}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 