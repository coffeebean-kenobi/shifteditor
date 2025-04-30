'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ShiftCalendar from '@/components/shifts/ShiftCalendar';
import { format } from 'date-fns';

export default function ShiftsPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // APIからシフトデータを取得
  useEffect(() => {
    const fetchShifts = async () => {
      try {
        setLoading(true);
        // 現在の月の開始日と終了日を取得
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        const startDateString = format(startDate, 'yyyy-MM-dd');
        const endDateString = format(endDate, 'yyyy-MM-dd');
        
        // APIからシフトデータを取得
        const response = await fetch(
          `/api/shifts?startDate=${startDateString}&endDate=${endDateString}`
        );
        
        if (!response.ok) {
          throw new Error('シフトデータの取得に失敗しました');
        }
        
        const data = await response.json();
        setShifts(data);
      } catch (err: any) {
        console.error('シフト取得エラー:', err);
        setError(err.message || 'データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchShifts();
    }
  }, [userId]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">シフトカレンダー</h1>
      
      <Card className="bg-card shadow rounded-lg mb-6">
        <CardHeader>
          <CardTitle>シフト一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10">読み込み中...</div>
          ) : error ? (
            <div className="text-red-500 text-center py-10">{error}</div>
          ) : (
            <ShiftCalendar shifts={shifts} userId={userId} />
          )}
        </CardContent>
      </Card>
    </div>
  );
} 