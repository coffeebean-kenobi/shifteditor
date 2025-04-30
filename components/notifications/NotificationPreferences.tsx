'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, RefreshCw, Save } from 'lucide-react';

type NotificationPreference = {
  type: string;
  email: boolean;
  push: boolean;
  inApp: boolean;
};

type NotificationTypeInfo = {
  id: string;
  label: string;
  description: string;
};

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 通知タイプの定義
  const notificationTypes: NotificationTypeInfo[] = [
    { 
      id: 'SHIFT_CONFIRMED', 
      label: 'シフト確定通知', 
      description: 'シフトが確定した際に通知を受け取ります' 
    },
    { 
      id: 'SHIFT_CHANGED', 
      label: 'シフト変更通知', 
      description: 'シフトに変更があった際に通知を受け取ります' 
    },
    { 
      id: 'REQUEST_APPROVED', 
      label: 'シフト申請承認通知', 
      description: 'シフト申請が承認された際に通知を受け取ります' 
    },
    { 
      id: 'REQUEST_REJECTED', 
      label: 'シフト申請拒否通知', 
      description: 'シフト申請が拒否された際に通知を受け取ります' 
    },
    { 
      id: 'SHIFT_REMINDER', 
      label: '出勤リマインダー', 
      description: 'シフト開始前にリマインダーを受け取ります' 
    },
    { 
      id: 'ADMIN_MESSAGE', 
      label: '管理者メッセージ', 
      description: '管理者からのメッセージを受け取ります' 
    },
    { 
      id: 'SYSTEM_NOTIFICATION', 
      label: 'システム通知', 
      description: 'システム関連の重要な通知を受け取ります' 
    }
  ];

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/notifications/settings');
      
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      } else {
        setError('設定の取得に失敗しました');
        
        // バックエンドから取得に失敗した場合はデフォルト値を設定
        const defaultPreferences = notificationTypes.map(type => ({
          type: type.id,
          email: true,
          push: true,
          inApp: true
        }));
        setPreferences(defaultPreferences);
      }
    } catch (error) {
      console.error('通知設定の取得でエラーが発生しました:', error);
      setError('通知設定の取得でエラーが発生しました');
      
      // エラー時もデフォルト値を設定
      const defaultPreferences = notificationTypes.map(type => ({
        type: type.id,
        email: true,
        push: true,
        inApp: true
      }));
      setPreferences(defaultPreferences);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch('/api/notifications/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences }),
      });

      if (response.ok) {
        setSuccess('通知設定を保存しました');
        // 成功メッセージを3秒後に消す
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('設定の保存に失敗しました');
      }
    } catch (error) {
      console.error('通知設定の保存でエラーが発生しました:', error);
      setError('通知設定の保存でエラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (index: number, field: 'email' | 'push' | 'inApp') => {
    const newPreferences = [...preferences];
    newPreferences[index] = {
      ...newPreferences[index],
      [field]: !newPreferences[index][field]
    };
    setPreferences(newPreferences);
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        <div className="flex justify-center">
          <RefreshCw className="h-5 w-5 animate-spin" />
        </div>
        <p className="mt-2">設定を読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">通知設定</h2>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span>{success}</span>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4 py-2 border-b border-gray-200 dark:border-gray-700 font-medium text-gray-700 dark:text-gray-300">
            <div className="col-span-1">通知タイプ</div>
            <div className="text-center">メール</div>
            <div className="text-center">プッシュ通知</div>
            <div className="text-center">アプリ内通知</div>
          </div>
          
          {preferences.map((preference, index) => {
            const typeInfo = notificationTypes.find(t => t.id === preference.type);
            return (
              <div key={preference.type} className="grid grid-cols-4 gap-4 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="col-span-1">
                  <p className="font-medium text-gray-900 dark:text-white">{typeInfo?.label || preference.type}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{typeInfo?.description}</p>
                </div>
                
                <div className="flex justify-center items-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={preference.email}
                      onChange={() => handleToggle(index, 'email')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex justify-center items-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={preference.push}
                      onChange={() => handleToggle(index, 'push')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex justify-center items-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={preference.inApp}
                      onChange={() => handleToggle(index, 'inApp')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={savePreferences}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                設定を保存
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 