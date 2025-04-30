/**
 * 通知関連の型定義
 */

// 通知タイプの列挙型
export type NotificationType = 
  | 'SHIFT_CONFIRMED'
  | 'SHIFT_CHANGED'
  | 'SHIFT_REMINDER'
  | 'REQUEST_APPROVED'
  | 'REQUEST_REJECTED'
  | 'SYSTEM_NOTIFICATION'
  | 'ADMIN_MESSAGE';

// 通知の基本型
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
  link?: string;
  senderId?: string;
  storeId?: string;
}

// 通知リストのProps
export interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

// 通知詳細のProps
export interface NotificationDetailProps {
  notification: Notification;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
} 