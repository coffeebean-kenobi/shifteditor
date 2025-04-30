import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/auth-options';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // セッションチェック（ミドルウェアでも確認しているが念のため二重チェック）
    if (!session?.user) {
      return NextResponse.json(
        { error: '認証されていません' },
        { status: 401 }
      );
    }
    
    // スーパーアドミン権限チェック（ミドルウェアでも確認しているが念のため二重チェック）
    // @ts-ignore - ユーザー型の拡張プロパティ
    if (!session.user.isSuperAdmin) {
      return NextResponse.json(
        { error: 'スーパーアドミン権限が必要です' },
        { status: 403 }
      );
    }
    
    // システム全体の統計情報を取得
    const [
      totalUsers,
      totalStores,
      totalShifts,
      totalShiftRequests,
      totalAttendance
    ] = await Promise.all([
      prisma.user.count(),
      prisma.store.count(),
      prisma.shift.count(),
      prisma.shiftRequest.count(),
      prisma.attendance.count()
    ]);
    
    // 管理者数と一般ユーザー数を取得
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' }
    });
    
    const staffCount = totalUsers - adminCount;
    
    return NextResponse.json({
      systemStats: {
        totalUsers,
        adminCount,
        staffCount,
        totalStores,
        totalShifts,
        totalShiftRequests,
        totalAttendance
      }
    });
  } catch (error) {
    console.error('スーパーアドミンAPI エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // セッションチェック
    if (!session?.user) {
      return NextResponse.json(
        { error: '認証されていません' },
        { status: 401 }
      );
    }
    
    // スーパーアドミン権限チェック
    // @ts-ignore - ユーザー型の拡張プロパティ
    if (!session.user.isSuperAdmin) {
      return NextResponse.json(
        { error: 'スーパーアドミン権限が必要です' },
        { status: 403 }
      );
    }
    
    // リクエストボディを取得
    const body = await req.json();
    const { action, data } = body;
    
    if (!action) {
      return NextResponse.json(
        { error: 'アクションが指定されていません' },
        { status: 400 }
      );
    }
    
    // 各アクションに対する処理
    switch (action) {
      case 'promoteToAdmin':
        // ユーザーを管理者に昇格
        if (!data?.userId) {
          return NextResponse.json(
            { error: 'ユーザーIDが必要です' },
            { status: 400 }
          );
        }
        
        await prisma.user.update({
          where: { id: data.userId },
          data: { role: 'ADMIN' }
        });
        
        return NextResponse.json({ success: true, message: '管理者に昇格しました' });
      
      case 'promoteToSuperAdmin':
        // ユーザーをスーパーアドミンに昇格
        if (!data?.userId) {
          return NextResponse.json(
            { error: 'ユーザーIDが必要です' },
            { status: 400 }
          );
        }
        
        await prisma.user.update({
          where: { id: data.userId },
          data: { role: 'ADMIN', isSuperAdmin: true }
        });
        
        return NextResponse.json({ success: true, message: 'スーパーアドミンに昇格しました' });
      
      case 'createStore':
        // 新規ストア作成
        if (!data?.name || !data?.address || !data?.phone) {
          return NextResponse.json(
            { error: '必須項目が不足しています' },
            { status: 400 }
          );
        }
        
        const newStore = await prisma.store.create({
          data: {
            name: data.name,
            address: data.address,
            phone: data.phone,
            businessHours: data.businessHours || {
              monday: { open: '09:00', close: '18:00' },
              tuesday: { open: '09:00', close: '18:00' },
              wednesday: { open: '09:00', close: '18:00' },
              thursday: { open: '09:00', close: '18:00' },
              friday: { open: '09:00', close: '18:00' },
              saturday: { open: '10:00', close: '17:00' },
              sunday: { open: '10:00', close: '17:00' }
            }
          }
        });
        
        return NextResponse.json({ 
          success: true, 
          message: 'ストアを作成しました',
          store: newStore
        });
      
      default:
        return NextResponse.json(
          { error: '無効なアクションです' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('スーパーアドミンAPI エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
} 