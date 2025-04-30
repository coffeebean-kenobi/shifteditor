'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAttendanceList, formatDate, formatTime, formatWorkingTime } from '@/lib/api/attendance';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Attendance = {
  id: string;
  userId: string;
  shiftId: string;
  clockInTime: string | null;
  clockOutTime: string | null;
  status: string;
  workingMinutes: number | null;
  note: string | null;
  shift: {
    startTime: string;
    endTime: string;
  };
};

export default function AttendanceHistory() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: 'ALL',
  });

  // 勤怠記録を取得
  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true);
      const data = await getAttendanceList({
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        status: filters.status === 'ALL' ? undefined : filters.status,
      });
      setAttendances(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || '勤怠記録の取得に失敗しました');
      toast({
        title: 'エラー',
        description: err.message || '勤怠記録の取得に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceHistory();
  }, []);

  // フィルター適用
  const applyFilters = () => {
    fetchAttendanceHistory();
  };

  // フィルターリセット
  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      status: 'ALL',
    });
    setTimeout(() => {
      fetchAttendanceHistory();
    }, 0);
  };

  // 勤怠ステータスの表示名を取得
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ON_TIME':
        return '時間通り';
      case 'LATE':
        return '遅刻';
      case 'ABSENT':
        return '欠勤';
      default:
        return status;
    }
  };

  // 時給の計算（仮の時給1000円で計算）
  const calculateWage = (minutes: number | null) => {
    if (!minutes) return 0;
    const hourlyRate = 1000; // 時給1000円と仮定
    return Math.round((hourlyRate / 60) * minutes);
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>勤怠履歴</CardTitle>
      </CardHeader>
      <CardContent>
        {/* フィルター */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <Label htmlFor="startDate">開始日</Label>
            <Input
              id="startDate"
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="endDate">終了日</Label>
            <Input
              id="endDate"
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="status">ステータス</Label>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="すべて" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">すべて</SelectItem>
                <SelectItem value="ON_TIME">時間通り</SelectItem>
                <SelectItem value="LATE">遅刻</SelectItem>
                <SelectItem value="ABSENT">欠勤</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={applyFilters} className="flex-1">
              検索
            </Button>
            <Button onClick={resetFilters} variant="outline" className="flex-1">
              リセット
            </Button>
          </div>
        </div>

        {/* 勤怠履歴テーブル */}
        {loading ? (
          <p className="text-center py-4">読み込み中...</p>
        ) : error ? (
          <p className="text-center py-4 text-red-500">{error}</p>
        ) : attendances.length === 0 ? (
          <p className="text-center py-4">勤怠記録がありません</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted border-b">
                  <th className="text-left py-3 px-4">日付</th>
                  <th className="text-left py-3 px-4">シフト時間</th>
                  <th className="text-left py-3 px-4">出勤</th>
                  <th className="text-left py-3 px-4">退勤</th>
                  <th className="text-left py-3 px-4">勤務時間</th>
                  <th className="text-left py-3 px-4">状態</th>
                  <th className="text-left py-3 px-4">給与見込み</th>
                </tr>
              </thead>
              <tbody>
                {attendances.map((attendance) => (
                  <tr key={attendance.id} className="border-b">
                    <td className="py-3 px-4">
                      {formatDate(attendance.shift.startTime)}
                    </td>
                    <td className="py-3 px-4">
                      {formatTime(attendance.shift.startTime)} - {formatTime(attendance.shift.endTime)}
                    </td>
                    <td className="py-3 px-4">
                      {attendance.clockInTime ? formatTime(attendance.clockInTime) : '--:--'}
                    </td>
                    <td className="py-3 px-4">
                      {attendance.clockOutTime ? formatTime(attendance.clockOutTime) : '--:--'}
                    </td>
                    <td className="py-3 px-4">
                      {formatWorkingTime(attendance.workingMinutes || 0)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          attendance.status === 'ON_TIME'
                            ? 'bg-green-100 text-green-800'
                            : attendance.status === 'LATE'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {getStatusLabel(attendance.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      ¥{calculateWage(attendance.workingMinutes).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 