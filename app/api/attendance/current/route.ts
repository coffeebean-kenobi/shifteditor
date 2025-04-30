import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// 現在のシフトと勤怠状況を取得するエンドポイント
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();

    // 現在のシフトを取得（当日のシフト）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const currentShift = await prisma.shift.findFirst({
      where: {
        userId,
        startTime: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (!currentShift) {
      return NextResponse.json({ 
        status: 'NO_SHIFT', 
        message: '本日のシフトはありません' 
      });
    }

    // 対応する勤怠記録を取得
    const attendance = await prisma.attendance.findUnique({
      where: {
        shiftId: currentShift.id,
      },
    });

    // 勤務状況を判定
    let status = 'WAITING';
    let workingTime = null;
    
    if (attendance) {
      if (attendance.clockInTime && !attendance.clockOutTime) {
        status = 'WORKING';
        // 現在までの勤務時間を計算（分単位）
        const clockInTime = new Date(attendance.clockInTime);
        workingTime = Math.round((now.getTime() - clockInTime.getTime()) / 60000);
      } else if (attendance.clockInTime && attendance.clockOutTime) {
        status = 'COMPLETED';
        workingTime = attendance.workingMinutes;
      }
    }

    return NextResponse.json({
      status,
      shift: currentShift,
      attendance,
      workingTime,
    });
  } catch (error) {
    console.error('現在の勤怠状況の取得に失敗しました:', error);
    return NextResponse.json(
      { error: '現在の勤怠状況の取得に失敗しました' },
      { status: 500 }
    );
  }
} 