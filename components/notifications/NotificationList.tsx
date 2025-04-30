'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { 
  Bell, Calendar, MessageSquare, AlertCircle, 
  Check, CheckCircle, X, RefreshCw 
} from 'lucide-react';
import { getNotificationIconName, getNotificationIconColor } from '@/lib/notification-utils';

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
};

type NotificationListProps = {
  onClose?: () => void;
};

export default function NotificationList({ onClose }: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/notifications');
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      } else {
        setError('通知の取得に失敗しました');
      }
    } catch (error) {
      console.error('通知の取得でエラーが発生しました:', error);
      setError('通知の取得でエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isRead: true }),
      });

      if (response.ok) {
        setNotifications(notifications.map(notification => 
          notification.id === id ? { ...notification, isRead: true } : notification
        ));
      }
    } catch (error) {
      console.error('通知の既読処理に失敗しました:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications(notifications.map(notification => ({
          ...notification,
          isRead: true
        })));
      }
    } catch (error) {
      console.error('全通知の既読処理に失敗しました:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    if (notification.link) {
      window.location.href = notification.link;
    }
    
    if (onClose) {
      onClose();
    }
  };

  const getIcon = (type: string) => {
    const iconName = getNotificationIconName(type);
    switch (iconName) {
      case 'Calendar':
        return <Calendar className={`h-5 w-5 ${getNotificationIconColor(type)}`} />;
      case 'Check':
        return <Check className={`h-5 w-5 ${getNotificationIconColor(type)}`} />;
      case 'AlertCircle':
        return <AlertCircle className={`h-5 w-5 ${getNotificationIconColor(type)}`} />;
      case 'MessageSquare':
        return <MessageSquare className={`h-5 w-5 ${getNotificationIconColor(type)}`} />;
      default:
        return <Bell className={`h-5 w-5 ${getNotificationIconColor(type)}`} />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      if (diffInHours === 0) {
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        return `${diffInMinutes}分前`;
      }
      return `${diffInHours}時間前`;
    } else if (diffInHours < 48) {
      return '昨日';
    } else {
      return format(date, 'MM/dd HH:mm', { locale: ja });
    }
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">通知</h2>
        <div className="flex space-x-2">
          <button 
            onClick={fetchNotifications}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="更新"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          <button 
            onClick={markAllAsRead}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="すべて既読にする"
          >
            <CheckCircle className="h-5 w-5" />
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="閉じる"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <div className="flex justify-center">
              <RefreshCw className="h-5 w-5 animate-spin" />
            </div>
            <p className="mt-2">通知を読み込み中...</p>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">
            <AlertCircle className="h-6 w-6 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <Bell className="h-6 w-6 mx-auto mb-2" />
            <p>通知はありません</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map(notification => (
              <li 
                key={notification.id} 
                className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition ${
                  notification.isRead ? 'bg-white dark:bg-gray-800' : 'bg-blue-50 dark:bg-gray-750'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notification.type)}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {notification.title}
                      </p>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(notification.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {notification.message}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 