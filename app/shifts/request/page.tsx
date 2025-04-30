"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ShiftRequestForm from "./components/ShiftRequestForm";
import ShiftRequestHistory from "./components/ShiftRequestHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ShiftRequestPage() {
  const router = useRouter();
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">シフト希望提出</h1>
      
      <Tabs defaultValue="new-request" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="new-request">新規希望提出</TabsTrigger>
          <TabsTrigger value="history">提出履歴</TabsTrigger>
        </TabsList>
        
        <TabsContent value="new-request">
          <Card>
            <CardHeader>
              <CardTitle>シフト希望を提出する</CardTitle>
              <CardDescription>
                勤務可能な日時と希望優先度を選択してください。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ShiftRequestForm />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>シフト希望履歴</CardTitle>
              <CardDescription>
                過去に提出したシフト希望の一覧です。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ShiftRequestHistory />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 