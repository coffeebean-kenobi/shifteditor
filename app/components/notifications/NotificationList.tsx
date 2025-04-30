import React, { useState } from 'react';
import NotificationItem from './NotificationItem';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell } from 'lucide-react';
import { Notification, NotificationListProps } from '@/types/notifications';

const NotificationList = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationListProps) => {
  const [activeTab, setActiveTab] = useState('all');

  const unreadCount = notifications.filter(notification => !notification.isRead).length;
  
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notification.isRead;
    if (activeTab === 'shift') {
      return ['SHIFT_CONFIRMED', 'SHIFT_CHANGED', 'SHIFT_REMINDER'].includes(notification.type);
    }
    if (activeTab === 'request') {
      return ['REQUEST_APPROVED', 'REQUEST_REJECTED'].includes(notification.type);
    }
    return true;
  });

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center bg-gray-50">
        <div className="flex items-center">
          <Bell className="h-5 w-5 mr-2 text-gray-600" />
          <h2 className="text-lg font-semibold">お知らせ</h2>
          {unreadCount > 0 && (
            <span className="ml-2 bg-blue-600 text-white text-xs rounded-full px-2 py-1">
              {unreadCount}
            </span>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onMarkAllAsRead}
          disabled={unreadCount === 0}
        >
          すべて既読にする
        </Button>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="px-4 pt-2 border-b">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="all">すべて</TabsTrigger>
            <TabsTrigger value="unread">未読 {unreadCount > 0 && `(${unreadCount})`}</TabsTrigger>
            <TabsTrigger value="shift">シフト</TabsTrigger>
            <TabsTrigger value="request">申請</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="focus:outline-none">
          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  {...notification}
                  onMarkAsRead={onMarkAsRead}
                />
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                通知はありません
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="unread" className="focus:outline-none">
          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  {...notification}
                  onMarkAsRead={onMarkAsRead}
                />
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                未読の通知はありません
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="shift" className="focus:outline-none">
          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  {...notification}
                  onMarkAsRead={onMarkAsRead}
                />
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                シフト関連の通知はありません
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="request" className="focus:outline-none">
          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  {...notification}
                  onMarkAsRead={onMarkAsRead}
                />
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                申請関連の通知はありません
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationList; 