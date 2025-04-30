'use client';

import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface ShiftEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  employeeId: string;
  employeeName: string;
  position?: string;
  color?: string;
}

interface AdminShiftCalendarProps {
  shifts: ShiftEvent[];
  onShiftUpdate: (shifts: ShiftEvent[]) => void;
}

export default function AdminShiftCalendar({ shifts, onShiftUpdate }: AdminShiftCalendarProps) {
  const [selectedShift, setSelectedShift] = useState<ShiftEvent | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'dayGridMonth' | 'timeGridWeek'>('timeGridWeek');
  
  // シフト編集用の一時データ
  const [editShift, setEditShift] = useState<ShiftEvent | null>(null);
  
  // シフトクリック時の処理
  const handleEventClick = (info: any) => {
    const shift = shifts.find(s => s.id === info.event.id);
    if (shift) {
      setSelectedShift(shift);
      setEditShift(shift);
      setIsEditModalOpen(true);
    }
  };
  
  // シフトドラッグ時の処理
  const handleEventDrop = (info: any) => {
    const updatedShifts = shifts.map(shift => {
      if (shift.id === info.event.id) {
        return {
          ...shift,
          start: info.event.start.toISOString(),
          end: info.event.end.toISOString()
        };
      }
      return shift;
    });
    onShiftUpdate(updatedShifts);
  };
  
  // シフトのリサイズ時の処理
  const handleEventResize = (info: any) => {
    const updatedShifts = shifts.map(shift => {
      if (shift.id === info.event.id) {
        return {
          ...shift,
          start: info.event.start.toISOString(),
          end: info.event.end.toISOString()
        };
      }
      return shift;
    });
    onShiftUpdate(updatedShifts);
  };
  
  // シフト編集を保存
  const handleSaveShift = () => {
    if (!editShift) return;
    
    const updatedShifts = shifts.map(shift => 
      shift.id === editShift.id ? editShift : shift
    );
    
    onShiftUpdate(updatedShifts);
    setIsEditModalOpen(false);
    setSelectedShift(null);
    setEditShift(null);
  };
  
  // シフト削除
  const handleDeleteShift = () => {
    if (!selectedShift) return;
    
    const updatedShifts = shifts.filter(shift => shift.id !== selectedShift.id);
    onShiftUpdate(updatedShifts);
    setIsEditModalOpen(false);
    setSelectedShift(null);
    setEditShift(null);
  };
  
  // 新規シフト追加（日付クリック時）
  const handleDateClick = (info: any) => {
    // ダミーの従業員データ
    const dummyEmployees = [
      { id: 'emp1', name: '山田太郎' },
      { id: 'emp2', name: '佐藤花子' },
      { id: 'emp3', name: '鈴木一郎' }
    ];
    
    const employee = dummyEmployees[0];
    
    // クリックした時間から1時間のシフトを作成
    const startDate = info.date;
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1);
    
    const newShift: ShiftEvent = {
      id: `shift-${Date.now()}`,
      title: `${employee.name}`,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      employeeId: employee.id,
      employeeName: employee.name,
      color: '#2563eb'
    };
    
    setSelectedShift(newShift);
    setEditShift(newShift);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <Button 
            variant={viewMode === 'timeGridWeek' ? 'default' : 'outline'} 
            onClick={() => setViewMode('timeGridWeek')}
            className="mr-2"
          >
            週表示
          </Button>
          <Button 
            variant={viewMode === 'dayGridMonth' ? 'default' : 'outline'} 
            onClick={() => setViewMode('dayGridMonth')}
          >
            月表示
          </Button>
        </div>
        
        <Button 
          onClick={() => {
            // 繰り返しパターン設定ダイアログを表示（実装予定）
            alert('繰り返しパターン設定機能は実装中です');
          }}
        >
          繰り返しパターン設定
        </Button>
      </div>

      <div className="bg-card rounded-lg shadow p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={viewMode}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: '',
          }}
          events={shifts}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          dateClick={handleDateClick}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          height="auto"
          locale="ja"
          allDaySlot={false}
          slotMinTime="08:00:00"
          slotMaxTime="22:00:00"
        />
      </div>
      
      {/* シフト編集モーダル */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedShift && selectedShift.id.startsWith('shift-') ? 'シフト追加' : 'シフト編集'}
            </DialogTitle>
          </DialogHeader>
          
          {editShift && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="employee" className="text-right">従業員</Label>
                <Select 
                  value={editShift.employeeId} 
                  onValueChange={(value) => {
                    // ダミーの従業員データから名前を取得
                    const employees = [
                      { id: 'emp1', name: '山田太郎' },
                      { id: 'emp2', name: '佐藤花子' },
                      { id: 'emp3', name: '鈴木一郎' }
                    ];
                    const employee = employees.find(e => e.id === value);
                    
                    setEditShift({
                      ...editShift,
                      employeeId: value,
                      employeeName: employee?.name || '',
                      title: employee?.name || ''
                    });
                  }}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="従業員を選択"/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emp1">山田太郎</SelectItem>
                    <SelectItem value="emp2">佐藤花子</SelectItem>
                    <SelectItem value="emp3">鈴木一郎</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="start-time" className="text-right">開始時間</Label>
                <Input
                  id="start-time"
                  type="datetime-local"
                  value={editShift.start.substring(0, 16)}
                  onChange={(e) => setEditShift({
                    ...editShift,
                    start: new Date(e.target.value).toISOString()
                  })}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="end-time" className="text-right">終了時間</Label>
                <Input
                  id="end-time"
                  type="datetime-local"
                  value={editShift.end.substring(0, 16)}
                  onChange={(e) => setEditShift({
                    ...editShift,
                    end: new Date(e.target.value).toISOString()
                  })}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="position" className="text-right">役割</Label>
                <Select 
                  value={editShift.position || ''} 
                  onValueChange={(value) => setEditShift({
                    ...editShift,
                    position: value
                  })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="役割を選択"/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashier">レジ</SelectItem>
                    <SelectItem value="floor">フロア</SelectItem>
                    <SelectItem value="kitchen">キッチン</SelectItem>
                    <SelectItem value="manager">マネージャー</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex justify-between">
            {selectedShift && !selectedShift.id.startsWith('shift-') && (
              <Button variant="destructive" onClick={handleDeleteShift}>
                削除
              </Button>
            )}
            <div>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="mr-2">
                キャンセル
              </Button>
              <Button onClick={handleSaveShift}>
                保存
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 