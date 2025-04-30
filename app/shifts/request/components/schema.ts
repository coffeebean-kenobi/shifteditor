import { z } from "zod";

export const shiftRequestSchema = z.object({
  date: z.date({
    required_error: "日付を選択してください",
  }),
  startTime: z.string({
    required_error: "開始時間を選択してください",
  }),
  endTime: z.string({
    required_error: "終了時間を選択してください",
  }),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"], {
    required_error: "優先度を選択してください",
  }),
  note: z.string().optional(),
});

export type ShiftRequestFormValues = z.infer<typeof shiftRequestSchema>; 