import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// シフト一覧を取得するエンドポイント
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const userId = session.user.id;
    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const showAll = searchParams.get('showAll') === 'true';
    
    // 管理者かどうかを確認
    const isAdmin = session.user.role === 'ADMIN';
    
    // クエリパラメータに基づいてフィルタリング条件を構築
    const filter: any = {};
    
    // 日付範囲フィルタリング
    if (startDate && endDate) {
      filter.startTime = {
        gte: new Date(startDate),
      };
      filter.endTime = {
        lte: new Date(endDate),
      };
    }
    
    // 閲覧権限に基づくフィルタリング
    // 管理者でない場合、または全体表示が指定されていない場合は自分のシフトのみ表示
    if (!isAdmin || !showAll) {
      filter.userId = userId;
    } else if (isAdmin && !showAll) {
      // 管理者が自分のシフトのみを表示する場合
      filter.userId = userId;
    }
    
    // 店舗IDが一致するシフトのみ表示
    filter.storeId = session.user.storeId;

    // シフト一覧を取得
    const shifts = await prisma.shift.findMany({
      where: filter,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // フロントエンドで使いやすい形式に変換
    const formattedShifts = shifts.map(shift => ({
      id: shift.id,
      title: `${shift.user.name}`,
      start: shift.startTime.toISOString(),
      end: shift.endTime.toISOString(),
      employeeId: shift.userId,
      employeeName: shift.user.name,
      status: shift.status,
      note: shift.note,
      color: shift.status === 'CANCELED' ? '#ff5252' : '#4285f4',
    }));

    return NextResponse.json(formattedShifts);
  } catch (error) {
    console.error('シフト一覧の取得に失敗しました:', error);
    return NextResponse.json(
      { error: 'シフト一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
} 