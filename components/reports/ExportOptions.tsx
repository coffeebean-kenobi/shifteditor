'use client';

import React, { useState } from 'react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuLabel, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Download, FileText, BarChart, FileSpreadsheet } from 'lucide-react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

type Period = {
  start: Date;
  end: Date;
  type: 'week' | 'month' | 'custom';
};

type ExportOptionsProps = {
  title: string;
  description: string;
  data: any;
  type: 'shifts' | 'attendance' | 'staff';
  period: Period;
  customOptions?: {
    includeCharts?: boolean;
    includeSummary?: boolean;
    includeDetails?: boolean;
    includeHourlyDistribution?: boolean;
    includeDailyDistribution?: boolean;
    includeLocationBreakdown?: boolean;
    includeDepartmentBreakdown?: boolean;
  };
};

export default function ExportOptions({ 
  title, 
  description, 
  data, 
  type, 
  period,
  customOptions = {
    includeCharts: true,
    includeSummary: true,
    includeDetails: true
  }
}: ExportOptionsProps) {
  const [options, setOptions] = useState({
    includeCharts: true,
    includeSummary: true,
    includeDetails: true,
    includeHourlyDistribution: customOptions.includeHourlyDistribution ?? false,
    includeDailyDistribution: customOptions.includeDailyDistribution ?? false,
    includeLocationBreakdown: customOptions.includeLocationBreakdown ?? false,
    includeDepartmentBreakdown: customOptions.includeDepartmentBreakdown ?? false
  });

  // ファイル名の生成
  const getFileName = (ext: string) => {
    const today = format(new Date(), 'yyyyMMdd', { locale: ja });
    const periodStart = format(period.start, 'yyyyMMdd', { locale: ja });
    const periodEnd = format(period.end, 'yyyyMMdd', { locale: ja });
    return `${type}_report_${periodStart}-${periodEnd}_exported${today}.${ext}`;
  };

  // CSVエクスポート
  const exportCSV = () => {
    try {
      let csvContent = "";
      
      // ヘッダー情報の追加
      csvContent += `"${title}"\n`;
      csvContent += `"${description}"\n\n`;
      
      // データタイプによって出力内容を調整
      if (type === 'shifts') {
        // サマリー情報
        if (options.includeSummary) {
          csvContent += `"シフトサマリー"\n`;
          csvContent += `"総シフト数","${data.summary.totalShifts}"\n`;
          csvContent += `"総労働時間","${data.summary.totalHours}"\n`;
          csvContent += `"総スタッフ数","${data.summary.totalStaff}"\n`;
          csvContent += `"カバレッジ率","${data.summary.coverageRate}%"\n\n`;
        }
        
        // 部署別データ
        if (options.includeDepartmentBreakdown && data.departmentBreakdown) {
          csvContent += `"部署別統計"\n`;
          csvContent += `"部署","シフト数","総労働時間","スタッフ数","平均シフト時間","カバレッジ率"\n`;
          data.departmentBreakdown.forEach((dept: any) => {
            csvContent += `"${dept.department}","${dept.totalShifts}","${dept.totalHours}","${dept.staffCount}","${dept.averageShiftLength}","${dept.coverageRate}%"\n`;
          });
          csvContent += `\n`;
        }
        
        // 店舗別データ
        if (options.includeLocationBreakdown && data.locationBreakdown) {
          csvContent += `"店舗別統計"\n`;
          csvContent += `"店舗","シフト数","総労働時間","スタッフ数","平均シフト時間","カバレッジ率"\n`;
          data.locationBreakdown.forEach((loc: any) => {
            csvContent += `"${loc.location}","${loc.totalShifts}","${loc.totalHours}","${loc.staffCount}","${loc.averageShiftLength}","${loc.coverageRate}%"\n`;
          });
          csvContent += `\n`;
        }
        
        // 日別分布
        if (options.includeDailyDistribution && data.dailyDistribution) {
          csvContent += `"曜日別分布"\n`;
          csvContent += `"曜日","シフト数","総労働時間"\n`;
          data.dailyDistribution.forEach((day: any) => {
            csvContent += `"${day.day}曜日","${day.count}","${day.hours}"\n`;
          });
          csvContent += `\n`;
        }
        
        // 時間別分布
        if (options.includeHourlyDistribution && data.hourlyDistribution) {
          csvContent += `"時間帯別分布"\n`;
          csvContent += `"時間帯","シフト数"\n`;
          data.hourlyDistribution.forEach((hour: any) => {
            csvContent += `"${hour.hour}","${hour.count}"\n`;
          });
        }
      } else if (type === 'attendance') {
        // 勤怠データのエクスポートロジック
        if (options.includeSummary) {
          csvContent += `"勤怠サマリー"\n`;
          csvContent += `"総出勤数","${data.summary.totalAttendance}"\n`;
          csvContent += `"総労働時間","${data.summary.totalHours}"\n`;
          csvContent += `"平均稼働率","${data.summary.averageUtilization}%"\n`;
          csvContent += `"遅刻数","${data.summary.lateCount}"\n`;
          csvContent += `"早退数","${data.summary.earlyLeaveCount}"\n\n`;
        }
        
        // 詳細データ
        if (options.includeDetails && data.attendanceRecords) {
          csvContent += `"勤怠詳細記録"\n`;
          csvContent += `"スタッフ名","日付","出勤時間","退勤時間","勤務時間","状態","メモ"\n`;
          data.attendanceRecords.forEach((record: any) => {
            csvContent += `"${record.staffName}","${record.date}","${record.clockIn}","${record.clockOut}","${record.hoursWorked}","${record.status}","${record.notes}"\n`;
          });
        }
      } else if (type === 'staff') {
        // スタッフデータのエクスポートロジック
        if (options.includeSummary) {
          csvContent += `"スタッフサマリー"\n`;
          csvContent += `"総スタッフ数","${data.summary.totalStaff}"\n`;
          csvContent += `"総労働時間","${data.summary.totalHours}"\n`;
          csvContent += `"平均パフォーマンススコア","${data.summary.averagePerformanceScore}"\n\n`;
        }
        
        // 詳細データ
        if (options.includeDetails && data.staffList) {
          csvContent += `"スタッフ詳細情報"\n`;
          csvContent += `"ID","名前","部署","役職","勤務時間","パフォーマンススコア","スキルレベル"\n`;
          data.staffList.forEach((staff: any) => {
            csvContent += `"${staff.id}","${staff.name}","${staff.department}","${staff.position}","${staff.hoursWorked}","${staff.performanceScore}","${staff.skillLevel}"\n`;
          });
        }
      }
      
      // ファイルのダウンロード
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, getFileName('csv'));
      
      toast.success('CSVファイルがダウンロードされました');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('CSVエクスポートに失敗しました');
    }
  };

  // エクセルエクスポート
  const exportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      
      // メタデータシート
      const metaWS = XLSX.utils.aoa_to_sheet([
        [title],
        [description],
        ['作成日:', format(new Date(), 'yyyy/MM/dd HH:mm', { locale: ja })],
        ['対象期間:', `${format(period.start, 'yyyy/MM/dd', { locale: ja })} - ${format(period.end, 'yyyy/MM/dd', { locale: ja })}`]
      ]);
      XLSX.utils.book_append_sheet(wb, metaWS, 'レポート情報');
      
      // データタイプによってシートを追加
      if (type === 'shifts') {
        // サマリーシート
        if (options.includeSummary) {
          const summaryData = [
            ['シフトサマリー'],
            ['総シフト数', data.summary.totalShifts],
            ['総労働時間', data.summary.totalHours],
            ['総スタッフ数', data.summary.totalStaff],
            ['カバレッジ率', `${data.summary.coverageRate}%`]
          ];
          const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
          XLSX.utils.book_append_sheet(wb, summaryWS, 'サマリー');
        }
        
        // 部署別シート
        if (options.includeDepartmentBreakdown && data.departmentBreakdown) {
          const deptData = [
            ['部署別統計'],
            ['部署', 'シフト数', '総労働時間', 'スタッフ数', '平均シフト時間', 'カバレッジ率']
          ];
          data.departmentBreakdown.forEach((dept: any) => {
            deptData.push([
              dept.department, 
              dept.totalShifts, 
              dept.totalHours, 
              dept.staffCount, 
              dept.averageShiftLength, 
              `${dept.coverageRate}%`
            ]);
          });
          const deptWS = XLSX.utils.aoa_to_sheet(deptData);
          XLSX.utils.book_append_sheet(wb, deptWS, '部署別');
        }
        
        // 店舗別シート
        if (options.includeLocationBreakdown && data.locationBreakdown) {
          const locData = [
            ['店舗別統計'],
            ['店舗', 'シフト数', '総労働時間', 'スタッフ数', '平均シフト時間', 'カバレッジ率']
          ];
          data.locationBreakdown.forEach((loc: any) => {
            locData.push([
              loc.location, 
              loc.totalShifts, 
              loc.totalHours, 
              loc.staffCount, 
              loc.averageShiftLength, 
              `${loc.coverageRate}%`
            ]);
          });
          const locWS = XLSX.utils.aoa_to_sheet(locData);
          XLSX.utils.book_append_sheet(wb, locWS, '店舗別');
        }
        
        // 日別分布シート
        if (options.includeDailyDistribution && data.dailyDistribution) {
          const dayData = [
            ['曜日別分布'],
            ['曜日', 'シフト数', '総労働時間']
          ];
          data.dailyDistribution.forEach((day: any) => {
            dayData.push([`${day.day}曜日`, day.count, day.hours]);
          });
          const dayWS = XLSX.utils.aoa_to_sheet(dayData);
          XLSX.utils.book_append_sheet(wb, dayWS, '曜日別');
        }
        
        // 時間別分布シート
        if (options.includeHourlyDistribution && data.hourlyDistribution) {
          const hourData = [
            ['時間帯別分布'],
            ['時間帯', 'シフト数']
          ];
          data.hourlyDistribution.forEach((hour: any) => {
            hourData.push([hour.hour, hour.count]);
          });
          const hourWS = XLSX.utils.aoa_to_sheet(hourData);
          XLSX.utils.book_append_sheet(wb, hourWS, '時間帯別');
        }
      } else if (type === 'attendance') {
        // 勤怠サマリーシート
        if (options.includeSummary) {
          const summaryData = [
            ['勤怠サマリー'],
            ['総出勤数', data.summary.totalAttendance],
            ['総労働時間', data.summary.totalHours],
            ['平均稼働率', `${data.summary.averageUtilization}%`],
            ['遅刻数', data.summary.lateCount],
            ['早退数', data.summary.earlyLeaveCount]
          ];
          const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
          XLSX.utils.book_append_sheet(wb, summaryWS, 'サマリー');
        }
        
        // 勤怠詳細シート
        if (options.includeDetails && data.attendanceRecords) {
          const detailsData = [
            ['勤怠詳細記録'],
            ['スタッフ名', '日付', '出勤時間', '退勤時間', '勤務時間', '状態', 'メモ']
          ];
          data.attendanceRecords.forEach((record: any) => {
            detailsData.push([
              record.staffName,
              record.date,
              record.clockIn,
              record.clockOut,
              record.hoursWorked,
              record.status,
              record.notes
            ]);
          });
          const detailsWS = XLSX.utils.aoa_to_sheet(detailsData);
          XLSX.utils.book_append_sheet(wb, detailsWS, '勤怠詳細');
        }
      } else if (type === 'staff') {
        // スタッフサマリーシート
        if (options.includeSummary) {
          const summaryData = [
            ['スタッフサマリー'],
            ['総スタッフ数', data.summary.totalStaff],
            ['総労働時間', data.summary.totalHours],
            ['平均パフォーマンススコア', data.summary.averagePerformanceScore]
          ];
          const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
          XLSX.utils.book_append_sheet(wb, summaryWS, 'サマリー');
        }
        
        // スタッフ詳細シート
        if (options.includeDetails && data.staffList) {
          const detailsData = [
            ['スタッフ詳細情報'],
            ['ID', '名前', '部署', '役職', '勤務時間', 'パフォーマンススコア', 'スキルレベル']
          ];
          data.staffList.forEach((staff: any) => {
            detailsData.push([
              staff.id,
              staff.name,
              staff.department,
              staff.position,
              staff.hoursWorked,
              staff.performanceScore,
              staff.skillLevel
            ]);
          });
          const detailsWS = XLSX.utils.aoa_to_sheet(detailsData);
          XLSX.utils.book_append_sheet(wb, detailsWS, 'スタッフ詳細');
        }
      }
      
      // ファイルのダウンロード
      XLSX.writeFile(wb, getFileName('xlsx'));
      
      toast.success('Excelファイルがダウンロードされました');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Excelエクスポートに失敗しました');
    }
  };

  // PDFエクスポート
  const exportPDF = () => {
    toast.info('PDFエクスポート機能は開発中です。');
  };

  return (
    <div className="flex justify-end mb-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            <span>エクスポート</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>エクスポート形式を選択</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="flex items-center gap-2" onClick={exportCSV}>
            <FileText className="h-4 w-4" />
            <span>CSVでダウンロード</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center gap-2" onClick={exportExcel}>
            <FileSpreadsheet className="h-4 w-4" />
            <span>Excelでダウンロード</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center gap-2" onClick={exportPDF}>
            <FileText className="h-4 w-4" />
            <span>PDFでダウンロード</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>出力内容オプション</DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={options.includeSummary}
            onCheckedChange={(checked) => setOptions({...options, includeSummary: checked})}
          >
            サマリー情報を含める
          </DropdownMenuCheckboxItem>
          {customOptions.includeDetails !== undefined && (
            <DropdownMenuCheckboxItem
              checked={options.includeDetails}
              onCheckedChange={(checked) => setOptions({...options, includeDetails: checked})}
            >
              詳細データを含める
            </DropdownMenuCheckboxItem>
          )}
          {customOptions.includeCharts !== undefined && (
            <DropdownMenuCheckboxItem
              checked={options.includeCharts}
              onCheckedChange={(checked) => setOptions({...options, includeCharts: checked})}
            >
              グラフを含める
            </DropdownMenuCheckboxItem>
          )}
          {customOptions.includeHourlyDistribution && (
            <DropdownMenuCheckboxItem
              checked={options.includeHourlyDistribution}
              onCheckedChange={(checked) => setOptions({...options, includeHourlyDistribution: checked})}
            >
              時間帯別分布を含める
            </DropdownMenuCheckboxItem>
          )}
          {customOptions.includeDailyDistribution && (
            <DropdownMenuCheckboxItem
              checked={options.includeDailyDistribution}
              onCheckedChange={(checked) => setOptions({...options, includeDailyDistribution: checked})}
            >
              曜日別分布を含める
            </DropdownMenuCheckboxItem>
          )}
          {customOptions.includeLocationBreakdown && (
            <DropdownMenuCheckboxItem
              checked={options.includeLocationBreakdown}
              onCheckedChange={(checked) => setOptions({...options, includeLocationBreakdown: checked})}
            >
              店舗別データを含める
            </DropdownMenuCheckboxItem>
          )}
          {customOptions.includeDepartmentBreakdown && (
            <DropdownMenuCheckboxItem
              checked={options.includeDepartmentBreakdown}
              onCheckedChange={(checked) => setOptions({...options, includeDepartmentBreakdown: checked})}
            >
              部署別データを含める
            </DropdownMenuCheckboxItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}