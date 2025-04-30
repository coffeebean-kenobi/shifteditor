import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from 'zod';

// シフト申請のバリデーションスキーマ
const shiftRequestSchema = z.object({
  startTime: z.string().datetime({ message: "開始時間は有効な日時である必要があります" }),
  endTime: z.string().datetime({ message: "終了時間は有効な日時である必要があります" }),
  note: z.string().optional(),
});

// シフト申請一覧を取得するエンドポイント
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const userId = session.user.id;
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    
    // クエリパラメータに基づいてフィルタリング条件を構築
    const filter: any = { userId };
    
    if (status) {
      filter.status = status;
    }
    
    // 店舗IDが一致する申請のみ表示
    filter.storeId = session.user.storeId;

    // シフト申請一覧を取得
    const shiftRequests = await prisma.shiftRequest.findMany({
      where: filter,
      orderBy: {
        startTime: 'desc',
      },
    });

    return NextResponse.json(shiftRequests);
  } catch (error) {
    console.error('シフト申請一覧の取得に失敗しました:', error);
    return NextResponse.json(
      { error: 'シフト申請一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// シフト申請を作成するエンドポイント
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const userId = session.user.id;
    const storeId = session.user.storeId;
    
    // リクエストボディの取得
    const body = await req.json();
    
    // バリデーション
    const validationResult = shiftRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: '入力内容に問題があります', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { startTime, endTime, note } = validationResult.data;
    
    // 開始時間と終了時間の妥当性チェック
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (end <= start) {
      return NextResponse.json(
        { error: '終了時間は開始時間より後である必要があります' },
        { status: 400 }
      );
    }
    
    // シフト申請の作成
    const shiftRequest = await prisma.shiftRequest.create({
      data: {
        userId,
        storeId,
        startTime: start,
        endTime: end,
        note,
        status: 'PENDING',
      },
    });

    return NextResponse.json(shiftRequest, { status: 201 });
  } catch (error) {
    console.error('シフト申請の作成に失敗しました:', error);
    return NextResponse.json(
      { error: 'シフト申請の作成に失敗しました' },
      { status: 500 }
    );
  }
} 