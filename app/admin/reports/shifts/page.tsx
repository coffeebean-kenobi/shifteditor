'use client';

import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, RefreshCcw, Clock, Users, Building2, TrendingUp } from 'lucide-react';
import ShiftDistributionChart from '@/components/reports/ShiftDistributionChart';
import ExportOptions from '@/components/reports/ExportOptions';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ShiftReportsPage() {
  // 状態の定義
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [shiftData, setShiftData] = useState<any>(null);
  const [period, setPeriod] = useState<'week' | 'month' | 'custom'>('month');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

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
  const fetchShiftData = async () => {
    setIsLoading(true);
    try {
      let queryParams = new URLSearchParams({
        period: period,
        from: format(dateRange.from, 'yyyy-MM-dd'),
        to: format(dateRange.to, 'yyyy-MM-dd')
      });

      if (locationFilter !== 'all') {
        queryParams.append('location', locationFilter);
      }

      if (departmentFilter !== 'all') {
        queryParams.append('department', departmentFilter);
      }

      const response = await fetch(`/api/admin/reports/shifts?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('データ取得に失敗しました');
      }
      
      const data = await response.json();
      setShiftData(data);
      toast.success('シフトデータを更新しました');
    } catch (error) {
      console.error('Error fetching shift data:', error);
      toast.error('シフトデータの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // マウント時とパラメータ変更時にデータ取得
  useEffect(() => {
    fetchShiftData();
  }, [period, dateRange.from, dateRange.to, locationFilter, departmentFilter]);

  // 期間表示のフォーマット
  const formatDateRange = () => {
    return `${format(dateRange.from, 'yyyy年MM月dd日', { locale: ja })} - ${format(dateRange.to, 'yyyy年MM月dd日', { locale: ja })}`;
  };

  // 擬似データ（APIからの応答がない場合のフォールバック）
  const mockShiftData = {
    period: {
      start: dateRange.from,
      end: dateRange.to,
      type: period
    },
    summary: {
      totalShifts: 325,
      totalHours: 2650.5,
      totalStaff: 52,
      averageHoursPerShift: 8.2,
      coverageRate: 96.8,
      locations: [
        { name: "本店", count: 180 },
        { name: "支店A", count: 85 },
        { name: "支店B", count: 60 }
      ],
      departments: [
        { name: "営業", count: 125 },
        { name: "カウンター", count: 95 },
        { name: "キッチン", count: 80 },
        { name: "管理", count: 25 }
      ]
    },
    hourlyDistribution: [
      { hour: "06:00", count: 4 },
      { hour: "07:00", count: 12 },
      { hour: "08:00", count: 25 },
      { hour: "09:00", count: 38 },
      { hour: "10:00", count: 42 },
      { hour: "11:00", count: 45 },
      { hour: "12:00", count: 48 },
      { hour: "13:00", count: 46 },
      { hour: "14:00", count: 43 },
      { hour: "15:00", count: 39 },
      { hour: "16:00", count: 35 },
      { hour: "17:00", count: 32 },
      { hour: "18:00", count: 38 },
      { hour: "19:00", count: 42 },
      { hour: "20:00", count: 39 },
      { hour: "21:00", count: 28 },
      { hour: "22:00", count: 15 },
      { hour: "23:00", count: 6 }
    ],
    dailyDistribution: [
      { day: "月", count: 62, hours: 502 },
      { day: "火", count: 58, hours: 464 },
      { day: "水", count: 55, hours: 435 },
      { day: "木", count: 54, hours: 425 },
      { day: "金", count: 58, hours: 458 },
      { day: "土", count: 50, hours: 400 },
      { day: "日", count: 42, hours: 336 }
    ],
    departmentBreakdown: [
      {
        department: "営業",
        totalShifts: 125,
        totalHours: 1025.5,
        staffCount: 20,
        averageShiftLength: 8.2,
        coverageRate: 97.5
      },
      {
        department: "カウンター",
        totalShifts: 95,
        totalHours: 712.5,
        staffCount: 15,
        averageShiftLength: 7.5,
        coverageRate: 96.2
      },
      {
        department: "キッチン",
        totalShifts: 80,
        totalHours: 640.0,
        staffCount: 12,
        averageShiftLength: 8.0,
        coverageRate: 95.8
      },
      {
        department: "管理",
        totalShifts: 25,
        totalHours: 212.5,
        staffCount: 5,
        averageShiftLength: 8.5,
        coverageRate: 98.0
      }
    ],
    locationBreakdown: [
      {
        location: "本店",
        totalShifts: 180,
        totalHours: 1440.0,
        staffCount: 28,
        averageShiftLength: 8.0,
        coverageRate: 97.2
      },
      {
        location: "支店A",
        totalShifts: 85,
        totalHours: 697.0,
        staffCount: 15,
        averageShiftLength: 8.2,
        coverageRate: 96.5
      },
      {
        location: "支店B",
        totalShifts: 60,
        totalHours: 513.5,
        staffCount: 9,
        averageShiftLength: 8.6,
        coverageRate: 95.8
      }
    ],
    recentShifts: [
      {
        id: "shift1",
        staff: "山田太郎",
        department: "営業",
        location: "本店",
        start: "2025-04-20T09:00:00",
        end: "2025-04-20T18:00:00",
        duration: 9.0,
        status: "完了"
      },
      {
        id: "shift2",
        staff: "佐藤花子",
        department: "カウンター",
        location: "支店A",
        start: "2025-04-20T10:00:00",
        end: "2025-04-20T17:00:00",
        duration: 7.0,
        status: "完了"
      },
      {
        id: "shift3",
        staff: "鈴木一郎",
        department: "キッチン",
        location: "本店",
        start: "2025-04-20T07:00:00",
        end: "2025-04-20T16:00:00",
        duration: 9.0,
        status: "完了"
      },
      {
        id: "shift4",
        staff: "高橋真理",
        department: "カウンター",
        location: "支店B",
        start: "2025-04-20T12:00:00",
        end: "2025-04-20T20:00:00",
        duration: 8.0,
        status: "完了"
      },
      {
        id: "shift5",
        staff: "田中健太",
        department: "営業",
        location: "本店",
        start: "2025-04-21T09:00:00",
        end: "2025-04-21T18:00:00",
        duration: 9.0,
        status: "予定"
      }
    ]
  };

  return (
    <div className="container p-6">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">シフトレポート</h1>
          <p className="text-muted-foreground mt-1">
            シフトの分布、カバレッジ、部署別・店舗別の統計情報
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchShiftData}
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

        <div className="flex items-center space-x-4 ml-auto">
          <div className="font-medium">店舗:</div>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="店舗を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              {(shiftData?.summary?.locations || mockShiftData.summary.locations).map((loc: any, index: number) => (
                <SelectItem key={index} value={loc.name}>
                  {loc.name} ({loc.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="font-medium">部署:</div>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="部署を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              {(shiftData?.summary?.departments || mockShiftData.summary.departments).map((dept: any, index: number) => (
                <SelectItem key={index} value={dept.name}>
                  {dept.name} ({dept.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* エクスポートオプション */}
      <ExportOptions
        title="シフト分析レポート"
        description={`期間: ${formatDateRange()}`}
        data={shiftData || mockShiftData}
        type="shifts"
        period={{
          start: dateRange.from,
          end: dateRange.to,
          type: period
        }}
        customOptions={{
          includeHourlyDistribution: true,
          includeDailyDistribution: true,
          includeLocationBreakdown: true,
          includeDepartmentBreakdown: true
        }}
      />

      {/* タブ切り替え */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-4 md:w-auto md:inline-grid md:grid-cols-4">
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="departments">部署別</TabsTrigger>
          <TabsTrigger value="locations">店舗別</TabsTrigger>
          <TabsTrigger value="distribution">時間分布</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* タブコンテンツ - 概要 */}
      <TabsContent value="overview" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">総シフト数</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
              <div className="text-2xl font-bold">
                {isLoading ? '読込中...' : (shiftData?.summary?.totalShifts || mockShiftData.summary.totalShifts)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">総労働時間</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
              <div className="text-2xl font-bold">
                {isLoading ? '読込中...' : (
                  `${(shiftData?.summary?.totalHours || mockShiftData.summary.totalHours).toFixed(1)} 時間`
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">シフト配置スタッフ</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-muted-foreground" />
              <div className="text-2xl font-bold">
                {isLoading ? '読込中...' : (shiftData?.summary?.totalStaff || mockShiftData.summary.totalStaff)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">カバレッジ率</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-muted-foreground" />
              <div className="text-2xl font-bold">
                {isLoading ? '読込中...' : (
                  `${(shiftData?.summary?.coverageRate || mockShiftData.summary.coverageRate).toFixed(1)}%`
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 曜日別シフト分布 */}
        <Card>
          <CardHeader>
            <CardTitle>曜日別シフト分布</CardTitle>
            <CardDescription>各曜日のシフト数と総労働時間</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted">
                  <tr>
                    <th scope="col" className="px-6 py-3">曜日</th>
                    <th scope="col" className="px-6 py-3">シフト数</th>
                    <th scope="col" className="px-6 py-3">総労働時間</th>
                    <th scope="col" className="px-6 py-3">分布</th>
                  </tr>
                </thead>
                <tbody>
                  {(isLoading ? [] : (shiftData?.dailyDistribution || mockShiftData.dailyDistribution)).map((day: any, index: number) => {
                    const maxCount = Math.max(...(shiftData?.dailyDistribution || mockShiftData.dailyDistribution).map((d: any) => d.count));
                    const percentage = (day.count / maxCount) * 100;
                    
                    return (
                      <tr key={index} className="bg-white border-b">
                        <td className="px-6 py-4 font-medium">{day.day}曜日</td>
                        <td className="px-6 py-4">{day.count}</td>
                        <td className="px-6 py-4">{day.hours} 時間</td>
                        <td className="px-6 py-4">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="h-2.5 rounded-full bg-blue-500" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 最近のシフト */}
        <Card>
          <CardHeader>
            <CardTitle>最近のシフト</CardTitle>
            <CardDescription>直近のシフト情報</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3">スタッフ</th>
                    <th scope="col" className="px-4 py-3">部署</th>
                    <th scope="col" className="px-4 py-3">店舗</th>
                    <th scope="col" className="px-4 py-3">開始</th>
                    <th scope="col" className="px-4 py-3">終了</th>
                    <th scope="col" className="px-4 py-3">時間</th>
                    <th scope="col" className="px-4 py-3">状態</th>
                  </tr>
                </thead>
                <tbody>
                  {(isLoading ? [] : (shiftData?.recentShifts || mockShiftData.recentShifts)).map((shift: any, index: number) => (
                    <tr key={index} className="bg-white border-b">
                      <td className="px-4 py-3 font-medium">{shift.staff}</td>
                      <td className="px-4 py-3">{shift.department}</td>
                      <td className="px-4 py-3">{shift.location}</td>
                      <td className="px-4 py-3">{format(parseISO(shift.start), 'MM/dd HH:mm')}</td>
                      <td className="px-4 py-3">{format(parseISO(shift.end), 'MM/dd HH:mm')}</td>
                      <td className="px-4 py-3">{shift.duration}時間</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          shift.status === '完了' ? 'bg-green-100 text-green-800' : 
                          shift.status === '予定' ? 'bg-blue-100 text-blue-800' : 
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {shift.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* タブコンテンツ - 部署別 */}
      <TabsContent value="departments">
        <Card>
          <CardHeader>
            <CardTitle>部署別シフト統計</CardTitle>
            <CardDescription>部署ごとのシフトパフォーマンス指標</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted">
                  <tr>
                    <th scope="col" className="px-6 py-3">部署</th>
                    <th scope="col" className="px-6 py-3">シフト数</th>
                    <th scope="col" className="px-6 py-3">総労働時間</th>
                    <th scope="col" className="px-6 py-3">スタッフ数</th>
                    <th scope="col" className="px-6 py-3">平均シフト時間</th>
                    <th scope="col" className="px-6 py-3">カバレッジ率</th>
                  </tr>
                </thead>
                <tbody>
                  {(isLoading ? [] : (shiftData?.departmentBreakdown || mockShiftData.departmentBreakdown)).map((dept: any, index: number) => (
                    <tr key={index} className="bg-white border-b">
                      <td className="px-6 py-4 font-medium">{dept.department}</td>
                      <td className="px-6 py-4">{dept.totalShifts}</td>
                      <td className="px-6 py-4">{dept.totalHours.toFixed(1)} 時間</td>
                      <td className="px-6 py-4">{dept.staffCount}</td>
                      <td className="px-6 py-4">{dept.averageShiftLength.toFixed(1)} 時間/シフト</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                            <div 
                              className={`h-2.5 rounded-full ${
                                dept.coverageRate >= 95 ? 'bg-green-500' : 
                                dept.coverageRate >= 85 ? 'bg-blue-500' : 
                                dept.coverageRate >= 75 ? 'bg-amber-500' : 
                                'bg-red-500'
                              }`} 
                              style={{ width: `${dept.coverageRate}%` }}
                            ></div>
                          </div>
                          <span>{dept.coverageRate.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">部署別グラフ分析</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-2">シフト数の分布</h4>
                  <div className="h-64 bg-muted rounded-md flex items-center justify-center">
                    <p className="text-muted-foreground">部署別グラフが表示されます</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">労働時間の分布</h4>
                  <div className="h-64 bg-muted rounded-md flex items-center justify-center">
                    <p className="text-muted-foreground">部署別グラフが表示されます</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* タブコンテンツ - 店舗別 */}
      <TabsContent value="locations">
        <Card>
          <CardHeader>
            <CardTitle>店舗別シフト統計</CardTitle>
            <CardDescription>店舗ごとのシフトパフォーマンス指標</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted">
                  <tr>
                    <th scope="col" className="px-6 py-3">店舗</th>
                    <th scope="col" className="px-6 py-3">シフト数</th>
                    <th scope="col" className="px-6 py-3">総労働時間</th>
                    <th scope="col" className="px-6 py-3">スタッフ数</th>
                    <th scope="col" className="px-6 py-3">平均シフト時間</th>
                    <th scope="col" className="px-6 py-3">カバレッジ率</th>
                  </tr>
                </thead>
                <tbody>
                  {(isLoading ? [] : (shiftData?.locationBreakdown || mockShiftData.locationBreakdown)).map((loc: any, index: number) => (
                    <tr key={index} className="bg-white border-b">
                      <td className="px-6 py-4 font-medium">{loc.location}</td>
                      <td className="px-6 py-4">{loc.totalShifts}</td>
                      <td className="px-6 py-4">{loc.totalHours.toFixed(1)} 時間</td>
                      <td className="px-6 py-4">{loc.staffCount}</td>
                      <td className="px-6 py-4">{loc.averageShiftLength.toFixed(1)} 時間/シフト</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                            <div 
                              className={`h-2.5 rounded-full ${
                                loc.coverageRate >= 95 ? 'bg-green-500' : 
                                loc.coverageRate >= 85 ? 'bg-blue-500' : 
                                loc.coverageRate >= 75 ? 'bg-amber-500' : 
                                'bg-red-500'
                              }`} 
                              style={{ width: `${loc.coverageRate}%` }}
                            ></div>
                          </div>
                          <span>{loc.coverageRate.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              {(isLoading ? [] : (shiftData?.locationBreakdown || mockShiftData.locationBreakdown)).map((loc: any, index: number) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <CardTitle>{loc.location}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">スタッフ数</span>
                        <span className="font-medium">{loc.staffCount}人</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">シフト数</span>
                        <span className="font-medium">{loc.totalShifts}シフト</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">労働時間</span>
                        <span className="font-medium">{loc.totalHours.toFixed(1)}時間</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">平均シフト時間</span>
                        <span className="font-medium">{loc.averageShiftLength.toFixed(1)}時間</span>
                      </div>
                      <div className="pt-2">
                        <div className="text-sm text-muted-foreground mb-1">カバレッジ率: {loc.coverageRate.toFixed(1)}%</div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${
                              loc.coverageRate >= 95 ? 'bg-green-500' : 
                              loc.coverageRate >= 85 ? 'bg-blue-500' : 
                              loc.coverageRate >= 75 ? 'bg-amber-500' : 
                              'bg-red-500'
                            }`} 
                            style={{ width: `${loc.coverageRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* タブコンテンツ - 時間分布 */}
      <TabsContent value="distribution">
        <ShiftDistributionChart data={shiftData || mockShiftData} />
      </TabsContent>
    </div>
  );
} 