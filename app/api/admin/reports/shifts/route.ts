import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";

// シフト統計を取得するAPI
export async function GET(request: NextRequest) {
  try {
    // 認証確認
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.isAdmin) {
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

    // シフトデータの取得
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
            name: true,
            role: true,
            department: true,
          }
        }
      }
    });

    // シフト希望データの取得
    const shiftRequests = await prisma.shiftRequest.findMany({
      where: {
        user: {
          storeId: storeId as string
        },
        startTime: {
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
          }
        }
      }
    });

    // 部署別シフト集計
    const departmentStats = new Map<string, { totalHours: number, shiftsCount: number, staffCount: Set<string> }>();
    
    shifts.forEach(shift => {
      const department = shift.user.department || '未分類';
      const hours = (new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / (1000 * 60 * 60);
      
      if (!departmentStats.has(department)) {
        departmentStats.set(department, { totalHours: 0, shiftsCount: 0, staffCount: new Set() });
      }
      
      const stats = departmentStats.get(department)!;
      stats.totalHours += hours;
      stats.shiftsCount += 1;
      stats.staffCount.add(shift.userId);
    });

    // 役割別シフト集計
    const roleStats = new Map<string, { totalHours: number, shiftsCount: number, staffCount: Set<string> }>();
    
    shifts.forEach(shift => {
      const role = shift.user.role || '一般';
      const hours = (new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / (1000 * 60 * 60);
      
      if (!roleStats.has(role)) {
        roleStats.set(role, { totalHours: 0, shiftsCount: 0, staffCount: new Set() });
      }
      
      const stats = roleStats.get(role)!;
      stats.totalHours += hours;
      stats.shiftsCount += 1;
      stats.staffCount.add(shift.userId);
    });

    // 希望シフト達成率の計算
    const totalRequests = shiftRequests.length;
    let fulfilledRequests = 0;
    
    shiftRequests.forEach(request => {
      // シフト希望が確定シフトに反映されているかをチェック
      const isRequestFulfilled = shifts.some(shift => 
        shift.userId === request.userId &&
        format(new Date(shift.startTime), 'yyyy-MM-dd') === format(new Date(request.startTime), 'yyyy-MM-dd') &&
        Math.abs(new Date(shift.startTime).getHours() - new Date(request.startTime).getHours()) <= 1 &&
        Math.abs(new Date(shift.endTime).getHours() - new Date(request.endTime).getHours()) <= 1
      );
      
      if (isRequestFulfilled) {
        fulfilledRequests += 1;
      }
    });
    
    const fulfillmentRate = totalRequests > 0 ? (fulfilledRequests / totalRequests) * 100 : 100;

    // 日別シフト配置状況
    const dailyShiftDistribution = new Map<string, { date: string, totalShifts: number, totalHours: number, staffCount: Set<string> }>();
    
    shifts.forEach(shift => {
      const dateStr = format(new Date(shift.startTime), 'yyyy-MM-dd');
      const hours = (new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / (1000 * 60 * 60);
      
      if (!dailyShiftDistribution.has(dateStr)) {
        dailyShiftDistribution.set(dateStr, { date: dateStr, totalShifts: 0, totalHours: 0, staffCount: new Set() });
      }
      
      const dayStats = dailyShiftDistribution.get(dateStr)!;
      dayStats.totalShifts += 1;
      dayStats.totalHours += hours;
      dayStats.staffCount.add(shift.userId);
    });

    // 結果の整形
    const result = {
      period: {
        start: startDate,
        end: endDate,
        type: period,
      },
      summary: {
        totalShifts: shifts.length,
        totalStaff: new Set(shifts.map(s => s.userId)).size,
        totalHours: shifts.reduce((sum, shift) => {
          return sum + (new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / (1000 * 60 * 60);
        }, 0),
        requestFulfillmentRate: parseFloat(fulfillmentRate.toFixed(2)),
      },
      departmentStats: Array.from(departmentStats.entries()).map(([department, stats]) => ({
        department,
        totalHours: parseFloat(stats.totalHours.toFixed(2)),
        shiftsCount: stats.shiftsCount,
        staffCount: stats.staffCount.size,
      })),
      roleStats: Array.from(roleStats.entries()).map(([role, stats]) => ({
        role,
        totalHours: parseFloat(stats.totalHours.toFixed(2)),
        shiftsCount: stats.shiftsCount,
        staffCount: stats.staffCount.size,
      })),
      dailyDistribution: Array.from(dailyShiftDistribution.values())
        .map(day => ({
          date: day.date,
          totalShifts: day.totalShifts,
          totalHours: parseFloat(day.totalHours.toFixed(2)),
          staffCount: day.staffCount.size,
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating shift reports:", error);
    return NextResponse.json(
      { error: "シフトレポートの生成に失敗しました" },
      { status: 500 }
    );
  }
} 