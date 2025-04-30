'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SystemSettingsProps {
  timezone: string;
  language: string;
  onSave: (settings: {
    timezone: string;
    language: string;
  }) => void;
}

// タイムゾーンのリスト（日本周辺の主要なタイムゾーン）
const timezones = [
  { value: 'Asia/Tokyo', label: '東京 (UTC+9:00)' },
  { value: 'Asia/Seoul', label: 'ソウル (UTC+9:00)' },
  { value: 'Asia/Shanghai', label: '上海 (UTC+8:00)' },
  { value: 'Asia/Hong_Kong', label: '香港 (UTC+8:00)' },
  { value: 'Asia/Singapore', label: 'シンガポール (UTC+8:00)' },
  { value: 'Asia/Taipei', label: '台北 (UTC+8:00)' },
];

// 言語選択オプション
const languages = [
  { value: 'ja', label: '日本語' },
  { value: 'en', label: '英語 (開発中)' },
  { value: 'zh', label: '中国語 (開発中)' },
  { value: 'ko', label: '韓国語 (開発中)' },
];

export default function SystemSettings({
  timezone,
  language,
  onSave,
}: SystemSettingsProps) {
  const [settings, setSettings] = useState({
    timezone,
    language,
  });

  const handleTimezoneChange = (value: string) => {
    setSettings({
      ...settings,
      timezone: value,
    });
  };

  const handleLanguageChange = (value: string) => {
    setSettings({
      ...settings,
      language: value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(settings);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="timezone" className="block mb-2">タイムゾーン</Label>
            <Select
              value={settings.timezone}
              onValueChange={handleTimezoneChange}
            >
              <SelectTrigger id="timezone" className="w-full">
                <SelectValue placeholder="タイムゾーンを選択" />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 mt-1">システム全体で使用されるタイムゾーン</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="language" className="block mb-2">言語</Label>
            <Select
              value={settings.language}
              onValueChange={handleLanguageChange}
            >
              <SelectTrigger id="language" className="w-full">
                <SelectValue placeholder="言語を選択" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500 mt-1">システムの表示言語（一部未対応の場合があります）</p>
          </div>
        </div>
      </div>

      <div className="p-4 border rounded-lg bg-white mt-6">
        <h3 className="font-medium mb-2">システム情報</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">アプリケーションバージョン</p>
            <p>1.0.0</p>
          </div>
          <div>
            <p className="text-gray-500">最終更新日</p>
            <p>{new Date().toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-gray-500">データベース状態</p>
            <p className="text-green-600">正常</p>
          </div>
          <div>
            <p className="text-gray-500">サーバー状態</p>
            <p className="text-green-600">稼働中</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit">保存</Button>
      </div>
    </form>
  );
} 