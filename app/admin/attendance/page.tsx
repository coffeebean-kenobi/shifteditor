'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Calendar as CalendarIcon, Download, BarChart2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AttendanceChart from '@/components/attendance/AttendanceChart';
import { exportToCSV, exportToPDF } from '@/components/attendance/ExportUtils';

// 仮の勤怠データ
const mockAttendanceData = [
  {
    id: '1',
    userId: 'user1',
    userName: '山田 太郎',
    shiftId: 'shift1',
    date: new Date('2025-04-15'),
    clockInTime: new Date('2025-04-15T08:55:00'),
    clockOutTime: new Date('2025-04-15T17:05:00'),
    status: 'ON_TIME',
    workingMinutes: 490,
    note: '',
  },
  {
    id: '2',
    userId: 'user2',
    userName: '佐藤 花子',
    shiftId: 'shift2',
    date: new Date('2025-04-15'),
    clockInTime: new Date('2025-04-15T09:10:00'),
    clockOutTime: new Date('2025-04-15T18:00:00'),
    status: 'LATE',
    workingMinutes: 530,
    note: '電車遅延のため',
  },
  {
    id: '3',
    userId: 'user3',
    userName: '鈴木 一郎',
    shiftId: 'shift3',
    date: new Date('2025-04-15'),
    clockInTime: null,
    clockOutTime: null,
    status: 'ABSENT',
    workingMinutes: 0,
    note: '体調不良',
  },
  {
    id: '4',
    userId: 'user1',
    userName: '山田 太郎',
    shiftId: 'shift4',
    date: new Date('2025-04-16'),
    clockInTime: new Date('2025-04-16T08:50:00'),
    clockOutTime: new Date('2025-04-16T17:00:00'),
    status: 'ON_TIME',
    workingMinutes: 490,
    note: '',
  },
];

export default function AdminAttendancePage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(),
    to: new Date(),
  });
  const [activeTab, setActiveTab] = useState('list');
  const [viewMode, setViewMode] = useState('table');
  
  // 日付範囲で絞り込まれた勤怠データを取得
  const filteredAttendanceData = mockAttendanceData.filter(attendance => {
    const attendanceDate = attendance.date;
    return attendanceDate >= dateRange.from && attendanceDate <= dateRange.to;
  });

  // CSVエクスポート機能
  const handleExportToCSV = () => {
    exportToCSV(filteredAttendanceData, dateRange.from, dateRange.to);
  };

  // PDFエクスポート機能
  const handleExportToPDF = () => {
    exportToPDF(filteredAttendanceData, dateRange.from, dateRange.to);
  };

  // 勤怠状況に応じたセルの色を設定
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'LATE':
        return 'bg-amber-100 text-amber-800';
      case 'ABSENT':
        return 'bg-red-100 text-red-800';
      default:
        return '';
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">勤怠管理</h1>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'yyyy/MM/dd', { locale: ja })} - {format(dateRange.to, 'yyyy/MM/dd', { locale: ja })}
                    </>
                  ) : (
                    format(dateRange.from, 'yyyy/MM/dd', { locale: ja })
                  )
                ) : (
                  '日付選択'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => range && setDateRange({ from: range.from || new Date(), to: range.to || new Date() })}
                locale={ja}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" onClick={handleExportToCSV} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" onClick={handleExportToPDF} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            PDF
          </Button>
          <Button 
            variant={viewMode === 'table' ? 'outline' : 'default'} 
            onClick={() => setViewMode(viewMode === 'table' ? 'chart' : 'table')}
            className="flex items-center gap-2"
          >
            <BarChart2 className="h-4 w-4" />
            {viewMode === 'table' ? 'グラフ表示' : 'テーブル表示'}
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">勤怠一覧</TabsTrigger>
          <TabsTrigger value="summary">集計</TabsTrigger>
          <TabsTrigger value="anomalies">異常値</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>スタッフ勤怠一覧</CardTitle>
            </CardHeader>
            <CardContent>
              {viewMode === 'table' ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>日付</TableHead>
                      <TableHead>名前</TableHead>
                      <TableHead>出勤時間</TableHead>
                      <TableHead>退勤時間</TableHead>
                      <TableHead>勤務時間</TableHead>
                      <TableHead>状態</TableHead>
                      <TableHead>備考</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttendanceData.map((attendance) => (
                      <TableRow key={attendance.id}>
                        <TableCell>{format(attendance.date, 'yyyy/MM/dd', { locale: ja })}</TableCell>
                        <TableCell>{attendance.userName}</TableCell>
                        <TableCell>
                          {attendance.clockInTime 
                            ? format(attendance.clockInTime, 'HH:mm', { locale: ja }) 
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {attendance.clockOutTime 
                            ? format(attendance.clockOutTime, 'HH:mm', { locale: ja }) 
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {attendance.workingMinutes > 0 
                            ? `${Math.floor(attendance.workingMinutes / 60)}時間${attendance.workingMinutes % 60}分` 
                            : '-'}
                        </TableCell>
                        <TableCell className={getStatusClass(attendance.status)}>
                          {attendance.status === 'ON_TIME' ? '通常' 
                            : attendance.status === 'LATE' ? '遅刻' 
                            : attendance.status === 'ABSENT' ? '欠勤' 
                            : attendance.status}
                        </TableCell>
                        <TableCell>{attendance.note}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <AttendanceChart attendanceData={filteredAttendanceData} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="summary" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>勤怠集計</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">総勤務時間</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-3xl font-bold">
                      {Math.floor(filteredAttendanceData.reduce((total, att) => total + att.workingMinutes, 0) / 60)}時間
                      {filteredAttendanceData.reduce((total, att) => total + att.workingMinutes, 0) % 60}分
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">遅刻件数</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-3xl font-bold">
                      {filteredAttendanceData.filter(att => att.status === 'LATE').length}件
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">欠勤件数</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-3xl font-bold">
                      {filteredAttendanceData.filter(att => att.status === 'ABSENT').length}件
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="anomalies" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>異常値</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日付</TableHead>
                    <TableHead>名前</TableHead>
                    <TableHead>出勤時間</TableHead>
                    <TableHead>退勤時間</TableHead>
                    <TableHead>状態</TableHead>
                    <TableHead>備考</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendanceData
                    .filter(att => att.status !== 'ON_TIME')
                    .map((attendance) => (
                    <TableRow key={attendance.id}>
                      <TableCell>{format(attendance.date, 'yyyy/MM/dd', { locale: ja })}</TableCell>
                      <TableCell>{attendance.userName}</TableCell>
                      <TableCell>
                        {attendance.clockInTime 
                          ? format(attendance.clockInTime, 'HH:mm', { locale: ja }) 
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {attendance.clockOutTime 
                          ? format(attendance.clockOutTime, 'HH:mm', { locale: ja }) 
                          : '-'}
                      </TableCell>
                      <TableCell className={getStatusClass(attendance.status)}>
                        {attendance.status === 'LATE' ? '遅刻' 
                          : attendance.status === 'ABSENT' ? '欠勤' 
                          : attendance.status}
                      </TableCell>
                      <TableCell>{attendance.note}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 