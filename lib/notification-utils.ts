import React from 'react';
import { 
  Bell, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  MessageSquare,
  CheckCircle2
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { NotificationType } from '@/types/notifications';

type IconProps = {
  icon: LucideIcon;
  className: string;
};

/**
 * 通知タイプに基づいてアイコンと色を取得する
 * @param type 通知タイプ
 * @returns アイコンコンポーネントとクラス名のオブジェクト
 */
export const getNotificationIcon = (type: string): IconProps => {
  switch (type) {
    case 'SHIFT_CONFIRMED':
      return {
        icon: CheckCircle2,
        className: 'h-5 w-5 text-green-500',
      };
    case 'SHIFT_CHANGED':
      return {
        icon: Calendar,
        className: 'h-5 w-5 text-blue-500',
      };
    case 'SHIFT_REMINDER':
      return {
        icon: Clock,
        className: 'h-5 w-5 text-amber-500',
      };
    case 'REQUEST_APPROVED':
      return {
        icon: CheckCircle2,
        className: 'h-5 w-5 text-green-500',
      };
    case 'REQUEST_REJECTED':
      return {
        icon: XCircle,
        className: 'h-5 w-5 text-red-500',
      };
    case 'SYSTEM_NOTIFICATION':
      return {
        icon: AlertTriangle,
        className: 'h-5 w-5 text-amber-500',
      };
    case 'ADMIN_MESSAGE':
      return {
        icon: MessageSquare,
        className: 'h-5 w-5 text-purple-500',
      };
    default:
      return {
        icon: Bell,
        className: 'h-5 w-5 text-gray-500',
      };
  }
};

/**
 * 通知タイプの日本説明を取得する
 * @param type 通知タイプ
 * @returns 日本語での通知タイプの説明
 */
export const getTypeDescription = (type: string): string => {
  switch (type) {
    case 'SHIFT_CONFIRMED':
      return 'シフト確定';
    case 'SHIFT_CHANGED':
      return 'シフト変更';
    case 'SHIFT_REMINDER':
      return 'シフト通知';
    case 'REQUEST_APPROVED':
      return 'リクエスト承認';
    case 'REQUEST_REJECTED':
      return 'リクエスト却下';
    case 'SYSTEM_NOTIFICATION':
      return 'システム通知';
    case 'ADMIN_MESSAGE':
      return '管理者メッセージ';
    default:
      return '通知';
  }
};

/**
 * 通知を優先度でソートする
 * @param notifications 通知の配列
 * @returns ソート済みの通知配列
 */
export const sortNotificationsByPriority = (notifications: any[]) => {
  return [...notifications].sort((a, b) => {
    // 未読の通知を優先
    if (a.isRead !== b.isRead) {
      return a.isRead ? 1 : -1;
    }
    
    // 次に新しい通知を優先
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
};