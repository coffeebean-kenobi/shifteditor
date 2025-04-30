'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Calendar as CalendarIcon, Search } from 'lucide-react';
import { AuditActionType } from '@/lib/audit-logger';

// 監査ログ型定義
interface AuditLog {
  id: string;
  actionType: string;
  userId: string;
  targetId: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// アクションタイプの日本語表記
const actionTypeLabels: Record<string, string> = {
  USER_LOGIN: 'ログイン',
  USER_LOGOUT: 'ログアウト',
  USER_CREATED: 'ユーザー作成',
  USER_UPDATED: 'ユーザー更新',
  USER_DELETED: 'ユーザー削除',
  SHIFT_CREATED: 'シフト作成',
  SHIFT_UPDATED: 'シフト更新',
  SHIFT_DELETED: 'シフト削除',
  SHIFT_APPROVED: 'シフト承認',
  SHIFT_REJECTED: 'シフト拒否',
  STAFF_INVITED: 'スタッフ招待',
  ROLE_CHANGED: '権限変更',
  SETTINGS_UPDATED: '設定更新',
  STORE_UPDATED: '店舗情報更新',
};

export default function AuditLogViewer() {
  const { data: session } = useSession();
  
  // 状態管理
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    limit: 10,
    offset: 0,
    hasMore: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // フィルター状態
  const [actionType, setActionType] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  // 監査ログを取得する関数
  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // URLパラメータの構築
      const params = new URLSearchParams();
      if (actionType) params.set('actionType', actionType);
      if (userId) params.set('userId', userId);
      if (startDate) params.set('startDate', startDate.toISOString());
      if (endDate) params.set('endDate', endDate.toISOString());
      params.set('limit', pagination.limit.toString());
      params.set('offset', pagination.offset.toString());
      
      // APIリクエスト
      const response = await fetch(`/api/admin/audit-log?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('監査ログの取得に失敗しました');
      }
      
      const data = await response.json();
      setLogs(data.data);
      setPagination(data.pagination);
    } catch (error) {
      setError(error instanceof Error ? error.message : '不明なエラーが発生しました');
      console.error('監査ログ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // コンポーネントマウント時とフィルター変更時にデータ取得
  useEffect(() => {
    if (session?.user) {
      fetchLogs();
    }
  }, [session, pagination.offset, pagination.limit]);
  
  // フィルターを適用する
  const applyFilters = () => {
    setPagination(prev => ({ ...prev, offset: 0 }));
    fetchLogs();
  };
  
  // フィルターをリセットする
  const resetFilters = () => {
    setActionType('');
    setUserId('');
    setStartDate(undefined);
    setEndDate(undefined);
    setPagination(prev => ({ ...prev, offset: 0 }));
    fetchLogs();
  };
  
  // 次のページに進む
  const nextPage = () => {
    if (pagination.hasMore) {
      setPagination(prev => ({ 
        ...prev, 
        offset: prev.offset + prev.limit 
      }));
    }
  };
  
  // 前のページに戻る
  const prevPage = () => {
    if (pagination.offset > 0) {
      setPagination(prev => ({ 
        ...prev, 
        offset: Math.max(0, prev.offset - prev.limit) 
      }));
    }
  };
  
  // 詳細情報を表示する関数
  const formatDetails = (details: string | null) => {
    if (!details) return '-';
    try {
      const parsed = JSON.parse(details);
      return Object.entries(parsed)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    } catch (e) {
      return details;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">監査ログ</h2>
      
      {/* フィルターセクション */}
      <div className="bg-background p-4 rounded-lg border space-y-4">
        <h3 className="text-md font-medium">フィルター</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* アクションタイプフィルター */}
          <div className="space-y-2">
            <label className="text-sm">アクションタイプ</label>
            <Select value={actionType} onValueChange={setActionType}>
              <SelectTrigger>
                <SelectValue placeholder="すべてのアクション" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">すべてのアクション</SelectItem>
                {Object.entries(actionTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* 開始日フィルター */}
          <div className="space-y-2">
            <label className="text-sm">開始日</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'PPP', { locale: ja }) : "開始日を選択"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* 終了日フィルター */}
          <div className="space-y-2">
            <label className="text-sm">終了日</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'PPP', { locale: ja }) : "終了日を選択"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* ボタン */}
          <div className="flex items-end space-x-2">
            <Button onClick={applyFilters} className="flex-1">
              <Search className="mr-2 h-4 w-4" />
              検索
            </Button>
            <Button variant="outline" onClick={resetFilters}>
              リセット
            </Button>
          </div>
        </div>
      </div>
      
      {/* エラー表示 */}
      {error && (
        <div className="bg-destructive/20 text-destructive p-3 rounded-md">
          {error}
        </div>
      )}
      
      {/* 監査ログテーブル */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>日時</TableHead>
              <TableHead>アクション</TableHead>
              <TableHead>ユーザー</TableHead>
              <TableHead>IPアドレス</TableHead>
              <TableHead>詳細</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6">
                  データを読み込み中...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6">
                  監査ログが見つかりません
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('ja-JP')}
                  </TableCell>
                  <TableCell>
                    {actionTypeLabels[log.actionType] || log.actionType}
                  </TableCell>
                  <TableCell>
                    {log.user?.name || '不明なユーザー'}
                  </TableCell>
                  <TableCell>{log.ipAddress || '-'}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {formatDetails(log.details)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* ページネーション */}
      {!loading && logs.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            全 {pagination.total} 件中 {pagination.offset + 1} - {Math.min(pagination.offset + logs.length, pagination.total)} 件表示
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={prevPage} 
                  className={pagination.offset === 0 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext 
                  onClick={nextPage} 
                  className={!pagination.hasMore ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
} 