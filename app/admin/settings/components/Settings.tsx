'use client';

import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import BusinessHoursForm from './BusinessHoursForm';
import ShiftRulesForm from './ShiftRulesForm';
import NotificationSettings from './NotificationSettings';
import BackupRestore from './BackupRestore';
import SystemSettings from './SystemSettings';

interface StoreSettings {
  id?: string;
  businessHours: {
    monday: { open: string; close: string; isOpen: boolean };
    tuesday: { open: string; close: string; isOpen: boolean };
    wednesday: { open: string; close: string; isOpen: boolean };
    thursday: { open: string; close: string; isOpen: boolean };
    friday: { open: string; close: string; isOpen: boolean };
    saturday: { open: string; close: string; isOpen: boolean };
    sunday: { open: string; close: string; isOpen: boolean };
  };
  minShiftHours: number;
  maxShiftHours: number;
  minBreakMinutes: number;
  maxWeeklyWorkHours: number;
  emailNotifications: boolean;
  pushNotifications: boolean;
  timezone: string;
  language: string;
}

export default function Settings() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (!response.ok) {
          throw new Error('設定の取得に失敗しました');
        }
        const data = await response.json();
        setSettings(data);
      } catch (error) {
        console.error('設定の取得エラー:', error);
        toast.error('設定の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<StoreSettings>) => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...settings,
          ...newSettings,
        }),
      });

      if (!response.ok) {
        throw new Error('設定の更新に失敗しました');
      }

      const updatedSettings = await response.json();
      setSettings(updatedSettings);
      toast.success('設定を更新しました');
    } catch (error) {
      console.error('設定の更新エラー:', error);
      toast.error('設定の更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !settings) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg">読み込み中...</p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="business-hours" className="w-full">
      <TabsList className="grid grid-cols-5 mb-8">
        <TabsTrigger value="business-hours">営業時間</TabsTrigger>
        <TabsTrigger value="shift-rules">シフトルール</TabsTrigger>
        <TabsTrigger value="notifications">通知設定</TabsTrigger>
        <TabsTrigger value="backup">バックアップ/リストア</TabsTrigger>
        <TabsTrigger value="system">システム設定</TabsTrigger>
      </TabsList>

      <Card className="p-6">
        {settings && (
          <>
            <TabsContent value="business-hours" className="mt-0">
              <h2 className="text-2xl font-bold mb-4">営業時間設定</h2>
              <BusinessHoursForm 
                businessHours={settings.businessHours} 
                onSave={(businessHours) => updateSettings({ businessHours })} 
              />
            </TabsContent>

            <TabsContent value="shift-rules" className="mt-0">
              <h2 className="text-2xl font-bold mb-4">シフトルール設定</h2>
              <ShiftRulesForm 
                minShiftHours={settings.minShiftHours}
                maxShiftHours={settings.maxShiftHours}
                minBreakMinutes={settings.minBreakMinutes}
                maxWeeklyWorkHours={settings.maxWeeklyWorkHours}
                onSave={updateSettings}
              />
            </TabsContent>

            <TabsContent value="notifications" className="mt-0">
              <h2 className="text-2xl font-bold mb-4">通知設定</h2>
              <NotificationSettings 
                emailNotifications={settings.emailNotifications}
                pushNotifications={settings.pushNotifications}
                onSave={updateSettings}
              />
            </TabsContent>

            <TabsContent value="backup" className="mt-0">
              <h2 className="text-2xl font-bold mb-4">バックアップ/リストア</h2>
              <BackupRestore />
            </TabsContent>

            <TabsContent value="system" className="mt-0">
              <h2 className="text-2xl font-bold mb-4">システム設定</h2>
              <SystemSettings 
                timezone={settings.timezone}
                language={settings.language}
                onSave={updateSettings}
              />
            </TabsContent>
          </>
        )}
      </Card>
    </Tabs>
  );
} 