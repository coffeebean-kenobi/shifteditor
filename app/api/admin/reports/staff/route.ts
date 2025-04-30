import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths } from "date-fns";

// スタッフ統計を取得するAPI
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
    const storeId = searchParams.get('storeId') || session.user.storeId;
    const period = searchParams.get('period') || 'month'; // month, week, custom
    
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
    
    // ユーザー情報の取得
    const users = await prisma.user.findMany({
      where: {
        storeId: storeId as string,
        role: {
          not: 'ADMIN' // 管理者を除外（必要に応じて調整）
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        hourlyWage: true,
        createdAt: true
      }
    });
    
    // スタッフごとのシフトデータ
    const staffShifts = await Promise.all(users.map(async (user) => {
      // ユーザーのシフト数
      const shiftsCount = await prisma.shift.count({
        where: {
          userId: user.id,
          startTime: {
            gte: startDate,
            lte: endDate
          }
        }
      });
      
      // ユーザーの勤務時間
      const shifts = await prisma.shift.findMany({
        where: {
          userId: user.id,
          startTime: {
            gte: startDate,
            lte: endDate
          }
        }
      });
      
      // 総勤務時間の計算
      const totalWorkHours = shifts.reduce((total, shift) => {
        const hours = (new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / (1000 * 60 * 60);
        return total + hours;
      }, 0);
      
      // 週あたりの平均勤務時間
      const weeksInPeriod = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      const avgWeeklyHours = weeksInPeriod > 0 ? totalWorkHours / weeksInPeriod : 0;
      
      return {
        userId: user.id,
        shiftsCount,
        totalWorkHours,
        avgWeeklyHours
      };
    }));
    
    // 勤怠データの取得
    const staffAttendance = await Promise.all(users.map(async (user) => {
      // 勤怠記録
      const attendance = await prisma.attendance.findMany({
        where: {
          userId: user.id,
          date: {
            gte: startDate,
            lte: endDate
          }
        }
      });
      
      // 勤怠統計計算
      const onTimeCount = attendance.filter(a => a.status === 'ON_TIME').length;
      const lateCount = attendance.filter(a => a.status === 'LATE').length;
      const absentCount = attendance.filter(a => a.status === 'ABSENT').length;
      const totalAttendance = attendance.length;
      
      // 勤務時間計算
      let totalWorkMinutes = 0;
      attendance.forEach(record => {
        if (record.clockInTime && record.clockOutTime) {
          const minutes = (record.clockOutTime.getTime() - record.clockInTime.getTime()) / (1000 * 60);
          totalWorkMinutes += minutes;
        }
      });
      
      // 勤務時間（時間単位）
      const totalWorkHours = totalWorkMinutes / 60;
      
      // 時給から推定給与を計算
      const estimatedWage = totalWorkHours * (user.hourlyWage || 1000);
      
      return {
        userId: user.id,
        onTimeCount,
        lateCount,
        absentCount,
        totalAttendance,
        totalWorkHours,
        punctualityRate: totalAttendance > 0 ? (onTimeCount / totalAttendance) * 100 : 0,
        estimatedWage: Math.round(estimatedWage)
      };
    }));
    
    // シフト希望データの収集
    const staffRequests = await Promise.all(users.map(async (user) => {
      // ユーザーのシフト希望
      const requests = await prisma.shiftRequest.findMany({
        where: {
          userId: user.id,
          startTime: {
            gte: startDate,
            lte: endDate
          }
        }
      });
      
      // ユーザーの確定シフト
      const shifts = await prisma.shift.findMany({
        where: {
          userId: user.id,
          startTime: {
            gte: startDate,
            lte: endDate
          }
        }
      });
      
      // 希望達成率の計算
      let fulfilledCount = 0;
      
      requests.forEach(request => {
        // シフト希望が確定シフトに反映されているかをチェック
        const isRequestFulfilled = shifts.some(shift => 
          format(new Date(shift.startTime), 'yyyy-MM-dd') === format(new Date(request.startTime), 'yyyy-MM-dd') &&
          Math.abs(new Date(shift.startTime).getHours() - new Date(request.startTime).getHours()) <= 1 &&
          Math.abs(new Date(shift.endTime).getHours() - new Date(request.endTime).getHours()) <= 1
        );
        
        if (isRequestFulfilled) {
          fulfilledCount++;
        }
      });
      
      const fulfillmentRate = requests.length > 0 ? (fulfilledCount / requests.length) * 100 : 100;
      
      return {
        userId: user.id,
        requestsCount: requests.length,
        fulfilledCount,
        fulfillmentRate
      };
    }));
    
    // 部署別のスタッフ集計
    const departmentStats = new Map<string, { count: number, avgPunctuality: number, totalHours: number }>();
    users.forEach(user => {
      const department = user.department || '未分類';
      
      if (!departmentStats.has(department)) {
        departmentStats.set(department, { count: 0, avgPunctuality: 0, totalHours: 0 });
      }
      
      const stats = departmentStats.get(department)!;
      stats.count += 1;
      
      const attendance = staffAttendance.find(a => a.userId === user.id);
      if (attendance) {
        stats.avgPunctuality += attendance.punctualityRate;
        stats.totalHours += attendance.totalWorkHours;
      }
      
      departmentStats.set(department, stats);
    });
    
    // 部署統計の平均値計算
    for (const [dept, stats] of departmentStats.entries()) {
      if (stats.count > 0) {
        stats.avgPunctuality = stats.avgPunctuality / stats.count;
      }
      departmentStats.set(dept, stats);
    }
    
    // 結果の整形
    const result = {
      period: {
        start: startDate,
        end: endDate,
        type: period,
      },
      summary: {
        totalStaff: users.length,
        totalShifts: staffShifts.reduce((sum, staff) => sum + staff.shiftsCount, 0),
        totalWorkHours: parseFloat(staffShifts.reduce((sum, staff) => sum + staff.totalWorkHours, 0).toFixed(2)),
        avgPunctualityRate: parseFloat(
          (staffAttendance.reduce((sum, staff) => sum + staff.punctualityRate, 0) / staffAttendance.length || 0).toFixed(2)
        ),
        totalEstimatedWage: staffAttendance.reduce((sum, staff) => sum + staff.estimatedWage, 0),
        avgRequestFulfillmentRate: parseFloat(
          (staffRequests.reduce((sum, staff) => sum + staff.fulfillmentRate, 0) / staffRequests.length || 0).toFixed(2)
        )
      },
      staffPerformance: users.map(user => {
        const shifts = staffShifts.find(s => s.userId === user.id) || {
          shiftsCount: 0,
          totalWorkHours: 0,
          avgWeeklyHours: 0
        };
        
        const attendance = staffAttendance.find(a => a.userId === user.id) || {
          onTimeCount: 0,
          lateCount: 0,
          absentCount: 0,
          totalAttendance: 0,
          totalWorkHours: 0,
          punctualityRate: 0,
          estimatedWage: 0
        };
        
        const requests = staffRequests.find(r => r.userId === user.id) || {
          requestsCount: 0,
          fulfilledCount: 0,
          fulfillmentRate: 0
        };
        
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department || '未分類',
          hourlyWage: user.hourlyWage || 1000,
          joinDate: user.createdAt,
          stats: {
            shiftsCount: shifts.shiftsCount,
            totalWorkHours: parseFloat(shifts.totalWorkHours.toFixed(2)),
            avgWeeklyHours: parseFloat(shifts.avgWeeklyHours.toFixed(2)),
            onTimeCount: attendance.onTimeCount,
            lateCount: attendance.lateCount,
            absentCount: attendance.absentCount,
            punctualityRate: parseFloat(attendance.punctualityRate.toFixed(2)),
            estimatedWage: attendance.estimatedWage,
            requestsCount: requests.requestsCount,
            fulfilledCount: requests.fulfilledCount,
            fulfillmentRate: parseFloat(requests.fulfillmentRate.toFixed(2))
          }
        };
      }),
      departmentStats: Array.from(departmentStats.entries()).map(([department, stats]) => ({
        department,
        staffCount: stats.count,
        avgPunctualityRate: parseFloat(stats.avgPunctuality.toFixed(2)),
        totalWorkHours: parseFloat(stats.totalHours.toFixed(2)),
        avgWorkHoursPerStaff: stats.count > 0 ? parseFloat((stats.totalHours / stats.count).toFixed(2)) : 0
      }))
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating staff reports:", error);
    return NextResponse.json(
      { error: "スタッフレポートの生成に失敗しました" },
      { status: 500 }
    );
  }
} 