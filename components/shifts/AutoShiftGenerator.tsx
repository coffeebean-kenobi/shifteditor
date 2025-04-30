'use client';

import React, { useState, useEffect } from 'react';
import { format, addDays, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ShiftEvent } from './AdminShiftCalendar';
import { 
  generateShifts, 
  BusinessHour, 
  Employee, 
  StaffRequirement,
  EmployeeAvailability
} from '@/lib/shift-generator';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';

interface AutoShiftGeneratorProps {
  onGenerate: (shifts: ShiftEvent[]) => void;
}

// シフト自動生成ライブラリのShiftEventを管理画面用に変換
function convertToAdminShiftEvent(shifts: any[]): ShiftEvent[] {
  return shifts.map(shift => ({
    ...shift,
    employeeName: shift.employeeName || 'Unknown',
    // その他必要な変換をここで行う
  }));
}

export default function AutoShiftGenerator({ onGenerate }: AutoShiftGeneratorProps) {
  const { toast } = useToast();
  
  // 選択した日程範囲
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date | undefined;
  }>({
    from: new Date(),
    to: addDays(new Date(), 6)
  });
  
  // 店舗の営業時間設定
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([
    { dayOfWeek: 0, openTime: "10:00", closeTime: "20:00" }, // 日曜日
    { dayOfWeek: 1, openTime: "10:00", closeTime: "22:00" }, // 月曜日
    { dayOfWeek: 2, openTime: "10:00", closeTime: "22:00" }, // 火曜日
    { dayOfWeek: 3, openTime: "10:00", closeTime: "22:00" }, // 水曜日
    { dayOfWeek: 4, openTime: "10:00", closeTime: "22:00" }, // 木曜日
    { dayOfWeek: 5, openTime: "10:00", closeTime: "23:00" }, // 金曜日
    { dayOfWeek: 6, openTime: "10:00", closeTime: "23:00" }  // 土曜日
  ]);
  
  // スタッフ要件設定
  const [staffRequirements, setStaffRequirements] = useState<StaffRequirement[]>([
    { dayOfWeek: 0, timeSlot: 'morning', count: 3, requiredPositions: { 'cashier': 1, 'floor': 1, 'kitchen': 1 } },
    { dayOfWeek: 0, timeSlot: 'afternoon', count: 4, requiredPositions: { 'cashier': 1, 'floor': 2, 'kitchen': 1 } },
    { dayOfWeek: 0, timeSlot: 'evening', count: 3, requiredPositions: { 'cashier': 1, 'floor': 1, 'kitchen': 1 } },
    { dayOfWeek: 1, timeSlot: 'morning', count: 2, requiredPositions: { 'cashier': 1, 'floor': 1 } },
    { dayOfWeek: 1, timeSlot: 'afternoon', count: 3, requiredPositions: { 'cashier': 1, 'floor': 1, 'kitchen': 1 } },
    { dayOfWeek: 1, timeSlot: 'evening', count: 3, requiredPositions: { 'cashier': 1, 'floor': 1, 'kitchen': 1 } },
    { dayOfWeek: 2, timeSlot: 'morning', count: 2, requiredPositions: { 'cashier': 1, 'floor': 1 } },
    { dayOfWeek: 2, timeSlot: 'afternoon', count: 3, requiredPositions: { 'cashier': 1, 'floor': 1, 'kitchen': 1 } },
    { dayOfWeek: 2, timeSlot: 'evening', count: 3, requiredPositions: { 'cashier': 1, 'floor': 1, 'kitchen': 1 } },
    { dayOfWeek: 3, timeSlot: 'morning', count: 2, requiredPositions: { 'cashier': 1, 'floor': 1 } },
    { dayOfWeek: 3, timeSlot: 'afternoon', count: 3, requiredPositions: { 'cashier': 1, 'floor': 1, 'kitchen': 1 } },
    { dayOfWeek: 3, timeSlot: 'evening', count: 3, requiredPositions: { 'cashier': 1, 'floor': 1, 'kitchen': 1 } },
    { dayOfWeek: 4, timeSlot: 'morning', count: 2, requiredPositions: { 'cashier': 1, 'floor': 1 } },
    { dayOfWeek: 4, timeSlot: 'afternoon', count: 3, requiredPositions: { 'cashier': 1, 'floor': 1, 'kitchen': 1 } },
    { dayOfWeek: 4, timeSlot: 'evening', count: 3, requiredPositions: { 'cashier': 1, 'floor': 1, 'kitchen': 1 } },
    { dayOfWeek: 5, timeSlot: 'morning', count: 2, requiredPositions: { 'cashier': 1, 'floor': 1 } },
    { dayOfWeek: 5, timeSlot: 'afternoon', count: 3, requiredPositions: { 'cashier': 1, 'floor': 1, 'kitchen': 1 } },
    { dayOfWeek: 5, timeSlot: 'evening', count: 4, requiredPositions: { 'cashier': 1, 'floor': 2, 'kitchen': 1 } },
    { dayOfWeek: 6, timeSlot: 'morning', count: 3, requiredPositions: { 'cashier': 1, 'floor': 1, 'kitchen': 1 } },
    { dayOfWeek: 6, timeSlot: 'afternoon', count: 4, requiredPositions: { 'cashier': 1, 'floor': 2, 'kitchen': 1 } },
    { dayOfWeek: 6, timeSlot: 'evening', count: 4, requiredPositions: { 'cashier': 1, 'floor': 2, 'kitchen': 1 } },
  ]);
  
  // 従業員データ（実際のアプリではAPIから取得）
  const [employees, setEmployees] = useState<Employee[]>([
    { 
      id: "emp1", 
      name: "山田太郎", 
      maxHoursPerWeek: 40, 
      position: ["cashier", "floor"],
      minHoursPerWeek: 30,
      preferredDays: [1, 3, 5] // 月・水・金曜日を希望
    },
    { 
      id: "emp2", 
      name: "佐藤花子", 
      maxHoursPerWeek: 30, 
      position: ["floor", "kitchen"],
      preferredDays: [2, 4, 6] // 火・木・土曜日を希望
    },
    { 
      id: "emp3", 
      name: "鈴木一郎", 
      maxHoursPerWeek: 20, 
      position: ["cashier", "manager"],
      preferredDays: [0, 6] // 日・土曜日を希望
    },
    { 
      id: "emp4", 
      name: "田中誠", 
      maxHoursPerWeek: 40, 
      position: ["kitchen", "manager"],
      minHoursPerWeek: 35
    },
    { 
      id: "emp5", 
      name: "高橋裕子", 
      maxHoursPerWeek: 25, 
      position: ["cashier", "floor"],
      preferredDays: [0, 5, 6] // 日・金・土曜日を希望
    }
  ]);
  
  // シフト希望データ
  const [employeeAvailability, setEmployeeAvailability] = useState<EmployeeAvailability[]>([]);
  
  // 自動生成の設定
  const [maxConsecutiveDays, setMaxConsecutiveDays] = useState(5);
  const [minRestHours, setMinRestHours] = useState(10);
  const [prioritizeEvenDistribution, setPrioritizeEvenDistribution] = useState(true);
  const [respectPositionSkills, setRespectPositionSkills] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // 選択された設定タブ
  const [activeTab, setActiveTab] = useState('basic');
  
  // シフト希望データをランダムに生成（実際はデータベースから取得するはず）
  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      const randomAvailability: EmployeeAvailability[] = [];
      
      // 各従業員の希望をランダム生成
      employees.forEach(employee => {
        // 従業員ごとに3-5日のシフト希望を作成
        const daysToGenerate = Math.floor(Math.random() * 3) + 3;
        const availableDates = [];
        
        // 希望する曜日がある場合はその日を優先
        if (employee.preferredDays && employee.preferredDays.length > 0) {
          const startDay = new Date(dateRange.from);
          const endDay = new Date(dateRange.to || startDay);
          
          for (let day = new Date(startDay); day <= endDay; day.setDate(day.getDate() + 1)) {
            if (employee.preferredDays.includes(day.getDay())) {
              availableDates.push(new Date(day));
            }
          }
        }
        
        // 足りない分はランダムに追加
        while (availableDates.length < daysToGenerate) {
          const randomDayOffset = Math.floor(Math.random() * 7);
          const randomDate = addDays(dateRange.from, randomDayOffset);
          
          // 重複チェック
          if (!availableDates.some(d => 
            d.getDate() === randomDate.getDate() && 
            d.getMonth() === randomDate.getMonth()
          )) {
            availableDates.push(randomDate);
          }
        }
        
        // 各日付で利用可能時間を設定
        availableDates.forEach(date => {
          // ランダムに時間帯を選択（朝、昼、夜のいずれか）
          const timeSlots = ['morning', 'afternoon', 'evening'];
          const selectedSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
          
          // 時間帯に基づいて開始・終了時間を設定
          let startHour, endHour;
          if (selectedSlot === 'morning') {
            startHour = 9;
            endHour = 14;
          } else if (selectedSlot === 'afternoon') {
            startHour = 13;
            endHour = 18;
          } else {
            startHour = 17;
            endHour = 22;
          }
          
          // シフト希望を追加
          const startTime = new Date(date);
          startTime.setHours(startHour, 0, 0, 0);
          
          const endTime = new Date(date);
          endTime.setHours(endHour, 0, 0, 0);
          
          randomAvailability.push({
            employeeId: employee.id,
            date: date,
            startTime: startTime,
            endTime: endTime,
            priority: Math.floor(Math.random() * 5) + 1 // 1-5の優先度
          });
        });
      });
      
      setEmployeeAvailability(randomAvailability);
    }
  }, [dateRange, employees]);
  
  // 必要な従業員数の設定を更新
  const handleRequirementChange = (
    dayOfWeek: number, 
    timeSlot: 'morning' | 'afternoon' | 'evening',
    field: 'count' | 'cashier' | 'floor' | 'kitchen' | 'manager',
    value: number
  ) => {
    setStaffRequirements(prev => {
      return prev.map(req => {
        if (req.dayOfWeek === dayOfWeek && req.timeSlot === timeSlot) {
          if (field === 'count') {
            return { ...req, count: value };
          } else {
            // ポジション別の人数更新
            const requiredPositions = { ...(req.requiredPositions || {}) };
            requiredPositions[field] = value;
            return { ...req, requiredPositions };
          }
        }
        return req;
      });
    });
  };
  
  // シフトを自動生成
  const handleGenerateShifts = async () => {
    if (!dateRange.from || !dateRange.to) {
      toast({
        title: "日付範囲が未設定です",
        description: "シフト生成する日付範囲を選択してください。",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // サーバーでの生成を試行（バックグラウンド処理として）
      const response = await fetch('/api/admin/shifts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: dateRange.from.toISOString(),
          endDate: dateRange.to.toISOString(),
          businessHours,
          employees,
          staffRequirements,
          employeeAvailability,
          maxConsecutiveDays,
          minRestHours,
          prioritizeEvenDistribution,
          respectPositionSkills
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // サーバーから返されたシフトを適用
        const parsedShifts = convertToAdminShiftEvent(data.shifts);
        
        onGenerate(parsedShifts);
        
        toast({
          title: "シフト生成完了",
          description: `${parsedShifts.length}件のシフトを生成しました。`,
        });
      } else {
        // APIが失敗した場合はフロントエンドで生成
        console.warn('サーバーでのシフト生成に失敗しました。フロントエンドで処理します。');
        const generatedShifts = generateShifts({
          startDate: dateRange.from,
          endDate: dateRange.to,
          businessHours,
          employees,
          staffRequirements,
          employeeAvailability,
          maxConsecutiveDays,
          minRestHours,
          prioritizeEvenDistribution,
          respectPositionSkills
        });
        
        onGenerate(convertToAdminShiftEvent(generatedShifts));
        
        toast({
          title: "シフト生成完了",
          description: `${generatedShifts.length}件のシフトを生成しました。（ローカル処理）`,
        });
      }
    } catch (error) {
      console.error('シフト生成エラー:', error);
      
      // エラーが発生した場合もフロントエンドで生成
      const generatedShifts = generateShifts({
        startDate: dateRange.from,
        endDate: dateRange.to,
        businessHours,
        employees,
        staffRequirements,
        employeeAvailability,
        maxConsecutiveDays,
        minRestHours,
        prioritizeEvenDistribution,
        respectPositionSkills
      });
      
      onGenerate(convertToAdminShiftEvent(generatedShifts));
      
      toast({
        title: "警告",
        description: "APIエラーが発生しましたが、ローカルでシフトを生成しました。",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">日付範囲選択</h3>
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={(range) => setDateRange(range as any)}
              className="rounded-md border"
              disabled={{ before: new Date() }}
            />
            
            <div className="text-sm text-muted-foreground mt-2">
              {dateRange.from && (
                <>
                  <span>
                    {format(dateRange.from, 'yyyy年M月d日', { locale: ja })}
                  </span>
                  {dateRange.to && (
                    <>
                      <span> 〜 </span>
                      <span>
                        {format(dateRange.to, 'yyyy年M月d日', { locale: ja })}
                      </span>
                    </>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">生成設定</h3>
            
            <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">基本設定</TabsTrigger>
                <TabsTrigger value="advanced">詳細設定</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="maxConsecutiveDays">最大連続勤務日数</Label>
                      <Input
                        id="maxConsecutiveDays"
                        type="number"
                        min="1"
                        max="7"
                        value={maxConsecutiveDays}
                        onChange={(e) => setMaxConsecutiveDays(parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="minRestHours">最小休息時間（時間）</Label>
                      <Input
                        id="minRestHours"
                        type="number"
                        min="8"
                        max="24"
                        value={minRestHours}
                        onChange={(e) => setMinRestHours(parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="prioritizeEven"
                      checked={prioritizeEvenDistribution}
                      onCheckedChange={setPrioritizeEvenDistribution}
                    />
                    <Label htmlFor="prioritizeEven">シフトの公平な分配を優先</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="respectSkills"
                      checked={respectPositionSkills}
                      onCheckedChange={setRespectPositionSkills}
                    />
                    <Label htmlFor="respectSkills">ポジションのスキルを尊重</Label>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="advanced" className="mt-4">
                <div className="h-[260px] overflow-y-auto pr-2">
                  <h4 className="font-medium mb-2">曜日・時間帯別の必要人数</h4>
                  
                  {/* 曜日ごとの設定 */}
                  {Array.from({ length: 7 }).map((_, dayIndex) => {
                    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
                    return (
                      <details key={dayIndex} className="mb-2">
                        <summary className="cursor-pointer font-medium">{dayNames[dayIndex]}曜日</summary>
                        <div className="ml-4 mt-2 space-y-3">
                          {['morning', 'afternoon', 'evening'].map((timeSlot) => {
                            const slotNames = { morning: '午前', afternoon: '午後', evening: '夜間' };
                            const requirement = staffRequirements.find(
                              r => r.dayOfWeek === dayIndex && r.timeSlot === timeSlot
                            );
                            
                            return (
                              <div key={`${dayIndex}-${timeSlot}`} className="grid grid-cols-4 gap-2 items-center">
                                <span className="text-sm">{slotNames[timeSlot as keyof typeof slotNames]}</span>
                                
                                <div>
                                  <Label className="text-xs">合計</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={requirement?.count || 0}
                                    onChange={(e) => handleRequirementChange(
                                      dayIndex, 
                                      timeSlot as any, 
                                      'count', 
                                      parseInt(e.target.value)
                                    )}
                                    className="h-7"
                                  />
                                </div>
                                
                                <div>
                                  <Label className="text-xs">レジ</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={requirement?.requiredPositions?.cashier || 0}
                                    onChange={(e) => handleRequirementChange(
                                      dayIndex, 
                                      timeSlot as any, 
                                      'cashier', 
                                      parseInt(e.target.value)
                                    )}
                                    className="h-7"
                                  />
                                </div>
                                
                                <div>
                                  <Label className="text-xs">フロア</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={requirement?.requiredPositions?.floor || 0}
                                    onChange={(e) => handleRequirementChange(
                                      dayIndex, 
                                      timeSlot as any, 
                                      'floor', 
                                      parseInt(e.target.value)
                                    )}
                                    className="h-7"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </details>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="mt-8">
              <Button 
                onClick={handleGenerateShifts} 
                className="w-full"
                disabled={isGenerating}
              >
                {isGenerating ? 'シフト生成中...' : 'シフトを自動生成'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* シフト希望の表示 */}
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-2">シフト希望データ</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">スタッフ</th>
                <th className="text-left py-2 px-3">日付</th>
                <th className="text-left py-2 px-3">時間帯</th>
                <th className="text-center py-2 px-3">優先度</th>
              </tr>
            </thead>
            <tbody>
              {employeeAvailability.map((avail, index) => {
                const employee = employees.find(e => e.id === avail.employeeId);
                const date = new Date(avail.date);
                const startTime = new Date(avail.startTime);
                const endTime = new Date(avail.endTime);
                
                return (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3">{employee?.name || 'Unknown'}</td>
                    <td className="py-2 px-3">{format(date, 'M/d (E)', { locale: ja })}</td>
                    <td className="py-2 px-3">
                      {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`inline-block w-6 h-6 rounded-full text-white text-center leading-6
                        ${avail.priority === 5 ? 'bg-red-500' : 
                          avail.priority === 4 ? 'bg-orange-500' : 
                          avail.priority === 3 ? 'bg-yellow-500' : 
                          avail.priority === 2 ? 'bg-green-500' : 'bg-blue-500'}`}>
                        {avail.priority}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-2">登録済み従業員 ({employees.length}名)</h3>
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {employees.map(employee => (
            <Card key={employee.id}>
              <CardContent className="p-4">
                <div className="font-medium">{employee.name}</div>
                <div className="text-sm text-muted-foreground">
                  勤務時間: {employee.minHoursPerWeek || 0}〜{employee.maxHoursPerWeek}時間/週
                </div>
                <div className="text-sm text-muted-foreground">
                  担当: {employee.position.map(p => 
                    p === 'cashier' ? 'レジ' : 
                    p === 'floor' ? 'フロア' : 
                    p === 'kitchen' ? 'キッチン' : 
                    p === 'manager' ? 'マネージャー' : p
                  ).join(', ')}
                </div>
                {employee.preferredDays && (
                  <div className="text-sm text-muted-foreground">
                    希望曜日: {employee.preferredDays.map(d => 
                      ['日', '月', '火', '水', '木', '金', '土'][d]
                    ).join(', ')}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 