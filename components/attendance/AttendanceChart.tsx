'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface AttendanceChartProps {
  attendanceData: Array<{
    id: string;
    userId: string;
    userName: string;
    date: Date;
    status: string;
    workingMinutes: number;
  }>;
}

const AttendanceChart: React.FC<AttendanceChartProps> = ({ attendanceData }) => {
  // ユーザーごとに勤務時間を集計
  const chartData = useMemo(() => {
    const userWorkingTimeMap = new Map<string, { name: string; workingHours: number; lateCount: number; absentCount: number }>();
    
    attendanceData.forEach((attendance) => {
      const userData = userWorkingTimeMap.get(attendance.userId) || { 
        name: attendance.userName, 
        workingHours: 0, 
        lateCount: 0, 
        absentCount: 0 
      };
      
      userData.workingHours += attendance.workingMinutes / 60;
      
      if (attendance.status === 'LATE') {
        userData.lateCount += 1;
      } else if (attendance.status === 'ABSENT') {
        userData.absentCount += 1;
      }
      
      userWorkingTimeMap.set(attendance.userId, userData);
    });
    
    return Array.from(userWorkingTimeMap.values());
  }, [attendanceData]);

  // 日付ごとの勤務時間を集計
  const dailyChartData = useMemo(() => {
    const dailyMap = new Map<string, { date: string; workingHours: number; staffCount: number }>();
    
    attendanceData.forEach((attendance) => {
      const dateString = attendance.date.toISOString().split('T')[0];
      const dailyData = dailyMap.get(dateString) || { 
        date: dateString, 
        workingHours: 0, 
        staffCount: 0 
      };
      
      if (attendance.status !== 'ABSENT') {
        dailyData.workingHours += attendance.workingMinutes / 60;
        dailyData.staffCount += 1;
      }
      
      dailyMap.set(dateString, dailyData);
    });
    
    return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [attendanceData]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>スタッフ別勤務時間</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: '勤務時間 (時間)', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value: number | string) => [`${Number(value).toFixed(1)}時間`, '勤務時間']} />
                <Legend />
                <Bar dataKey="workingHours" name="勤務時間" fill="#8884d8" />
                <Bar dataKey="lateCount" name="遅刻回数" fill="#ffc658" />
                <Bar dataKey="absentCount" name="欠勤回数" fill="#ff8042" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>日別勤務時間推移</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dailyChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" orientation="left" label={{ value: '勤務時間 (時間)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'スタッフ数', angle: 90, position: 'insideRight' }} />
                <Tooltip formatter={(value: number | string, name: string) => {
                  if (name === 'workingHours') return [`${Number(value).toFixed(1)}時間`, '総勤務時間'];
                  return [value, 'スタッフ数'];
                }} />
                <Legend />
                <Bar yAxisId="left" dataKey="workingHours" name="総勤務時間" fill="#8884d8" />
                <Bar yAxisId="right" dataKey="staffCount" name="出勤スタッフ数" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceChart; 