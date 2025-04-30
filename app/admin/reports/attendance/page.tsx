'use client';

import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, Download, RefreshCcw, Clock, UserCheck, UserX } from 'lucide-react';
import AttendanceTrendChart from '@/components/reports/AttendanceTrendChart';
import ExportOptions from '@/components/reports/ExportOptions';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function AttendanceReportsPage() {
  // 状態の定義
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [period, setPeriod] = useState<'week' | 'month' | 'custom'>('month');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });

  // 期間の変更ハンドラー
  const handlePeriodChange = (newPeriod: 'week' | 'month' | 'custom') => {
    setPeriod(newPeriod);
    
    if (newPeriod === 'month') {
      setDateRange({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date())
      });
    } else if (newPeriod === 'week') {
      setDateRange({
        from: startOfWeek(new Date(), { weekStartsOn: 1 }),
        to: endOfWeek(new Date(), { weekStartsOn: 1 })
      });
    }
    // customの場合は現在の範囲を維持
  };

  // データ取得関数
  const fetchAttendanceData = async () => {
    setIsLoading(true);
    try {
      let queryParams = new URLSearchParams({
        period: period,
        from: format(dateRange.from, 'yyyy-MM-dd'),
        to: format(dateRange.to, 'yyyy-MM-dd')
      });

      const response = await fetch(`/api/admin/reports/attendance?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('データ取得に失敗しました');
      }
      
      const data = await response.json();
      setAttendanceData(data);
      toast.success('勤怠データを更新しました');
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast.error('勤怠データの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // マウント時とパラメータ変更時にデータ取得
  useEffect(() => {
    fetchAttendanceData();
  }, [period, dateRange.from, dateRange.to]);

  // 期間表示のフォーマット
  const formatDateRange = () => {
    return `${format(dateRange.from, 'yyyy年MM月dd日', { locale: ja })} - ${format(dateRange.to, 'yyyy年MM月dd日', { locale: ja })}`;
  };

  // 擬似データ（APIからの応答がない場合のフォールバック）
  const mockAttendanceData = {
    period: {
      start: dateRange.from,
      end: dateRange.to,
      type: period
    },
    summary: {
      totalRecords: 135,
      totalStaff: 15,
      totalWorkingHours: 980.5,
      totalLateCount: 12,
      totalAbsentCount: 5,
      onTimeRate: 87.4,
      totalEstimatedWage: 1356000
    },
    staffStats: [
      { 
        userId: "user1", 
        name: "山田太郎",
        totalWorkingHours: 160.5, 
        lateCount: 1, 
        absentCount: 0, 
        onTimeCount: 20, 
        attendanceRate: 100, 
        punctualityRate: 95.2, 
        averageWorkingHours: 8.5, 
        averageClockInDeviation: 2.3, 
        estimatedWage: 192600 
      },
      { 
        userId: "user2", 
        name: "佐藤花子",
        totalWorkingHours: 145.0, 
        lateCount: 2, 
        absentCount: 1, 
        onTimeCount: 18, 
        attendanceRate: 95.2, 
        punctualityRate: 90.0, 
        averageWorkingHours: 7.6, 
        averageClockInDeviation: 5.1, 
        estimatedWage: 174000 
      }
    ],
    dailyStats: [
      { 
        date: "2025-04-01", 
        totalStaff: 12, 
        onTimeCount: 10, 
        lateCount: 2, 
        absentCount: 0, 
        totalWorkingHours: 94.5, 
        averageWorkingHours: 7.9, 
        onTimeRate: 83.3 
      },
      { 
        date: "2025-04-02", 
        totalStaff: 10, 
        onTimeCount: 9, 
        lateCount: 0, 
        absentCount: 1, 
        totalWorkingHours: 85.0, 
        averageWorkingHours: 8.5, 
        onTimeRate: 90.0 
      },
      { 
        date: "2025-04-03", 
        totalStaff: 11, 
        onTimeCount: 10, 
        lateCount: 1, 
        absentCount: 0, 
        totalWorkingHours: 90.0, 
        averageWorkingHours: 8.2, 
        onTimeRate: 90.9 
      }
    ]
  };

  // 状態バッジの表示用ヘルパー関数
  const getStatusBadge = (status: string) => {
    if (status === '遅刻') {
      return <Badge variant="warning">{status}</Badge>;
    } else if (status === '欠勤') {
      return <Badge variant="destructive">{status}</Badge>;
    } else {
      return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container p-6">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">勤怠レポート</h1>
          <p className="text-muted-foreground mt-1">
            勤怠状況、出勤・退勤統計、遅刻・欠勤傾向の詳細分析
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchAttendanceData}
          disabled={isLoading}
          className="flex items-center gap-1"
        >
          <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>更新</span>
        </Button>
      </header>

      {/* フィルターオプション */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="font-medium">期間:</div>
          <Select value={period} onValueChange={(value: any) => handlePeriodChange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="期間を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">週次</SelectItem>
              <SelectItem value="month">月次</SelectItem>
              <SelectItem value="custom">カスタム</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span>{formatDateRange()}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={dateRange}
              onSelect={(range) => range && setDateRange({ 
                from: range.from || dateRange.from, 
                to: range.to || dateRange.to 
              })}
              numberOfMonths={2}
              locale={ja}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* エクスポートオプション */}
      <ExportOptions
        title="勤怠分析レポート"
        description={`期間: ${formatDateRange()}`}
        data={attendanceData || mockAttendanceData}
        type="attendance"
        period={{
          start: dateRange.from,
          end: dateRange.to,
          type: period
        }}
        customOptions={{
          includeCharts: true,
          includeSummary: true,
          includeDetails: true
        }}
      />

      {/* タブ切り替え */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-grid md:grid-cols-3">
          <TabsTrigger value="overview">データ概要</TabsTrigger>
          <TabsTrigger value="staff">スタッフ別</TabsTrigger>
          <TabsTrigger value="charts">グラフ表示</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* タブコンテンツ - 概要 */}
      <TabsContent value="overview" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">総勤務時間</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
              <div className="text-2xl font-bold">
                {isLoading ? '読込中...' : (
                  `${(attendanceData?.summary?.totalWorkingHours || mockAttendanceData.summary.totalWorkingHours).toFixed(1)} 時間`
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">定時出勤率</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center">
              <UserCheck className="h-5 w-5 mr-2 text-muted-foreground" />
              <div className="text-2xl font-bold">
                {isLoading ? '読込中...' : (
                  `${(attendanceData?.summary?.onTimeRate || mockAttendanceData.summary.onTimeRate).toFixed(1)}%`
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">遅刻件数</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-amber-500" />
              <div className="text-2xl font-bold">
                {isLoading ? '読込中...' : (attendanceData?.summary?.totalLateCount || mockAttendanceData.summary.totalLateCount)} 件
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">欠勤件数</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center">
              <UserX className="h-5 w-5 mr-2 text-red-500" />
              <div className="text-2xl font-bold">
                {isLoading ? '読込中...' : (attendanceData?.summary?.totalAbsentCount || mockAttendanceData.summary.totalAbsentCount)} 件
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 日別勤怠統計 */}
        <Card>
          <CardHeader>
            <CardTitle>日別勤怠状況</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted">
                  <tr>
                    <th scope="col" className="px-6 py-3">日付</th>
                    <th scope="col" className="px-6 py-3">総スタッフ</th>
                    <th scope="col" className="px-6 py-3">出勤</th>
                    <th scope="col" className="px-6 py-3">遅刻</th>
                    <th scope="col" className="px-6 py-3">欠勤</th>
                    <th scope="col" className="px-6 py-3">総勤務時間</th>
                    <th scope="col" className="px-6 py-3">定時出勤率</th>
                  </tr>
                </thead>
                <tbody>
                  {(isLoading ? [] : (attendanceData?.dailyStats || mockAttendanceData.dailyStats)).map((day: any, index: number) => (
                    <tr key={index} className="bg-white border-b">
                      <td className="px-6 py-4 font-medium">
                        {format(new Date(day.date), 'MM/dd (E)', { locale: ja })}
                      </td>
                      <td className="px-6 py-4">{day.totalStaff}</td>
                      <td className="px-6 py-4">{day.onTimeCount}</td>
                      <td className="px-6 py-4">
                        {day.lateCount > 0 ? 
                          <span className="px-2 py-1 text-xs font-medium rounded bg-amber-100 text-amber-800">
                            {day.lateCount}
                          </span> : day.lateCount}
                      </td>
                      <td className="px-6 py-4">
                        {day.absentCount > 0 ? 
                          <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">
                            {day.absentCount}
                          </span> : day.absentCount}
                      </td>
                      <td className="px-6 py-4">{day.totalWorkingHours.toFixed(1)} 時間</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${day.onTimeRate}%` }}></div>
                          </div>
                          <span>{day.onTimeRate.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* タブコンテンツ - スタッフ別 */}
      <TabsContent value="staff" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>スタッフ別勤怠状況</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted">
                  <tr>
                    <th scope="col" className="px-6 py-3">名前</th>
                    <th scope="col" className="px-6 py-3">勤務時間</th>
                    <th scope="col" className="px-6 py-3">出勤回数</th>
                    <th scope="col" className="px-6 py-3">遅刻回数</th>
                    <th scope="col" className="px-6 py-3">欠勤回数</th>
                    <th scope="col" className="px-6 py-3">定時出勤率</th>
                    <th scope="col" className="px-6 py-3">給与予測</th>
                  </tr>
                </thead>
                <tbody>
                  {(isLoading ? [] : (attendanceData?.staffStats || mockAttendanceData.staffStats)).map((staff: any, index: number) => (
                    <tr key={index} className="bg-white border-b">
                      <td className="px-6 py-4 font-medium">{staff.name}</td>
                      <td className="px-6 py-4">{staff.totalWorkingHours.toFixed(1)} 時間</td>
                      <td className="px-6 py-4">{staff.onTimeCount}</td>
                      <td className="px-6 py-4">
                        {staff.lateCount > 0 ? 
                          <span className="px-2 py-1 text-xs font-medium rounded bg-amber-100 text-amber-800">
                            {staff.lateCount}
                          </span> : staff.lateCount}
                      </td>
                      <td className="px-6 py-4">
                        {staff.absentCount > 0 ? 
                          <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">
                            {staff.absentCount}
                          </span> : staff.absentCount}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                            <div 
                              className={`h-2.5 rounded-full ${
                                staff.punctualityRate >= 90 ? 'bg-green-500' : 
                                staff.punctualityRate >= 75 ? 'bg-blue-500' : 
                                staff.punctualityRate >= 60 ? 'bg-amber-500' : 'bg-red-500'
                              }`} 
                              style={{ width: `${staff.punctualityRate}%` }}
                            ></div>
                          </div>
                          <span>{staff.punctualityRate.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">¥{staff.estimatedWage.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 異常データの分析 */}
        <Card>
          <CardHeader>
            <CardTitle>異常値の分析</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted">
                  <tr>
                    <th scope="col" className="px-6 py-3">名前</th>
                    <th scope="col" className="px-6 py-3">平均出勤時刻乖離</th>
                    <th scope="col" className="px-6 py-3">平均勤務時間</th>
                    <th scope="col" className="px-6 py-3">出勤率</th>
                    <th scope="col" className="px-6 py-3">潜在的課題</th>
                  </tr>
                </thead>
                <tbody>
                  {(isLoading ? [] : (attendanceData?.staffStats || mockAttendanceData.staffStats))
                    .filter((staff: any) => 
                      staff.averageClockInDeviation > 5 || 
                      staff.punctualityRate < 80 || 
                      staff.attendanceRate < 90
                    )
                    .map((staff: any, index: number) => (
                      <tr key={index} className="bg-white border-b">
                        <td className="px-6 py-4 font-medium">{staff.name}</td>
                        <td className="px-6 py-4">
                          {staff.averageClockInDeviation > 5 ? (
                            <span className="px-2 py-1 text-xs font-medium rounded bg-amber-100 text-amber-800">
                              {staff.averageClockInDeviation.toFixed(1)} 分
                            </span>
                          ) : `${staff.averageClockInDeviation.toFixed(1)} 分`}
                        </td>
                        <td className="px-6 py-4">{staff.averageWorkingHours.toFixed(1)} 時間/日</td>
                        <td className="px-6 py-4">
                          {staff.attendanceRate < 90 ? (
                            <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">
                              {staff.attendanceRate.toFixed(1)}%
                            </span>
                          ) : `${staff.attendanceRate.toFixed(1)}%`}
                        </td>
                        <td className="px-6 py-4">
                          {staff.averageClockInDeviation > 10 ? '時間厳守の課題' : ''}
                          {staff.averageClockInDeviation > 10 && staff.attendanceRate < 90 ? ', ' : ''}
                          {staff.attendanceRate < 90 ? '出勤率の改善が必要' : ''}
                          {(staff.averageClockInDeviation <= 10 && staff.attendanceRate >= 90) ? '特に問題なし' : ''}
                        </td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* グラフタブ */}
      <TabsContent value="charts">
        <AttendanceTrendChart data={attendanceData || mockAttendanceData} />
      </TabsContent>
    </div>
  );
} 