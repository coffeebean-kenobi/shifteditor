'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useSession } from 'next-auth/react';

type NotificationBadgeProps = {
  onClick: () => void;
};

export default function NotificationBadge({ onClick }: NotificationBadgeProps) {
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchUnreadCount();
      // 1分ごとに未読数を更新
      const intervalId = setInterval(fetchUnreadCount, 60000);
      return () => clearInterval(intervalId);
    }
  }, [session]);

  const fetchUnreadCount = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications?unreadOnly=true&count=true');
      
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('通知数の取得に失敗しました:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={onClick}
      className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
      aria-label="通知を表示"
    >
      <Bell className="h-6 w-6" />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
} 