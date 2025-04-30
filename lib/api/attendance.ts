// 勤怠記録APIの呼び出しを行うヘルパー関数

// 現在の勤怠状況を取得
export async function getCurrentAttendance() {
  const response = await fetch('/api/attendance/current', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '勤怠状況の取得に失敗しました');
  }

  return response.json();
}

// 勤怠記録の一覧を取得
export async function getAttendanceList(filters?: {
  startDate?: string;
  endDate?: string;
  status?: string;
}) {
  let url = '/api/attendance';
  
  if (filters) {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.status) params.append('status', filters.status);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '勤怠記録の取得に失敗しました');
  }

  return response.json();
}

// 出勤打刻
export async function clockIn(shiftId: string, note?: string) {
  const response = await fetch('/api/attendance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'clockIn',
      shiftId,
      note,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '出勤打刻に失敗しました');
  }

  return response.json();
}

// 退勤打刻
export async function clockOut(shiftId: string, note?: string) {
  const response = await fetch('/api/attendance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'clockOut',
      shiftId,
      note,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '退勤打刻に失敗しました');
  }

  return response.json();
}

// 勤務時間を時間:分形式に変換する関数
export function formatWorkingTime(minutes: number): string {
  if (!minutes && minutes !== 0) return '--:--';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// 日付をフォーマットする関数
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
}

// 時刻をフォーマットする関数
export function formatTime(date: Date | string): string {
  const d = new Date(date);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

// 日本円表示にフォーマットする関数
export function formatJPY(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount);
} 