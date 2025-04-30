'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  Cell,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis
} from 'recharts';

// スタッフパフォーマンスのデータ型
interface StaffPerformanceChartProps {
  data: {
    period: {
      start: string;
      end: string;
      type: string;
    };
    summary: {
      totalStaff: number;
      totalShifts: number;
      totalWorkHours: number;
      avgPunctualityRate: number;
      totalEstimatedWage: number;
      avgRequestFulfillmentRate: number;
    };
    staffPerformance: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      department: string;
      hourlyWage: number;
      joinDate: string;
      stats: {
        shiftsCount: number;
        totalWorkHours: number;
        avgWeeklyHours: number;
        onTimeCount: number;
        lateCount: number;
        absentCount: number;
        punctualityRate: number;
        estimatedWage: number;
        requestsCount: number;
        fulfilledCount: number;
        fulfillmentRate: number;
      };
    }>;
    departmentStats: Array<{
      department: string;
      staffCount: number;
      avgPunctualityRate: number;
      totalWorkHours: number;
      avgWorkHoursPerStaff: number;
    }>;
  };
}

// PIE チャートの色
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

// パフォーマンス評価のレーダーチャートの項目
const PERFORMANCE_ASPECTS = [
  { name: '勤務時間', key: 'workHoursScore' },
  { name: '勤務効率', key: 'efficiencyScore' },
  { name: '出勤率', key: 'attendanceScore' },
  { name: '時間厳守', key: 'punctualityScore' },
  { name: '希望達成', key: 'fulfillmentScore' }
];

const StaffPerformanceChart: React.FC<StaffPerformanceChartProps> = ({ data }) => {
  // 部署別パフォーマンスデータ
  const departmentData = useMemo(() => {
    return data.departmentStats.map((dept, index) => ({
      name: dept.department,
      staffCount: dept.staffCount,
      avgPunctuality: parseFloat(dept.avgPunctualityRate.toFixed(1)),
      totalHours: parseFloat(dept.totalWorkHours.toFixed(1)),
      avgHoursPerStaff: parseFloat(dept.avgWorkHoursPerStaff.toFixed(1)),
      color: COLORS[index % COLORS.length]
    }));
  }, [data.departmentStats]);

  // スタッフパフォーマンスデータ（基本統計）
  const staffBasicData = useMemo(() => {
    return data.staffPerformance.map(staff => ({
      name: staff.name,
      role: staff.role,
      department: staff.department,
      shiftsCount: staff.stats.shiftsCount,
      workHours: staff.stats.totalWorkHours,
      hourlyWage: staff.hourlyWage,
      estimatedWage: staff.stats.estimatedWage
    }));
  }, [data.staffPerformance]);

  // スタッフ勤怠データ
  const staffAttendanceData = useMemo(() => {
    return data.staffPerformance.map(staff => ({
      name: staff.name,
      department: staff.department,
      onTimeCount: staff.stats.onTimeCount,
      lateCount: staff.stats.lateCount,
      absentCount: staff.stats.absentCount,
      punctualityRate: staff.stats.punctualityRate
    }));
  }, [data.staffPerformance]);

  // スタッフの希望達成データ
  const staffRequestData = useMemo(() => {
    return data.staffPerformance.map(staff => ({
      name: staff.name,
      department: staff.department,
      requestsCount: staff.stats.requestsCount,
      fulfilledCount: staff.stats.fulfilledCount,
      fulfillmentRate: staff.stats.fulfillmentRate
    }));
  }, [data.staffPerformance]);

  // スタッフのパフォーマンススコア計算（レーダーチャート用）
  const staffPerformanceScores = useMemo(() => {
    // 平均値の計算（正規化の基準）
    const avgWorkHours = data.staffPerformance.reduce((sum, s) => sum + s.stats.totalWorkHours, 0) / 
                         (data.staffPerformance.length || 1);
    const avgWeeklyHours = data.staffPerformance.reduce((sum, s) => sum + s.stats.avgWeeklyHours, 0) / 
                          (data.staffPerformance.length || 1);
    
    // 各スタッフのスコア計算
    return data.staffPerformance.map(staff => {
      // 勤務時間スコア（平均との比較、最大100）
      const workHoursScore = Math.min(100, (staff.stats.totalWorkHours / avgWorkHours) * 75);
      
      // 勤務効率スコア（週あたり平均時間から計算）
      const efficiencyScore = Math.min(100, (staff.stats.avgWeeklyHours / avgWeeklyHours) * 75);
      
      // 出勤率スコア（欠勤の少なさ）
      const totalShifts = staff.stats.onTimeCount + staff.stats.lateCount + staff.stats.absentCount;
      const attendanceScore = totalShifts > 0 ? 
        Math.min(100, ((staff.stats.onTimeCount + staff.stats.lateCount) / totalShifts) * 100) : 50;
      
      // 時間厳守スコア（遅刻の少なさ）
      const totalAttendance = staff.stats.onTimeCount + staff.stats.lateCount;
      const punctualityScore = totalAttendance > 0 ? 
        Math.min(100, (staff.stats.onTimeCount / totalAttendance) * 100) : 50;
      
      // 希望達成スコア
      const fulfillmentScore = staff.stats.requestsCount > 0 ? 
        Math.min(100, (staff.stats.fulfillmentRate)) : 50;
      
      // 総合スコア（単純平均）
      const overallScore = (workHoursScore + efficiencyScore + attendanceScore + punctualityScore + fulfillmentScore) / 5;
      
      return {
        name: staff.name,
        department: staff.department,
        workHoursScore,
        efficiencyScore,
        attendanceScore,
        punctualityScore,
        fulfillmentScore,
        overallScore
      };
    });
  }, [data.staffPerformance]);

  // 散布図用データ（勤務時間vs勤務効率）
  const scatterData = useMemo(() => {
    return data.staffPerformance.map(staff => ({
      name: staff.name,
      department: staff.department,
      workHours: staff.stats.totalWorkHours,
      efficiency: staff.stats.avgWeeklyHours,
      punctuality: staff.stats.punctualityRate,
      z: Math.max(15, Math.min(40, staff.stats.shiftsCount * 2)) // バブルサイズ（シフト数に比例）
    }));
  }, [data.staffPerformance]);

  // レーダーチャート用データの整形
  const radarData = useMemo(() => {
    return staffPerformanceScores.slice(0, 5).map(staff => {
      const result: Record<string, any> = { name: staff.name };
      
      PERFORMANCE_ASPECTS.forEach(aspect => {
        result[aspect.name] = parseFloat(staff[aspect.key].toFixed(1));
      });
      
      return result;
    });
  }, [staffPerformanceScores]);

  // トップパフォーマーの計算
  const topPerformers = useMemo(() => {
    return [...staffPerformanceScores]
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 5)
      .map((staff, index) => ({
        rank: index + 1,
        name: staff.name,
        department: staff.department,
        score: parseFloat(staff.overallScore.toFixed(1))
      }));
  }, [staffPerformanceScores]);

  return (
    <div className="space-y-6">
      {/* トップパフォーマーの表示 */}
      <Card>
        <CardHeader>
          <CardTitle>トップパフォーマー</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {topPerformers.map(performer => (
              <div key={performer.name} className="p-4 border rounded-lg shadow-sm flex flex-col items-center">
                <div className="text-3xl font-bold mb-2">#{performer.rank}</div>
                <div className="text-lg font-semibold text-center mb-1">{performer.name}</div>
                <div className="text-sm text-muted-foreground mb-2">{performer.department}</div>
                <div className="text-xl font-bold">{performer.score}</div>
                <div className="text-xs text-muted-foreground">パフォーマンススコア</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 部署別パフォーマンス */}
      <Card>
        <CardHeader>
          <CardTitle>部署別パフォーマンス</CardTitle>
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
                <YAxis yAxisId="left" orientation="left" label={{ value: '時間', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: '%', angle: 90, position: 'insideRight' }} />
                <Tooltip formatter={(value, name) => {
                  if (name === 'totalHours') return [`${value} 時間`, '総勤務時間'];
                  if (name === 'avgHoursPerStaff') return [`${value} 時間/人`, '平均勤務時間'];
                  if (name === 'avgPunctuality') return [`${value}%`, '平均定時出勤率'];
                  if (name === 'staffCount') return [value, 'スタッフ数'];
                  return [value, name];
                }} />
                <Legend />
                <Bar yAxisId="left" dataKey="totalHours" name="totalHours" fill="#8884d8" />
                <Bar yAxisId="left" dataKey="avgHoursPerStaff" name="avgHoursPerStaff" fill="#82ca9d" />
                <Bar yAxisId="right" dataKey="avgPunctuality" name="avgPunctuality" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* スタッフパフォーマンスレーダーチャート */}
      <Card>
        <CardHeader>
          <CardTitle>スタッフパフォーマンス分析</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                {Object.keys(radarData[0] || {}).filter(key => key !== 'name').map((key, index) => (
                  <Radar
                    key={key}
                    name={key}
                    dataKey={key}
                    stroke={COLORS[index % COLORS.length]}
                    fill={COLORS[index % COLORS.length]}
                    fillOpacity={0.6}
                  />
                ))}
                <Legend />
                <Tooltip formatter={(value) => [`${value}`, '']} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 勤務時間と効率性の散布図 */}
      <Card>
        <CardHeader>
          <CardTitle>勤務時間 vs 効率性</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid />
                <XAxis 
                  type="number" 
                  dataKey="workHours" 
                  name="勤務時間" 
                  unit="時間"
                  label={{ value: '総勤務時間 (時間)', position: 'bottom', offset: 5 }} 
                />
                <YAxis 
                  type="number" 
                  dataKey="efficiency" 
                  name="効率" 
                  unit="時間/週"
                  label={{ value: '平均週次勤務時間 (時間/週)', angle: -90, position: 'left' }} 
                />
                <ZAxis 
                  type="number" 
                  dataKey="z" 
                  range={[15, 200]} 
                  name="シフト数" 
                />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === '勤務時間') return [`${value} 時間`, name];
                    if (name === '効率') return [`${value} 時間/週`, name];
                    if (name === 'シフト数') return [`${value}`, name];
                    return [value, name];
                  }}
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-2 border shadow-sm">
                          <p className="font-bold">{payload[0].payload.name}</p>
                          <p className="text-sm">{payload[0].payload.department}</p>
                          <p className="text-sm">勤務時間: {payload[0].value} 時間</p>
                          <p className="text-sm">効率: {payload[1].value} 時間/週</p>
                          <p className="text-sm">定時出勤率: {payload[0].payload.punctuality.toFixed(1)}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Scatter name="スタッフ" data={scatterData} fill="#8884d8" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 勤務時間と推定給与 */}
      <Card>
        <CardHeader>
          <CardTitle>勤務時間と推定給与</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={staffBasicData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" label={{ value: '時間', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: '円', angle: 90, position: 'insideRight' }} />
                <Tooltip formatter={(value, name) => {
                  if (name === 'workHours') return [`${value} 時間`, '勤務時間'];
                  if (name === 'hourlyWage') return [`${value} 円/時`, '時給'];
                  if (name === 'estimatedWage') return [`${value.toLocaleString()} 円`, '推定給与'];
                  return [value, name];
                }} />
                <Legend />
                <Bar yAxisId="left" dataKey="workHours" name="workHours" fill="#8884d8" />
                <Bar yAxisId="right" dataKey="hourlyWage" name="hourlyWage" fill="#82ca9d" />
                <Bar yAxisId="right" dataKey="estimatedWage" name="estimatedWage" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* サマリー情報 */}
      <Card>
        <CardHeader>
          <CardTitle>スタッフパフォーマンスサマリー</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg shadow-sm">
              <div className="text-sm text-muted-foreground">総スタッフ数</div>
              <div className="text-2xl font-bold mt-1">{data.summary.totalStaff}</div>
            </div>
            <div className="p-4 border rounded-lg shadow-sm">
              <div className="text-sm text-muted-foreground">総勤務時間</div>
              <div className="text-2xl font-bold mt-1">{data.summary.totalWorkHours} 時間</div>
            </div>
            <div className="p-4 border rounded-lg shadow-sm">
              <div className="text-sm text-muted-foreground">平均定時出勤率</div>
              <div className="text-2xl font-bold mt-1">{data.summary.avgPunctualityRate.toFixed(1)}%</div>
            </div>
            <div className="p-4 border rounded-lg shadow-sm">
              <div className="text-sm text-muted-foreground">平均希望達成率</div>
              <div className="text-2xl font-bold mt-1">{data.summary.avgRequestFulfillmentRate.toFixed(1)}%</div>
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

export default StaffPerformanceChart; 