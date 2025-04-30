import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths, eachDayOfInterval } from "date-fns";
import { ja } from "date-fns/locale";

// 勤怠統計を取得するAPI
export async function GET(request: NextRequest) {
  try {
    // 認証確認
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }
    
    // 管理者権限チェック
    if (!session.user.role || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "管理者権限が必要です" },
        { status: 403 }
      );
    }

    // クエリパラメータの取得
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'month'; // month, week, custom
    const storeId = searchParams.get('storeId') || session.user.storeId;
    
    let startDate: Date;
    let endDate: Date;
    
    // 期間の設定
    if (period === 'month') {
      startDate = startOfMonth(new Date());
      endDate = endOfMonth(new Date());
    } else if (period === 'week') {
      startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
      endDate = endOfWeek(new Date(), { weekStartsOn: 1 });
    } else if (period === 'custom') {
      // カスタム期間（fromとtoパラメータから取得）
      const fromStr = searchParams.get('from');
      const toStr = searchParams.get('to');
      
      if (!fromStr || !toStr) {
        return NextResponse.json(
          { error: "カスタム期間には from と to パラメータが必要です" },
          { status: 400 }
        );
      }
      
      startDate = new Date(fromStr);
      endDate = new Date(toStr);
    } else {
      // デフォルトは今月
      startDate = startOfMonth(new Date());
      endDate = endOfMonth(new Date());
    }

    // 勤怠データの取得
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        user: {
          storeId: storeId as string
        },
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            department: true,
            hourlyWage: true
          }
        },
        shift: true
      },
      orderBy: {
        date: 'asc'
      }
    });

    // シフトデータの取得（欠勤分析用）
    const shifts = await prisma.shift.findMany({
      where: {
        storeId: storeId as string,
        startTime: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // スタッフごとの勤怠集計
    interface StaffAttendanceStats {
      userId: string;
      name: string;
      totalWorkingMinutes: number;
      lateCount: number;
      absentCount: number;
      onTimeCount: number;
      totalShifts: number;
      averageWorkingHours: number;
      averageClockInDeviation: number; // 出勤時刻の予定との平均乖離（分）
      estimatedWage: number; // 給与予測
    }

    const staffStatsMap = new Map<string, StaffAttendanceStats>();

    // スタッフごとのシフト数をカウント
    const staffShiftsCount = new Map<string, number>();
    shifts.forEach(shift => {
      const userId = shift.userId;
      staffShiftsCount.set(userId, (staffShiftsCount.get(userId) || 0) + 1);
    });

    // スタッフごとの勤怠統計を計算
    attendanceRecords.forEach(record => {
      const userId = record.userId;
      const currentStats = staffStatsMap.get(userId) || {
        userId,
        name: record.user.name || '名前なし',
        totalWorkingMinutes: 0,
        lateCount: 0,
        absentCount: 0,
        onTimeCount: 0,
        totalShifts: staffShiftsCount.get(userId) || 0,
        averageWorkingHours: 0,
        averageClockInDeviation: 0,
        estimatedWage: 0
      };

      // 勤務時間の計算
      if (record.clockInTime && record.clockOutTime) {
        const workingMinutes = Math.floor(
          (record.clockOutTime.getTime() - record.clockInTime.getTime()) / (1000 * 60)
        );
        currentStats.totalWorkingMinutes += workingMinutes;
      }

      // 状態に基づく集計
      if (record.status === 'LATE') {
        currentStats.lateCount += 1;
      } else if (record.status === 'ABSENT') {
        currentStats.absentCount += 1;
      } else if (record.status === 'ON_TIME') {
        currentStats.onTimeCount += 1;
      }

      // 出勤時刻の予定との乖離を計算
      if (record.clockInTime && record.shift && record.shift.startTime) {
        const plannedStartTime = new Date(record.shift.startTime);
        const actualStartTime = new Date(record.clockInTime);
        const deviationMinutes = Math.floor(
          (actualStartTime.getTime() - plannedStartTime.getTime()) / (1000 * 60)
        );
        currentStats.averageClockInDeviation += deviationMinutes;
      }

      staffStatsMap.set(userId, currentStats);
    });

    // 平均値の計算と給与予測
    for (const [userId, stats] of staffStatsMap.entries()) {
      const totalAttendance = stats.onTimeCount + stats.lateCount;
      if (totalAttendance > 0) {
        stats.averageWorkingHours = stats.totalWorkingMinutes / totalAttendance / 60;
        stats.averageClockInDeviation = stats.averageClockInDeviation / totalAttendance;
      }

      // 給与予測（時給 × 勤務時間）
      const hourlyWage = stats.totalShifts > 0 ? 
        attendanceRecords.find(r => r.userId === userId)?.user.hourlyWage || 1000 : 0;
      stats.estimatedWage = (stats.totalWorkingMinutes / 60) * hourlyWage;
      
      staffStatsMap.set(userId, stats);
    }

    // 日別の勤怠統計
    const dailyStats = new Map<string, {
      date: string;
      totalStaff: number;
      onTimeCount: number;
      lateCount: number;
      absentCount: number;
      totalWorkingHours: number;
      averageWorkingHours: number;
    }>();

    // 期間内の全日付を生成
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    allDays.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      dailyStats.set(dateStr, {
        date: dateStr,
        totalStaff: 0,
        onTimeCount: 0,
        lateCount: 0,
        absentCount: 0,
        totalWorkingHours: 0,
        averageWorkingHours: 0
      });
    });

    // 各レコードを日付ごとに集計
    attendanceRecords.forEach(record => {
      const dateStr = format(record.date, 'yyyy-MM-dd');
      const dayStats = dailyStats.get(dateStr) || {
        date: dateStr,
        totalStaff: 0,
        onTimeCount: 0,
        lateCount: 0,
        absentCount: 0,
        totalWorkingHours: 0,
        averageWorkingHours: 0
      };

      dayStats.totalStaff += 1;

      if (record.status === 'LATE') {
        dayStats.lateCount += 1;
      } else if (record.status === 'ABSENT') {
        dayStats.absentCount += 1;
      } else if (record.status === 'ON_TIME') {
        dayStats.onTimeCount += 1;
      }

      if (record.clockInTime && record.clockOutTime) {
        const workingHours = 
          (record.clockOutTime.getTime() - record.clockInTime.getTime()) / (1000 * 60 * 60);
        dayStats.totalWorkingHours += workingHours;
      }

      dailyStats.set(dateStr, dayStats);
    });

    // 平均勤務時間の計算
    for (const [dateStr, stats] of dailyStats.entries()) {
      const activeStaff = stats.onTimeCount + stats.lateCount;
      if (activeStaff > 0) {
        stats.averageWorkingHours = stats.totalWorkingHours / activeStaff;
      }
      dailyStats.set(dateStr, stats);
    }

    // 結果の整形
    const result = {
      period: {
        start: startDate,
        end: endDate,
        type: period,
      },
      summary: {
        totalRecords: attendanceRecords.length,
        totalStaff: staffStatsMap.size,
        totalWorkingHours: Array.from(staffStatsMap.values()).reduce(
          (sum, staff) => sum + (staff.totalWorkingMinutes / 60), 0
        ),
        totalLateCount: Array.from(staffStatsMap.values()).reduce(
          (sum, staff) => sum + staff.lateCount, 0
        ),
        totalAbsentCount: Array.from(staffStatsMap.values()).reduce(
          (sum, staff) => sum + staff.absentCount, 0
        ),
        onTimeRate: attendanceRecords.length > 0 ? 
          (attendanceRecords.filter(r => r.status === 'ON_TIME').length / attendanceRecords.length) * 100 : 0,
        totalEstimatedWage: Array.from(staffStatsMap.values()).reduce(
          (sum, staff) => sum + staff.estimatedWage, 0
        )
      },
      staffStats: Array.from(staffStatsMap.values()).map(stats => ({
        userId: stats.userId,
        name: stats.name,
        totalWorkingHours: parseFloat((stats.totalWorkingMinutes / 60).toFixed(2)),
        lateCount: stats.lateCount,
        absentCount: stats.absentCount,
        onTimeCount: stats.onTimeCount,
        attendanceRate: stats.totalShifts > 0 ? 
          ((stats.onTimeCount + stats.lateCount) / stats.totalShifts) * 100 : 0,
        punctualityRate: (stats.onTimeCount + stats.lateCount) > 0 ? 
          (stats.onTimeCount / (stats.onTimeCount + stats.lateCount)) * 100 : 0,
        averageWorkingHours: parseFloat(stats.averageWorkingHours.toFixed(2)),
        averageClockInDeviation: parseFloat(stats.averageClockInDeviation.toFixed(2)),
        estimatedWage: Math.round(stats.estimatedWage)
      })),
      dailyStats: Array.from(dailyStats.values())
        .map(day => ({
          date: day.date,
          totalStaff: day.totalStaff,
          onTimeCount: day.onTimeCount,
          lateCount: day.lateCount,
          absentCount: day.absentCount,
          totalWorkingHours: parseFloat(day.totalWorkingHours.toFixed(2)),
          averageWorkingHours: parseFloat(day.averageWorkingHours.toFixed(2)),
          onTimeRate: day.totalStaff > 0 ? (day.onTimeCount / day.totalStaff) * 100 : 0
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating attendance reports:", error);
    return NextResponse.json(
      { error: "勤怠レポートの生成に失敗しました" },
      { status: 500 }
    );
  }
} 