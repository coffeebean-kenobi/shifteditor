"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { shiftRequestSchema, type ShiftRequestFormValues } from "./schema";
import { DatePicker } from "./DatePicker";
import { TimeSelector } from "./TimeSelector";
import { PrioritySelector } from "./PrioritySelector";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

export default function ShiftRequestForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ShiftRequestFormValues>({
    resolver: zodResolver(shiftRequestSchema),
    defaultValues: {
      priority: "MEDIUM" as const,
      note: "",
    },
  });
  
  const selectedDate = watch("date");
  const selectedStartTime = watch("startTime");
  const selectedEndTime = watch("endTime");
  const selectedPriority = watch("priority");
  const selectedNote = watch("note");
  
  const onSubmit = async (data: ShiftRequestFormValues) => {
    try {
      setIsSubmitting(true);
      
      // 選択された日付と時間から日時情報を作成
      const parseTime = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return { hours, minutes };
      };
      
      const { hours: startHours, minutes: startMinutes } = parseTime(data.startTime);
      const { hours: endHours, minutes: endMinutes } = parseTime(data.endTime);
      
      const startDateTime = new Date(data.date);
      startDateTime.setHours(startHours, startMinutes, 0, 0);
      
      const endDateTime = new Date(data.date);
      endDateTime.setHours(endHours, endMinutes, 0, 0);
      
      // startTimeがendTimeより後の場合はエラー
      if (startDateTime >= endDateTime) {
        toast({
          title: "エラー",
          description: "終了時間は開始時間より後に設定してください。",
          variant: "destructive",
        });
        return;
      }
      
      // APIエンドポイントにデータを送信
      const response = await fetch("/api/shift-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          note: data.note,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "シフト希望の送信に失敗しました");
      }
      
      // 送信成功
      toast({
        title: "シフト希望を送信しました",
        description: `${format(data.date, 'yyyy年MM月dd日')} ${data.startTime}～${data.endTime}のシフト希望を送信しました。`,
      });
      
      // フォームをリセット
      reset();
    } catch (error) {
      console.error("Error submitting shift request:", error);
      
      toast({
        title: "エラーが発生しました",
        description: error instanceof Error ? error.message : "シフト希望の送信に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4">
        <div>
          <Label>勤務希望日</Label>
          <DatePicker
            date={selectedDate}
            onSelect={(date) => date && setValue("date", date, { shouldValidate: true })}
          />
          {errors.date && (
            <p className="text-sm text-red-500 mt-1">{errors.date.message}</p>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <TimeSelector
            label="開始時間"
            value={selectedStartTime || ""}
            onChange={(time) => setValue("startTime", time, { shouldValidate: true })}
          />
          
          <TimeSelector
            label="終了時間"
            value={selectedEndTime || ""}
            onChange={(time) => setValue("endTime", time, { shouldValidate: true })}
          />
        </div>
        
        {(errors.startTime || errors.endTime) && (
          <p className="text-sm text-red-500">
            {errors.startTime?.message || errors.endTime?.message}
          </p>
        )}
        
        <PrioritySelector
          value={selectedPriority || "MEDIUM"}
          onChange={(priority) => setValue("priority", priority, { shouldValidate: true })}
        />
        
        <div className="grid gap-2">
          <Label htmlFor="note">備考・メモ（オプション）</Label>
          <Textarea
            id="note"
            placeholder="備考や特記事項があれば入力してください"
            value={selectedNote || ""}
            onChange={(e) => setValue("note", e.target.value)}
            rows={3}
          />
        </div>
      </div>
      
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "送信中..." : "シフト希望を提出する"}
      </Button>
    </form>
  );
} 