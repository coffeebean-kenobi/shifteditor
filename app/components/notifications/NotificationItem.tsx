import React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { getNotificationIcon } from '@/lib/notification-utils';

type NotificationItemProps = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
  link?: string;
  onMarkAsRead: (id: string) => void;
};

const NotificationItem = ({
  id,
  title,
  message,
  type,
  isRead,
  createdAt,
  link,
  onMarkAsRead,
}: NotificationItemProps) => {
  const handleClick = () => {
    if (!isRead) {
      onMarkAsRead(id);
    }
  };

  return (
    <div
      className={`p-4 border-b last:border-b-0 transition-colors ${
        isRead ? 'bg-white' : 'bg-blue-50'
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start">
        <div className="mr-3 mt-1">{getNotificationIcon(type)}</div>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-medium text-gray-900">{title}</h3>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: ja })}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">{message}</p>
          {link && (
            <Link 
              href={link} 
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              詳細を見る
            </Link>
          )}
        </div>
        {!isRead && (
          <div className="ml-2">
            <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationItem; 