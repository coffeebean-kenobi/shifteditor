'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatTime, formatWorkingTime, clockIn, clockOut, getCurrentAttendance } from '@/lib/api/attendance';
import { useToast } from '@/components/ui/use-toast';

export default function CurrentStatus() {
  const [currentStatus, setCurrentStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // 現在の勤務状況を取得
  const fetchCurrentStatus = async () => {
    try {
      setLoading(true);
      const data = await getCurrentAttendance();
      setCurrentStatus(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || '勤務状況の取得に失敗しました');
      toast({
        title: 'エラー',
        description: err.message || '勤務状況の取得に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 出勤打刻
  const handleClockIn = async () => {
    if (!currentStatus?.shift?.id) return;
    
    try {
      setActionLoading(true);
      await clockIn(currentStatus.shift.id);
      toast({
        title: '出勤打刻完了',
        description: '出勤打刻が完了しました',
      });
      await fetchCurrentStatus();
    } catch (err: any) {
      toast({
        title: 'エラー',
        description: err.message || '出勤打刻に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // 退勤打刻
  const handleClockOut = async () => {
    if (!currentStatus?.shift?.id) return;
    
    try {
      setActionLoading(true);
      await clockOut(currentStatus.shift.id);
      toast({
        title: '退勤打刻完了',
        description: '退勤打刻が完了しました',
      });
      await fetchCurrentStatus();
    } catch (err: any) {
      toast({
        title: 'エラー',
        description: err.message || '退勤打刻に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // 定期的に状態を更新（1分ごと）
  useEffect(() => {
    fetchCurrentStatus();
    
    const interval = setInterval(() => {
      fetchCurrentStatus();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // ステータスに応じたコンテンツを表示
  const renderContent = () => {
    if (loading) {
      return <p className="text-center py-4">読み込み中...</p>;
    }

    if (error) {
      return <p className="text-center py-4 text-red-500">{error}</p>;
    }

    if (!currentStatus || currentStatus.status === 'NO_SHIFT') {
      return <p className="text-center py-4">本日のシフトはありません</p>;
    }

    const shift = currentStatus.shift;
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">シフト開始</p>
            <p className="text-xl font-medium">{formatTime(shift.startTime)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">シフト終了</p>
            <p className="text-xl font-medium">{formatTime(shift.endTime)}</p>
          </div>
        </div>

        <div className="pt-2">
          <p className="text-sm text-muted-foreground">現在の状態</p>
          <div className="flex items-center gap-2 mt-1">
            {currentStatus.status === 'WAITING' && (
              <p className="text-xl font-medium flex items-center">
                <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                勤務開始前
              </p>
            )}
            {currentStatus.status === 'WORKING' && (
              <p className="text-xl font-medium flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                勤務中 ({formatWorkingTime(currentStatus.workingTime || 0)})
              </p>
            )}
            {currentStatus.status === 'COMPLETED' && (
              <p className="text-xl font-medium flex items-center">
                <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                勤務完了 ({formatWorkingTime(currentStatus.workingTime || 0)})
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Button
            onClick={handleClockIn}
            disabled={
              actionLoading ||
              currentStatus.status === 'WORKING' ||
              currentStatus.status === 'COMPLETED'
            }
            className="flex-1"
          >
            出勤打刻
          </Button>
          <Button
            onClick={handleClockOut}
            disabled={
              actionLoading ||
              currentStatus.status !== 'WORKING'
            }
            variant="outline"
            className="flex-1"
          >
            退勤打刻
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>本日の勤務状況</CardTitle>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
} 