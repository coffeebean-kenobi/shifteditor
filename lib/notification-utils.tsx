import React from 'react';
import { Bell, Check, Calendar, AlertCircle, MessageSquare } from 'lucide-react';

// 通知タイプに応じたアイコン名を返す関数
export const getNotificationIconName = (type: string): string => {
  switch (type) {
    case 'SHIFT_CONFIRMED':
    case 'SHIFT_CHANGED':
    case 'SHIFT_REMINDER':
      return 'Calendar';
    case 'REQUEST_APPROVED':
      return 'Check';
    case 'REQUEST_REJECTED':
      return 'AlertCircle';
    case 'ADMIN_MESSAGE':
      return 'MessageSquare';
    default:
      return 'Bell';
  }
};

// 通知タイプに応じたアイコンのカラーを返す関数
export const getNotificationIconColor = (type: string): string => {
  switch (type) {
    case 'SHIFT_CONFIRMED':
    case 'SHIFT_CHANGED':
    case 'SHIFT_REMINDER':
      return 'text-blue-500';
    case 'REQUEST_APPROVED':
      return 'text-green-500';
    case 'REQUEST_REJECTED':
      return 'text-red-500';
    case 'ADMIN_MESSAGE':
      return 'text-purple-500';
    default:
      return 'text-gray-500';
  }
};

// 通知タイプに対応する詳細情報を取得
export const getTypeDescription = (type: string): string => {
  switch (type) {
    case 'SHIFT_CONFIRMED':
      return 'シフト確認通知';
    case 'SHIFT_CHANGED':
      return 'シフト変更通知';
    case 'REQUEST_APPROVED':
      return 'リクエスト承認通知';
    case 'REQUEST_REJECTED':
      return 'リクエスト却下通知';
    case 'SHIFT_REMINDER':
      return 'シフトリマインダー';
    case 'SYSTEM_NOTIFICATION':
      return 'システム通知';
    case 'ADMIN_MESSAGE':
      return '管理者メッセージ';
    default:
      return '通知';
  }
};

// 通知タイプに応じたReactアイコンコンポーネントを返す関数
export const getNotificationIcon = (type: string): React.ReactNode => {
  const iconName = getNotificationIconName(type);
  const iconColor = getNotificationIconColor(type);
  
  switch (iconName) {
    case 'Calendar':
      return <Calendar className={`h-5 w-5 ${iconColor}`} />;
    case 'Check':
      return <Check className={`h-5 w-5 ${iconColor}`} />;
    case 'AlertCircle':
      return <AlertCircle className={`h-5 w-5 ${iconColor}`} />;
    case 'MessageSquare':
      return <MessageSquare className={`h-5 w-5 ${iconColor}`} />;
    default:
      return <Bell className={`h-5 w-5 ${iconColor}`} />;
  }
}; 