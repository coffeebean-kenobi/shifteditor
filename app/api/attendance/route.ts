import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// 勤怠一覧を取得するエンドポイント
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
    const status = searchParams.get('status');

    // クエリパラメータに基づいてフィルタリング条件を構築
    const filter: any = { userId };
    
    if (startDate && endDate) {
      filter.shift = {
        startTime: {
          gte: new Date(startDate),
        },
        endTime: {
          lte: new Date(endDate),
        },
      };
    }
    
    if (status) {
      filter.status = status;
    }

    // 勤怠記録を取得（シフト情報も含む）
    const attendances = await prisma.attendance.findMany({
      where: filter,
      include: {
        shift: true,
      },
      orderBy: {
        shift: {
          startTime: 'desc',
        },
      },
    });

    return NextResponse.json(attendances);
  } catch (error) {
    console.error('勤怠記録の取得に失敗しました:', error);
    return NextResponse.json(
      { error: '勤怠記録の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 出勤・退勤打刻を登録するエンドポイント
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const userId = session.user.id;
    const { action, shiftId, note } = await req.json();

    if (!action || !shiftId) {
      return NextResponse.json(
        { error: '無効なリクエストです' },
        { status: 400 }
      );
    }

    // シフトの存在確認
    const shift = await prisma.shift.findUnique({
      where: {
        id: shiftId,
        userId,
      },
    });

    if (!shift) {
      return NextResponse.json(
        { error: 'シフトが見つかりません' },
        { status: 404 }
      );
    }

    // 現在の勤怠状況を確認
    let attendance = await prisma.attendance.findUnique({
      where: {
        shiftId,
      },
    });

    const now = new Date();

    if (action === 'clockIn') {
      // 出勤打刻
      if (attendance) {
        // 既に打刻済みの場合は更新
        attendance = await prisma.attendance.update({
          where: {
            id: attendance.id,
          },
          data: {
            clockInTime: now,
            status: now > shift.startTime ? 'LATE' : 'ON_TIME',
            note: note || attendance.note,
          },
        });
      } else {
        // 新規作成
        attendance = await prisma.attendance.create({
          data: {
            userId,
            shiftId,
            clockInTime: now,
            status: now > shift.startTime ? 'LATE' : 'ON_TIME',
            note,
          },
        });
      }
    } else if (action === 'clockOut') {
      // 退勤打刻（既に出勤打刻されている場合のみ）
      if (!attendance || !attendance.clockInTime) {
        return NextResponse.json(
          { error: '出勤打刻が必要です' },
          { status: 400 }
        );
      }

      // 勤務時間を計算（分単位）
      const clockInTime = new Date(attendance.clockInTime);
      const workingMinutes = Math.round((now.getTime() - clockInTime.getTime()) / 60000);

      attendance = await prisma.attendance.update({
        where: {
          id: attendance.id,
        },
        data: {
          clockOutTime: now,
          workingMinutes,
          note: note || attendance.note,
        },
      });
    } else {
      return NextResponse.json(
        { error: '無効なアクションです' },
        { status: 400 }
      );
    }

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('勤怠記録の更新に失敗しました:', error);
    return NextResponse.json(
      { error: '勤怠記録の更新に失敗しました' },
      { status: 500 }
    );
  }
} 