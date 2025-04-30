"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

type ShiftRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

interface ShiftRequest {
  id: string;
  startTime: string;
  endTime: string;
  status: ShiftRequestStatus;
  note?: string;
}

export default function ShiftRequestHistory() {
  const { toast } = useToast();
  const [shiftRequests, setShiftRequests] = useState<ShiftRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ShiftRequest | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // シフト希望履歴をフェッチする
  const fetchShiftRequests = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/shift-requests");
      
      if (!response.ok) {
        throw new Error("シフト希望の取得に失敗しました");
      }
      
      const data = await response.json();
      setShiftRequests(data);
    } catch (error) {
      console.error("Error fetching shift requests:", error);
      toast({
        title: "エラーが発生しました",
        description: "シフト希望の取得に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 初期ロード時にデータを取得
  useEffect(() => {
    fetchShiftRequests();
  }, []);

  // シフト希望をキャンセル（削除）する
  const handleDeleteRequest = async () => {
    if (!selectedRequest) return;
    
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/shift-requests/${selectedRequest.id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("シフト希望の削除に失敗しました");
      }
      
      toast({
        title: "シフト希望を削除しました",
        description: `${format(new Date(selectedRequest.startTime), "yyyy年MM月dd日")}のシフト希望を削除しました。`,
      });
      
      // リストを更新
      setShiftRequests(shiftRequests.filter(req => req.id !== selectedRequest.id));
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting shift request:", error);
      toast({
        title: "エラーが発生しました",
        description: "シフト希望の削除に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setSelectedRequest(null);
    }
  };

  // ステータス表示用の設定
  const getStatusBadgeClass = (status: ShiftRequestStatus) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getStatusText = (status: ShiftRequestStatus) => {
    switch (status) {
      case "APPROVED":
        return "承認済";
      case "REJECTED":
        return "却下";
      default:
        return "審査中";
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">読み込み中...</div>;
  }

  if (shiftRequests.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">シフト希望の履歴がありません</div>;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日付</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">時間</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">備考</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {shiftRequests.map((request) => {
              const startDate = new Date(request.startTime);
              const endDate = new Date(request.endTime);
              
              return (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {format(startDate, "yyyy年MM月dd日(EEE)", { locale: ja })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(request.status)}`}>
                      {getStatusText(request.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">
                    {request.note || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {request.status === "PENDING" && (
                      <Dialog open={isDeleteDialogOpen && selectedRequest?.id === request.id} onOpenChange={(open) => !open && setSelectedRequest(null)}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            キャンセル
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>シフト希望をキャンセルしますか？</DialogTitle>
                          </DialogHeader>
                          <div className="py-4">
                            <p>以下のシフト希望をキャンセルします：</p>
                            <p className="font-semibold mt-2">
                              {selectedRequest && (
                                <>
                                  {format(new Date(selectedRequest.startTime), "yyyy年MM月dd日(EEE)", { locale: ja })}
                                  <br />
                                  {format(new Date(selectedRequest.startTime), "HH:mm")} - {format(new Date(selectedRequest.endTime), "HH:mm")}
                                </>
                              )}
                            </p>
                          </div>
                          <div className="flex justify-end gap-3">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsDeleteDialogOpen(false);
                                setSelectedRequest(null);
                              }}
                            >
                              キャンセル
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={handleDeleteRequest}
                              disabled={isDeleting}
                            >
                              {isDeleting ? "処理中..." : "削除する"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
} 