import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { generateShifts, ShiftGenerationConfig } from '@/lib/shift-generator';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// 入力バリデーションスキーマ
const shiftGenerationSchema = z.object({
  startDate: z.string().refine(value => !isNaN(Date.parse(value)), {
    message: "開始日が無効な日付形式です"
  }),
  endDate: z.string().refine(value => !isNaN(Date.parse(value)), {
    message: "終了日が無効な日付形式です"
  }),
  businessHours: z.array(
    z.object({
      dayOfWeek: z.number().min(0).max(6),
      openTime: z.string().regex(/^\d{1,2}:\d{2}$/),
      closeTime: z.string().regex(/^\d{1,2}:\d{2}$/)
    })
  ),
  employees: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      maxHoursPerWeek: z.number().positive(),
      position: z.array(z.string()),
      minHoursPerWeek: z.number().positive().optional(),
      preferredDays: z.array(z.number().min(0).max(6)).optional(),
      skills: z.array(z.string()).optional(),
      hourlyRate: z.number().positive().optional(),
      availability: z.array(
        z.object({
          employeeId: z.string(),
          date: z.union([z.string(), z.date()]),
          startTime: z.union([z.string(), z.date()]),
          endTime: z.union([z.string(), z.date()]),
          priority: z.number().min(1).max(5),
          note: z.string().optional()
        })
      ).optional()
    })
  ),
  staffRequirements: z.array(
    z.object({
      dayOfWeek: z.number().min(0).max(6),
      timeSlot: z.enum(['morning', 'afternoon', 'evening']),
      count: z.number().nonnegative(),
      requiredPositions: z.record(z.string(), z.number().nonnegative()).optional()
    })
  ),
  employeeAvailability: z.array(
    z.object({
      employeeId: z.string(),
      date: z.union([z.string(), z.date()]),
      startTime: z.union([z.string(), z.date()]),
      endTime: z.union([z.string(), z.date()]),
      priority: z.number().min(1).max(5),
      note: z.string().optional()
    })
  ).optional(),
  maxConsecutiveDays: z.number().positive().optional(),
  minRestHours: z.number().positive().optional(),
  prioritizeEvenDistribution: z.boolean().optional(),
  respectPositionSkills: z.boolean().optional()
});

// APIリクエストのタイプ
type ShiftGenerationRequest = z.infer<typeof shiftGenerationSchema>;

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }
    
    // リクエストボディを取得
    const body = await request.json();
    
    // バリデーション
    const validationResult = shiftGenerationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "入力データが無効です", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const requestData = validationResult.data as ShiftGenerationRequest;
    
    // 日付文字列をDateオブジェクトに変換
    const parsedConfig: ShiftGenerationConfig = {
      ...requestData,
      startDate: new Date(requestData.startDate),
      endDate: new Date(requestData.endDate)
    };
    
    // シフトを生成
    const shifts = generateShifts(parsedConfig);
    
    // ユーザーデータの取得（オプション）
    // ここで従業員IDと実際のユーザーIDを紐付けることも可能
    // const users = await prisma.user.findMany({
    //   where: {
    //     id: { in: parsedConfig.employees.map(e => e.id) }
    //   },
    //   select: { id: true, name: true }
    // });
    
    // 実際のアプリケーションでは、以下のようにシフトをデータベースに保存する処理も追加
    // const savedShifts = await prisma.$transaction(
    //   shifts.map(shift => 
    //     prisma.shift.create({
    //       data: {
    //         userId: shift.employeeId,
    //         storeId: "store-id-here", // 店舗ID
    //         startTime: new Date(shift.start),
    //         endTime: new Date(shift.end),
    //         status: "SCHEDULED",
    //         note: shift.note
    //       }
    //     })
    //   )
    // );
    
    return NextResponse.json({ 
      success: true, 
      shifts,
      message: `${shifts.length}件のシフトを自動生成しました。`
    });
  } catch (error) {
    console.error("シフト生成エラー:", error);
    return NextResponse.json(
      { error: "シフト生成中にエラーが発生しました", details: error },
      { status: 500 }
    );
  }
}

// GETリクエストも提供（設定取得用）
export async function GET() {
  try {
    // 認証チェック
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }
    
    // 実際のアプリケーションでは、以下のようにデータベースから設定データを取得する
    // const settings = await prisma.storeSettings.findFirst({
    //   where: { storeId: storeId }
    // });
    
    // サンプル設定
    const sampleSettings = {
      businessHours: [
        { dayOfWeek: 0, openTime: "10:00", closeTime: "20:00" },
        { dayOfWeek: 1, openTime: "10:00", closeTime: "22:00" },
        { dayOfWeek: 2, openTime: "10:00", closeTime: "22:00" },
        { dayOfWeek: 3, openTime: "10:00", closeTime: "22:00" },
        { dayOfWeek: 4, openTime: "10:00", closeTime: "22:00" },
        { dayOfWeek: 5, openTime: "10:00", closeTime: "23:00" },
        { dayOfWeek: 6, openTime: "10:00", closeTime: "23:00" }
      ],
      staffRequirements: [
        { dayOfWeek: 0, timeSlot: 'morning', count: 3 },
        { dayOfWeek: 0, timeSlot: 'afternoon', count: 4 },
        { dayOfWeek: 0, timeSlot: 'evening', count: 3 },
        { dayOfWeek: 1, timeSlot: 'morning', count: 2 },
        { dayOfWeek: 1, timeSlot: 'afternoon', count: 3 },
        { dayOfWeek: 1, timeSlot: 'evening', count: 3 },
      ],
      generationDefaults: {
        maxConsecutiveDays: 5,
        minRestHours: 10,
        prioritizeEvenDistribution: true,
        respectPositionSkills: true
      }
    };
    
    return NextResponse.json({ settings: sampleSettings });
  } catch (error) {
    console.error("設定取得エラー:", error);
    return NextResponse.json(
      { error: "設定取得中にエラーが発生しました", details: error },
      { status: 500 }
    );
  }
} 