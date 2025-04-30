'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

// シフト希望の型定義
export interface ShiftRequest {
  id: string;
  userId: string;
  userName: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  note?: string;
}

interface ShiftRequestsListProps {
  onAddToShift: (request: ShiftRequest) => void;
}

export default function ShiftRequestsList({ onAddToShift }: ShiftRequestsListProps) {
  // ダミーデータ（実際のアプリではAPIから取得）
  const [requests, setRequests] = useState<ShiftRequest[]>(() => {
    const today = new Date();
    
    // 次の7日間のダミーシフト希望を生成
    return Array.from({ length: 10 }).map((_, index) => {
      const day = new Date(today);
      day.setDate(day.getDate() + Math.floor(index / 3));
      
      const startHour = 10 + (index % 3) * 3;
      const startTime = new Date(day);
      startTime.setHours(startHour, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + 4);
      
      return {
        id: `req-${index}`,
        userId: `user-${index % 3 + 1}`,
        userName: ['山田太郎', '佐藤花子', '鈴木一郎'][index % 3],
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        status: 'PENDING' as const,
        note: index % 2 === 0 ? '特になし' : '早めに帰りたいです'
      };
    });
  });
  
  // ステータスでフィルタリング
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const filteredRequests = statusFilter === 'ALL'
    ? requests
    : requests.filter(req => req.status === statusFilter);
  
  // シフト希望を承認
  const handleApprove = (requestId: string) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: 'APPROVED' as const } : req
    ));
    
    // 承認されたリクエストをシフトに追加
    const approvedRequest = requests.find(req => req.id === requestId);
    if (approvedRequest) {
      onAddToShift(approvedRequest);
    }
  };
  
  // シフト希望を拒否
  const handleReject = (requestId: string) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: 'REJECTED' as const } : req
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2 mb-4">
        <Button 
          variant={statusFilter === 'ALL' ? 'default' : 'outline'} 
          onClick={() => setStatusFilter('ALL')}
        >
          すべて
        </Button>
        <Button 
          variant={statusFilter === 'PENDING' ? 'default' : 'outline'} 
          onClick={() => setStatusFilter('PENDING')}
        >
          未対応
        </Button>
        <Button 
          variant={statusFilter === 'APPROVED' ? 'default' : 'outline'} 
          onClick={() => setStatusFilter('APPROVED')}
        >
          承認済み
        </Button>
        <Button 
          variant={statusFilter === 'REJECTED' ? 'default' : 'outline'} 
          onClick={() => setStatusFilter('REJECTED')}
        >
          拒否
        </Button>
      </div>
      
      {filteredRequests.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          表示するシフト希望がありません
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center">
                  <div className={`w-2 h-full self-stretch ${
                    request.status === 'APPROVED' ? 'bg-green-500' : 
                    request.status === 'REJECTED' ? 'bg-red-500' : 
                    'bg-yellow-500'
                  }`} />
                  
                  <div className="flex-1 p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{request.userName}</h3>
                      <div className="text-sm text-muted-foreground">
                        ID: {request.userId}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-2">
                      <div>
                        <p className="text-sm text-muted-foreground">開始時間</p>
                        <p>{format(new Date(request.startTime), 'M月d日(E) HH:mm', { locale: ja })}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">終了時間</p>
                        <p>{format(new Date(request.endTime), 'M月d日(E) HH:mm', { locale: ja })}</p>
                      </div>
                    </div>
                    
                    {request.note && (
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground">備考</p>
                        <p className="text-sm">{request.note}</p>
                      </div>
                    )}
                    
                    {request.status === 'PENDING' && (
                      <div className="flex space-x-2 mt-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleApprove(request.id)}
                        >
                          承認
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleReject(request.id)}
                        >
                          拒否
                        </Button>
                      </div>
                    )}
                    
                    {request.status === 'APPROVED' && (
                      <div className="flex space-x-2 mt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleReject(request.id)}
                        >
                          承認取消
                        </Button>
                      </div>
                    )}
                    
                    {request.status === 'REJECTED' && (
                      <div className="flex space-x-2 mt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleApprove(request.id)}
                        >
                          承認に変更
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 