'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

// シフト分布のデータ型
interface ShiftDistributionProps {
  data: {
    summary: {
      totalShifts: number;
      totalStaff: number;
      totalHours: number;
      requestFulfillmentRate: number;
    };
    departmentStats: Array<{
      department: string;
      totalHours: number;
      shiftsCount: number;
      staffCount: number;
    }>;
    roleStats: Array<{
      role: string;
      totalHours: number;
      shiftsCount: number;
      staffCount: number;
    }>;
    dailyDistribution: Array<{
      date: string;
      totalShifts: number;
      totalHours: number;
      staffCount: number;
    }>;
  };
}

// PIE チャートの色
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

const ShiftDistributionChart: React.FC<ShiftDistributionProps> = ({ data }) => {
  // 部署別データの準備
  const departmentData = useMemo(() => {
    return data.departmentStats.map((item, index) => ({
      name: item.department,
      hours: parseFloat(item.totalHours.toFixed(1)),
      shifts: item.shiftsCount,
      staff: item.staffCount,
      color: COLORS[index % COLORS.length]
    }));
  }, [data.departmentStats]);

  // 日別データの準備
  const dailyData = useMemo(() => {
    return data.dailyDistribution.map(item => ({
      date: item.date,
      shifts: item.totalShifts,
      hours: parseFloat(item.totalHours.toFixed(1)),
      staff: item.staffCount
    }));
  }, [data.dailyDistribution]);

  // 役割別データの準備
  const roleData = useMemo(() => {
    return data.roleStats.map((item, index) => ({
      name: item.role,
      value: item.totalHours,
      shifts: item.shiftsCount,
      staff: item.staffCount,
      color: COLORS[index % COLORS.length]
    }));
  }, [data.roleStats]);

  // トレンドデータの準備（日別の平均勤務時間）
  const trendData = useMemo(() => {
    return data.dailyDistribution.map(item => ({
      date: item.date,
      avgHoursPerStaff: item.staffCount > 0 ? parseFloat((item.totalHours / item.staffCount).toFixed(1)) : 0
    }));
  }, [data.dailyDistribution]);

  return (
    <div className="space-y-6">
      {/* 部署別シフト分布 */}
      <Card>
        <CardHeader>
          <CardTitle>部署別シフト分布</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={departmentData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" label={{ value: '時間 (h)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'シフト数', angle: 90, position: 'insideRight' }} />
                <Tooltip formatter={(value: number, name: string) => {
                  if (name === 'hours') return [`${value} 時間`, '総勤務時間'];
                  if (name === 'shifts') return [value, 'シフト数'];
                  if (name === 'staff') return [value, 'スタッフ数'];
                  return [value, name];
                }} />
                <Legend formatter={(value) => {
                  if (value === 'hours') return '総勤務時間';
                  if (value === 'shifts') return 'シフト数';
                  if (value === 'staff') return 'スタッフ数';
                  return value;
                }} />
                <Bar yAxisId="left" dataKey="hours" name="hours" fill="#8884d8" />
                <Bar yAxisId="right" dataKey="shifts" name="shifts" fill="#82ca9d" />
                <Bar yAxisId="right" dataKey="staff" name="staff" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 日別シフト分布 */}
      <Card>
        <CardHeader>
          <CardTitle>日別シフト配置状況</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dailyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" orientation="left" label={{ value: '時間 (h)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: '数', angle: 90, position: 'insideRight' }} />
                <Tooltip formatter={(value: number, name: string) => {
                  if (name === 'hours') return [`${value} 時間`, '総勤務時間'];
                  if (name === 'shifts') return [value, 'シフト数'];
                  if (name === 'staff') return [value, 'スタッフ数'];
                  return [value, name];
                }} />
                <Legend formatter={(value) => {
                  if (value === 'hours') return '総勤務時間';
                  if (value === 'shifts') return 'シフト数';
                  if (value === 'staff') return 'スタッフ数';
                  return value;
                }} />
                <Bar yAxisId="left" dataKey="hours" name="hours" fill="#8884d8" />
                <Bar yAxisId="right" dataKey="shifts" name="shifts" fill="#82ca9d" />
                <Bar yAxisId="right" dataKey="staff" name="staff" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 役割別シフト分布 (円グラフ) */}
      <Card>
        <CardHeader>
          <CardTitle>役割別シフト分布</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {roleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [`${parseFloat(value.toString()).toFixed(1)} 時間`, props.payload.name]} />
                <Legend formatter={(value, entry) => entry.payload.name} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 日別平均勤務時間トレンド (折れ線グラフ) */}
      <Card>
        <CardHeader>
          <CardTitle>スタッフあたり平均勤務時間推移</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis label={{ value: '時間/人', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value: number) => [`${value} 時間/人`, '平均勤務時間']} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avgHoursPerStaff"
                  name="スタッフあたり平均勤務時間"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* サマリー情報 */}
      <Card>
        <CardHeader>
          <CardTitle>シフト統計サマリー</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg shadow-sm">
              <div className="text-sm text-muted-foreground">総シフト数</div>
              <div className="text-2xl font-bold mt-1">{data.summary.totalShifts}</div>
            </div>
            <div className="p-4 border rounded-lg shadow-sm">
              <div className="text-sm text-muted-foreground">総勤務時間</div>
              <div className="text-2xl font-bold mt-1">{parseFloat(data.summary.totalHours.toFixed(1))} 時間</div>
            </div>
            <div className="p-4 border rounded-lg shadow-sm">
              <div className="text-sm text-muted-foreground">シフト希望達成率</div>
              <div className="text-2xl font-bold mt-1">{data.summary.requestFulfillmentRate.toFixed(1)}%</div>
            </div>
            <div className="p-4 border rounded-lg shadow-sm">
              <div className="text-sm text-muted-foreground">総スタッフ数</div>
              <div className="text-2xl font-bold mt-1">{data.summary.totalStaff}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShiftDistributionChart; 