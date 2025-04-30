'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { generateDummyShifts } from '@/lib/utils';
import AdminShiftCalendar from '@/components/shifts/AdminShiftCalendar';
import ShiftRequestsList from '@/components/shifts/ShiftRequestsList';
import AutoShiftGenerator from '@/components/shifts/AutoShiftGenerator';

export default function AdminShiftsPage() {
  const [activeTab, setActiveTab] = useState('calendar');
  // ダミーデータ（実際のアプリではAPIから取得）
  const [shifts, setShifts] = useState(() => generateDummyShifts(30));
  const [isPublished, setIsPublished] = useState(false);
  
  const handleShiftUpdate = (updatedShifts: any[]) => {
    setShifts(updatedShifts);
  };
  
  const handlePublishToggle = () => {
    setIsPublished(!isPublished);
    // TODO: APIを呼び出してシフトの公開状態を更新
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">シフト管理</h1>
        <div className="flex gap-2">
          <Button 
            variant={isPublished ? "default" : "outline"} 
            onClick={handlePublishToggle}
          >
            {isPublished ? "公開中" : "非公開"}
          </Button>
          <Button>確定</Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendar">シフトカレンダー</TabsTrigger>
          <TabsTrigger value="requests">希望一覧</TabsTrigger>
          <TabsTrigger value="auto">自動生成</TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>シフトカレンダー</CardTitle>
            </CardHeader>
            <CardContent>
              <AdminShiftCalendar 
                shifts={shifts} 
                onShiftUpdate={handleShiftUpdate} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="requests" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>シフト希望一覧</CardTitle>
            </CardHeader>
            <CardContent>
              <ShiftRequestsList onAddToShift={(request) => {
                // TODO: シフト希望をシフトに追加する処理
                console.log('Add to shift:', request);
              }} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="auto" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>自動シフト生成</CardTitle>
            </CardHeader>
            <CardContent>
              <AutoShiftGenerator onGenerate={(generatedShifts) => {
                setShifts(generatedShifts);
              }} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 