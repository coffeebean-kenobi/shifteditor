import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import ShiftDetailModal from './ShiftDetailModal';

// シフトデータの型定義
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

interface ShiftCalendarProps {
  shifts: ShiftEvent[];
  userId?: string;
}

export default function ShiftCalendar({ shifts = [], userId }: ShiftCalendarProps) {
  // 表示モード（月/週/日）の状態
  const [viewMode, setViewMode] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('dayGridMonth');
  
  // 個人/全体表示の切り替え状態
  const [showPersonalOnly, setShowPersonalOnly] = useState(false);
  
  // 選択したシフトの状態
  const [selectedShift, setSelectedShift] = useState<ShiftEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // カレンダーのリファレンス
  const calendarRef = React.useRef<any>(null);

  // シフトをフィルタリング（個人/全体）
  const filteredShifts = showPersonalOnly && userId
    ? shifts.filter(shift => shift.employeeId === userId)
    : shifts;

  // イベントクリック時の処理
  const handleEventClick = (info: any) => {
    const shift = shifts.find(s => s.id === info.event.id);
    if (shift) {
      setSelectedShift(shift);
      setIsModalOpen(true);
    }
  };
  
  // ビューモード変更時にカレンダーのビューを変更
  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(viewMode);
    }
  }, [viewMode]);

  // タブクリック時の処理
  const handleViewChange = (value: string) => {
    if (value === 'dayGridMonth' || value === 'timeGridWeek' || value === 'timeGridDay') {
      setViewMode(value);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Tabs value={viewMode} onValueChange={handleViewChange}>
          <TabsList>
            <TabsTrigger value="dayGridMonth">月</TabsTrigger>
            <TabsTrigger value="timeGridWeek">週</TabsTrigger>
            <TabsTrigger value="timeGridDay">日</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="personal-view" 
            checked={showPersonalOnly} 
            onCheckedChange={setShowPersonalOnly} 
          />
          <Label htmlFor="personal-view">個人シフトのみ表示</Label>
        </div>
      </div>

      <div className="bg-card p-4 rounded-lg shadow">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={viewMode}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: '',
          }}
          events={filteredShifts}
          eventClick={handleEventClick}
          height="auto"
          locale="ja"
        />
      </div>

      {selectedShift && (
        <ShiftDetailModal
          shift={selectedShift}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
} 