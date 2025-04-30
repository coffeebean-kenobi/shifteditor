import React from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { X, Bell } from 'lucide-react';
import { getNotificationIcon, getTypeDescription } from '@/lib/notification-utils';
import { NotificationDetailProps } from '@/types/notifications';

const NotificationDetail = ({
  notification,
  onClose,
  onMarkAsRead,
}: NotificationDetailProps) => {
  const { id, title, message, type, isRead, createdAt, link } = notification;

  React.useEffect(() => {
    if (!isRead) {
      onMarkAsRead(id);
    }
  }, [id, isRead, onMarkAsRead]);

  const iconProps = getNotificationIcon(type);
  const Icon = iconProps?.icon || Bell;
  const iconClassName = iconProps?.className || "h-5 w-5 text-gray-500";

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
        <h2 className="text-lg font-semibold">通知詳細</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className="mr-3">
            <Icon className={iconClassName} />
          </div>
          <div>
            <h3 className="text-xl font-semibold">{title}</h3>
            <p className="text-sm text-gray-500">
              {getTypeDescription(type)} - {format(new Date(createdAt), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
            </p>
          </div>
        </div>

        <div className="border-t border-b py-4 my-4">
          <p className="whitespace-pre-line">{message}</p>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          {link && (
            <Button variant="default" asChild>
              <a href={link}>詳細ページへ</a>
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            閉じる
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotificationDetail; 