import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

interface ShiftEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  employeeId?: string;
  employeeName?: string;
  position?: string;
  color?: string;
}

interface ShiftDetailModalProps {
  shift: ShiftEvent;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShiftDetailModal({ shift, isOpen, onClose }: ShiftDetailModalProps) {
  const startTime = new Date(shift.start);
  const endTime = new Date(shift.end);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>シフト詳細</DialogTitle>
          <DialogDescription>
            {shift.employeeName ? `${shift.employeeName}さんのシフト情報` : 'シフト情報'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-semibold">タイトル:</span>
            <span className="col-span-3">{shift.title}</span>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-semibold">開始:</span>
            <span className="col-span-3">{startTime.toLocaleString('ja-JP')}</span>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-semibold">終了:</span>
            <span className="col-span-3">{endTime.toLocaleString('ja-JP')}</span>
          </div>
          
          {shift.position && (
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-semibold">ポジション:</span>
              <span className="col-span-3">{shift.position}</span>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            閉じる
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 