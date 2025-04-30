import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";

/**
 * クラス名を結合するユーティリティ関数
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 日付をフォーマットするユーティリティ関数
 */
export function formatDate(date: Date | string, formatString: string = "yyyy/MM/dd HH:mm") {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, formatString, { locale: ja });
}

/**
 * シフトデータ用のダミーデータを生成するユーティリティ関数
 */
export function generateDummyShifts(count: number = 10) {
  const shifts = [];
  const positions = ["レジ", "品出し", "調理", "接客", "配送"];
  const employees = [
    { id: "1", name: "山田太郎" },
    { id: "2", name: "佐藤花子" },
    { id: "3", name: "鈴木一郎" },
    { id: "4", name: "高橋京子" },
  ];
  
  const colors = {
    "レジ": "#4caf50",
    "品出し": "#2196f3",
    "調理": "#f44336",
    "接客": "#ff9800",
    "配送": "#9c27b0"
  };

  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  for (let i = 0; i < count; i++) {
    const employee = employees[Math.floor(Math.random() * employees.length)];
    const position = positions[Math.floor(Math.random() * positions.length)];
    
    // ランダムな日付（当月内）
    const day = Math.floor(Math.random() * (endDate.getDate() - 1)) + 1;
    const start = new Date(today.getFullYear(), today.getMonth(), day, 
      9 + Math.floor(Math.random() * 8), // 9時〜17時の間でランダム
      0);
    
    // シフトは4〜8時間
    const durationHours = 4 + Math.floor(Math.random() * 4);
    const end = new Date(start);
    end.setHours(start.getHours() + durationHours);
    
    shifts.push({
      id: `shift-${i}`,
      title: `${position}`,
      start: start.toISOString(),
      end: end.toISOString(),
      employeeId: employee.id,
      employeeName: employee.name,
      position: position,
      color: colors[position as keyof typeof colors]
    });
  }
  
  return shifts;
} 