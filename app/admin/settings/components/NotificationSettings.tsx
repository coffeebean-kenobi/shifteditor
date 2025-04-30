'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface NotificationSettingsProps {
  emailNotifications: boolean;
  pushNotifications: boolean;
  onSave: (settings: {
    emailNotifications: boolean;
    pushNotifications: boolean;
  }) => void;
}

export default function NotificationSettings({
  emailNotifications,
  pushNotifications,
  onSave,
}: NotificationSettingsProps) {
  const [notifications, setNotifications] = useState({
    emailNotifications,
    pushNotifications,
  });

  const handleChange = (field: keyof typeof notifications, value: boolean) => {
    setNotifications({
      ...notifications,
      [field]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(notifications);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
          <div>
            <h3 className="font-medium">メール通知</h3>
            <p className="text-sm text-gray-500">シフト確定、変更、重要なお知らせをメールで受け取る</p>
          </div>
          <Switch
            id="email-notifications"
            checked={notifications.emailNotifications}
            onCheckedChange={(checked) => handleChange('emailNotifications', checked)}
          />
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
          <div>
            <h3 className="font-medium">プッシュ通知</h3>
            <p className="text-sm text-gray-500">ブラウザのプッシュ通知機能を使用して、リアルタイムの通知を受け取る</p>
          </div>
          <Switch
            id="push-notifications"
            checked={notifications.pushNotifications}
            onCheckedChange={(checked) => handleChange('pushNotifications', checked)}
          />
        </div>

        <div className="p-4 border rounded-lg bg-white">
          <h3 className="font-medium mb-2">通知イベント</h3>
          <p className="text-sm text-gray-500 mb-4">通知を受け取るイベントを選択します（この機能は近日公開予定）</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {['シフト確定', 'シフト変更', 'シフト交代依頼', '勤怠記録', 'システム通知'].map((event) => (
              <div key={event} className="flex items-center space-x-2">
                <Switch id={`event-${event}`} disabled />
                <Label htmlFor={`event-${event}`} className="text-gray-400">{event}</Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit">保存</Button>
      </div>
    </form>
  );
} 