'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

// 勤怠傾向のデータ型
interface AttendanceTrendChartProps {
  data: {
    summary: {
      totalRecords: number;
      totalStaff: number;
      totalWorkingHours: number;
      totalLateCount: number;
      totalAbsentCount: number;
      onTimeRate: number;
      totalEstimatedWage: number;
    };
    staffStats: Array<{
      userId: string;
      name: string;
      totalWorkingHours: number;
      lateCount: number;
      absentCount: number;
      onTimeCount: number;
      attendanceRate: number;
      punctualityRate: number;
      averageWorkingHours: number;
      averageClockInDeviation: number;
      estimatedWage: number;
    }>;
    dailyStats: Array<{
      date: string;
      totalStaff: number;
      onTimeCount: number;
      lateCount: number;
      absentCount: number;
      totalWorkingHours: number;
      averageWorkingHours: number;
      onTimeRate: number;
    }>;
  };
}

const AttendanceTrendChart: React.FC<AttendanceTrendChartProps> = ({ data }) => {
  // スタッフ別データの準備
  const staffData = useMemo(() => {
    return data.staffStats.map(staff => ({
      name: staff.name,
      workingHours: staff.totalWorkingHours,
      lateCount: staff.lateCount,
      absentCount: staff.absentCount,
      onTimeRate: parseFloat(staff.punctualityRate.toFixed(1)),
      clockDeviation: staff.averageClockInDeviation,
      estimatedWage: staff.estimatedWage
    }));
  }, [data.staffStats]);

  // 日別データの準備
  const dailyData = useMemo(() => {
    return data.dailyStats.map(day => ({
      date: day.date,
      onTime: day.onTimeCount,
      late: day.lateCount,
      absent: day.absentCount,
      totalHours: day.totalWorkingHours,
      avgHours: day.averageWorkingHours,
      onTimeRate: parseFloat(day.onTimeRate.toFixed(1))
    }));
  }, [data.dailyStats]);

  // 勤怠状況の傾向データ（時系列）
  const attendanceStatusTrend = useMemo(() => {
    return data.dailyStats.map(day => ({
      date: day.date,
      onTimeRate: parseFloat(day.onTimeRate.toFixed(1)),
      lateRate: day.totalStaff > 0 ? parseFloat(((day.lateCount / day.totalStaff) * 100).toFixed(1)) : 0,
      absentRate: day.totalStaff > 0 ? parseFloat(((day.absentCount / day.totalStaff) * 100).toFixed(1)) : 0
    }));
  }, [data.dailyStats]);

  // スタッフの勤務時間異常値検出データ
  const workingHoursDeviation = useMemo(() => {
    // 平均勤務時間を計算
    const avgWorkingHours = data.staffStats.reduce((sum, staff) => sum + staff.averageWorkingHours, 0) / 
                            (data.staffStats.length || 1);
    
    return data.staffStats.map(staff => ({
      name: staff.name,
      avgHours: staff.averageWorkingHours,
      deviation: parseFloat((staff.averageWorkingHours - avgWorkingHours).toFixed(1)),
      deviationPercent: parseFloat((((staff.averageWorkingHours - avgWorkingHours) / avgWorkingHours) * 100).toFixed(1))
    }));
  }, [data.staffStats]);

  return (
    <div className="space-y-6">
      {/* 日別勤怠状況トレンド */}
      <Card>
        <CardHeader>
          <CardTitle>日別勤怠状況</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dailyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                stackOffset="expand"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [value, '']} />
                <Legend />
                <Bar dataKey="onTime" name="通常出勤" stackId="a" fill="#82ca9d" />
                <Bar dataKey="late" name="遅刻" stackId="a" fill="#ffc658" />
                <Bar dataKey="absent" name="欠勤" stackId="a" fill="#ff8042" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 勤怠率トレンド（折れ線グラフ） */}
      <Card>
        <CardHeader>
          <CardTitle>勤怠率の推移</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={attendanceStatusTrend}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis label={{ value: '割合 (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => [`${value}%`, '']} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="onTimeRate" 
                  name="通常出勤率" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  activeDot={{ r: 8 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="lateRate" 
                  name="遅刻率" 
                  stroke="#ffc658" 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="absentRate" 
                  name="欠勤率" 
                  stroke="#ff8042" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 勤務時間の推移（エリアチャート） */}
      <Card>
        <CardHeader>
          <CardTitle>勤務時間の推移</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={dailyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis label={{ value: '時間', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => [`${value} 時間`, '']} />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="totalHours" 
                  name="総勤務時間" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3}
                />
                <Area 
                  type="monotone" 
                  dataKey="avgHours" 
                  name="平均勤務時間/人" 
                  stroke="#82ca9d" 
                  fill="#82ca9d"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* スタッフ別勤務状況（水平バーチャート） */}
      <Card>
        <CardHeader>
          <CardTitle>スタッフ別勤務実績</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={staffData}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip formatter={(value, name) => {
                  if (name === 'workingHours') return [`${value} 時間`, '勤務時間'];
                  if (name === 'onTimeRate') return [`${value}%`, '定時出勤率'];
                  if (name === 'lateCount') return [value, '遅刻回数'];
                  if (name === 'absentCount') return [value, '欠勤回数'];
                  return [value, name];
                }} />
                <Legend />
                <Bar dataKey="workingHours" name="勤務時間" fill="#8884d8" />
                <Bar dataKey="onTimeRate" name="定時出勤率" fill="#82ca9d" />
                <Bar dataKey="lateCount" name="遅刻回数" fill="#ffc658" />
                <Bar dataKey="absentCount" name="欠勤回数" fill="#ff8042" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 出勤時刻の乖離分析 */}
      <Card>
        <CardHeader>
          <CardTitle>出勤時刻の予定乖離（分）</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={staffData.filter(s => s.clockDeviation !== 0)}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: '平均乖離（分）', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => [`${value} 分`, '平均乖離']} />
                <Legend />
                <Bar 
                  dataKey="clockDeviation" 
                  name="出勤時刻の予定乖離" 
                  fill={(data) => data.clockDeviation > 0 ? '#ff8042' : '#82ca9d'}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* サマリー情報 */}
      <Card>
        <CardHeader>
          <CardTitle>勤怠統計サマリー</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg shadow-sm">
              <div className="text-sm text-muted-foreground">総勤務時間</div>
              <div className="text-2xl font-bold mt-1">{parseFloat(data.summary.totalWorkingHours.toFixed(1))} 時間</div>
            </div>
            <div className="p-4 border rounded-lg shadow-sm">
              <div className="text-sm text-muted-foreground">定時出勤率</div>
              <div className="text-2xl font-bold mt-1">{parseFloat(data.summary.onTimeRate.toFixed(1))}%</div>
            </div>
            <div className="p-4 border rounded-lg shadow-sm">
              <div className="text-sm text-muted-foreground">遅刻件数</div>
              <div className="text-2xl font-bold mt-1">{data.summary.totalLateCount}</div>
            </div>
            <div className="p-4 border rounded-lg shadow-sm">
              <div className="text-sm text-muted-foreground">欠勤件数</div>
              <div className="text-2xl font-bold mt-1">{data.summary.totalAbsentCount}</div>
            </div>
            <div className="p-4 border rounded-lg shadow-sm">
              <div className="text-sm text-muted-foreground">総スタッフ数</div>
              <div className="text-2xl font-bold mt-1">{data.summary.totalStaff}</div>
            </div>
            <div className="p-4 border rounded-lg shadow-sm">
              <div className="text-sm text-muted-foreground">総給与予測</div>
              <div className="text-2xl font-bold mt-1">¥{data.summary.totalEstimatedWage.toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceTrendChart; 