import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// TypeScript用に拡張を定義
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

interface AttendanceData {
  id: string;
  userId: string;
  userName: string;
  date: Date;
  clockInTime: Date | null;
  clockOutTime: Date | null;
  status: string;
  workingMinutes: number;
  note: string;
}

// CSVへのエクスポート
export const exportToCSV = (attendanceData: AttendanceData[], from: Date, to: Date) => {
  // ヘッダー行
  const header = '日付,名前,出勤時間,退勤時間,勤務時間,状態,備考\n';
  
  // データ行
  const rows = attendanceData.map(attendance => {
    const date = format(attendance.date, 'yyyy/MM/dd', { locale: ja });
    const name = attendance.userName;
    const clockIn = attendance.clockInTime 
      ? format(attendance.clockInTime, 'HH:mm', { locale: ja }) 
      : '-';
    const clockOut = attendance.clockOutTime 
      ? format(attendance.clockOutTime, 'HH:mm', { locale: ja }) 
      : '-';
    const workingTime = attendance.workingMinutes > 0 
      ? `${Math.floor(attendance.workingMinutes / 60)}時間${attendance.workingMinutes % 60}分` 
      : '-';
    const status = attendance.status === 'ON_TIME' 
      ? '通常' 
      : attendance.status === 'LATE' 
        ? '遅刻' 
        : attendance.status === 'ABSENT' 
          ? '欠勤' 
          : attendance.status;
    const note = attendance.note;
    
    return `${date},${name},${clockIn},${clockOut},${workingTime},${status},${note}`;
  }).join('\n');
  
  // CSVデータの作成
  const csvContent = `data:text/csv;charset=utf-8,${header}${rows}`;
  const encodedUri = encodeURI(csvContent);
  
  // ダウンロードリンクの作成とクリック
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `勤怠記録_${format(from, 'yyyyMMdd')}-${format(to, 'yyyyMMdd')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// PDFへのエクスポート
export const exportToPDF = (attendanceData: AttendanceData[], from: Date, to: Date) => {
  // PDFドキュメントの作成（A4サイズ、縦向き）
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // タイトルとフィルター情報
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('勤怠記録', 14, 20);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text(`期間: ${format(from, 'yyyy/MM/dd', { locale: ja })} - ${format(to, 'yyyy/MM/dd', { locale: ja })}`, 14, 30);
  
  // テーブルヘッダー
  const tableColumn = ['日付', '名前', '出勤時間', '退勤時間', '勤務時間', '状態', '備考'];
  
  // テーブルデータ
  const tableRows = attendanceData.map(attendance => {
    const date = format(attendance.date, 'yyyy/MM/dd', { locale: ja });
    const name = attendance.userName;
    const clockIn = attendance.clockInTime 
      ? format(attendance.clockInTime, 'HH:mm', { locale: ja }) 
      : '-';
    const clockOut = attendance.clockOutTime 
      ? format(attendance.clockOutTime, 'HH:mm', { locale: ja }) 
      : '-';
    const workingTime = attendance.workingMinutes > 0 
      ? `${Math.floor(attendance.workingMinutes / 60)}時間${attendance.workingMinutes % 60}分` 
      : '-';
    const status = attendance.status === 'ON_TIME' 
      ? '通常' 
      : attendance.status === 'LATE' 
        ? '遅刻' 
        : attendance.status === 'ABSENT' 
          ? '欠勤' 
          : attendance.status;
    const note = attendance.note;
    
    return [date, name, clockIn, clockOut, workingTime, status, note];
  });
  
  interface ParsedCell {
    row: { index: number };
    column: { index: number };
    cell: {
      styles: {
        fillColor?: number[];
        textColor?: number[];
      }
    }
  }
  
  // テーブルの描画
  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 40,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [66, 66, 66] },
    columnStyles: { 
      0: { cellWidth: 22 }, // 日付
      1: { cellWidth: 30 }, // 名前
      2: { cellWidth: 20 }, // 出勤時間
      3: { cellWidth: 20 }, // 退勤時間
      4: { cellWidth: 25 }, // 勤務時間
      5: { cellWidth: 20 }, // 状態
      6: { cellWidth: 'auto' } // 備考
    },
    didParseCell: (data: ParsedCell) => {
      const row = data.row.index;
      const col = data.column.index;
      
      if (row >= 0 && col === 5) { // 状態列
        const status = tableRows[row][5];
        if (status === '遅刻') {
          data.cell.styles.fillColor = [255, 235, 200];
          data.cell.styles.textColor = [180, 100, 0];
        } else if (status === '欠勤') {
          data.cell.styles.fillColor = [255, 220, 220];
          data.cell.styles.textColor = [180, 0, 0];
        }
      }
    }
  });
  
  // 集計情報
  const totalWorkingMinutes = attendanceData.reduce((total, att) => total + att.workingMinutes, 0);
  const totalWorkingHours = Math.floor(totalWorkingMinutes / 60);
  const totalWorkingRemainingMinutes = totalWorkingMinutes % 60;
  
  const lateCount = attendanceData.filter(att => att.status === 'LATE').length;
  const absentCount = attendanceData.filter(att => att.status === 'ABSENT').length;
  
  const lastY = doc.lastAutoTable.finalY + 10;
  
  doc.setFont('helvetica', 'bold');
  doc.text('集計情報:', 14, lastY);
  doc.setFont('helvetica', 'normal');
  doc.text(`総勤務時間: ${totalWorkingHours}時間${totalWorkingRemainingMinutes}分`, 14, lastY + 8);
  doc.text(`遅刻件数: ${lateCount}件`, 14, lastY + 16);
  doc.text(`欠勤件数: ${absentCount}件`, 14, lastY + 24);
  
  // PDFの保存
  doc.save(`勤怠記録_${format(from, 'yyyyMMdd')}-${format(to, 'yyyyMMdd')}.pdf`);
}; 