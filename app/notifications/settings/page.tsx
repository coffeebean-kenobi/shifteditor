'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { BellRing, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// 通知設定の型を定義
interface NotificationSettings {
  email: boolean;
  push: boolean;
  shiftConfirmed: boolean;
  shiftChanged: boolean;
  requestApproval: boolean;
  requestRejected: boolean;
  shiftReminder: boolean;
  systemNotification: boolean;
  adminMessage: boolean;
  [key: string]: boolean; // インデックスシグネチャを追加
}

export default function NotificationSettingsPage() {
  // 通知設定の状態
  const [settings, setSettings] = useState<NotificationSettings>({
    email: true,
    push: false,
    shiftConfirmed: true,
    shiftChanged: true,
    requestApproval: true,
    requestRejected: true,
    shiftReminder: true,
    systemNotification: true,
    adminMessage: true,
  });

  // 設定を変更する関数
  const handleToggle = (key: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // 変更を保存する関数
  const handleSaveSettings = () => {
    // ここではモックとして、実際の実装ではAPIを呼び出す
    console.log('保存された設定:', settings);
    alert('設定が保存されました');
    // 実際のAPIコール例:
    // await saveNotificationSettings(settings);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center mb-6">
        <Link href="/dashboard" className="mr-4">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">通知設定</h1>
      </div>

      <div className="grid gap-6">
        {/* 通知方法 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BellRing className="h-5 w-5 mr-2" />
              通知方法
            </CardTitle>
            <CardDescription>通知を受け取る方法を設定します</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications" className="font-medium">メール通知</Label>
                <p className="text-sm text-muted-foreground">重要な通知をメールで受け取る</p>
              </div>
              <Switch
                id="email-notifications"
                checked={settings.email}
                onCheckedChange={() => handleToggle('email')}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-notifications" className="font-medium">プッシュ通知</Label>
                <p className="text-sm text-muted-foreground">ブラウザのプッシュ通知を有効にする</p>
              </div>
              <Switch
                id="push-notifications"
                checked={settings.push}
                onCheckedChange={() => handleToggle('push')}
              />
            </div>
          </CardContent>
        </Card>

        {/* 通知タイプ */}
        <Card>
          <CardHeader>
            <CardTitle>通知タイプ</CardTitle>
            <CardDescription>受け取りたい通知の種類を選択します</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="shift-confirmed" className="font-medium">シフト確定通知</Label>
              <Switch
                id="shift-confirmed"
                checked={settings.shiftConfirmed}
                onCheckedChange={() => handleToggle('shiftConfirmed')}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="shift-changed" className="font-medium">シフト変更通知</Label>
              <Switch
                id="shift-changed"
                checked={settings.shiftChanged}
                onCheckedChange={() => handleToggle('shiftChanged')}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="request-approval" className="font-medium">申請承認通知</Label>
              <Switch
                id="request-approval"
                checked={settings.requestApproval}
                onCheckedChange={() => handleToggle('requestApproval')}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="request-rejected" className="font-medium">申請却下通知</Label>
              <Switch
                id="request-rejected"
                checked={settings.requestRejected}
                onCheckedChange={() => handleToggle('requestRejected')}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="shift-reminder" className="font-medium">シフトリマインダー</Label>
              <Switch
                id="shift-reminder"
                checked={settings.shiftReminder}
                onCheckedChange={() => handleToggle('shiftReminder')}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="system-notification" className="font-medium">システム通知</Label>
              <Switch
                id="system-notification"
                checked={settings.systemNotification}
                onCheckedChange={() => handleToggle('systemNotification')}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="admin-message" className="font-medium">管理者メッセージ</Label>
              <Switch
                id="admin-message"
                checked={settings.adminMessage}
                onCheckedChange={() => handleToggle('adminMessage')}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSaveSettings}>設定を保存</Button>
        </div>
      </div>
    </div>
  );
} 