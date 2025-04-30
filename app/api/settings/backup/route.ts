import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// データバックアップを取得するAPI
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }
    
    const storeId = session.user.storeId;
    
    // 店舗の情報を取得
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        settings: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            phone: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        shifts: true,
        shiftRequests: true,
      },
    });
    
    if (!store) {
      return NextResponse.json({ error: '店舗が見つかりません' }, { status: 404 });
    }
    
    // バックアップデータを作成
    const backupData = {
      store: {
        id: store.id,
        name: store.name,
        address: store.address,
        phone: store.phone,
        businessHours: store.businessHours,
        createdAt: store.createdAt,
        updatedAt: store.updatedAt,
      },
      settings: store.settings,
      users: store.users,
      shifts: store.shifts,
      shiftRequests: store.shiftRequests,
      backupDate: new Date(),
    };
    
    return NextResponse.json(backupData);
  } catch (error) {
    console.error('バックアップの作成中にエラーが発生しました:', error);
    return NextResponse.json({ error: 'バックアップの作成に失敗しました' }, { status: 500 });
  }
}

// バックアップからリストアするAPI
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }
    
    const storeId = session.user.storeId;
    const backupData = await request.json();
    
    // バックアップデータの検証（基本的な整合性チェック）
    if (!backupData || !backupData.store || !backupData.settings) {
      return NextResponse.json({ error: '無効なバックアップデータです' }, { status: 400 });
    }
    
    // このAPIではSettingsの復元のみ実装
    // 注: 実際の実装では他のデータも復元する必要があるかもしれませんが、
    // 安全のため、このデモでは設定データのみを復元します
    
    // 既存の設定を確認
    const existingSettings = await prisma.storeSettings.findUnique({
      where: { storeId },
    });
    
    if (existingSettings) {
      // 既存設定を更新
      await prisma.storeSettings.update({
        where: { id: existingSettings.id },
        data: {
          businessHours: backupData.settings.businessHours,
          minShiftHours: backupData.settings.minShiftHours,
          maxShiftHours: backupData.settings.maxShiftHours,
          minBreakMinutes: backupData.settings.minBreakMinutes,
          maxWeeklyWorkHours: backupData.settings.maxWeeklyWorkHours,
          emailNotifications: backupData.settings.emailNotifications,
          pushNotifications: backupData.settings.pushNotifications,
          timezone: backupData.settings.timezone,
          language: backupData.settings.language,
        },
      });
    } else {
      // 新規設定を作成
      await prisma.storeSettings.create({
        data: {
          storeId,
          businessHours: backupData.settings.businessHours,
          minShiftHours: backupData.settings.minShiftHours || 2,
          maxShiftHours: backupData.settings.maxShiftHours || 8,
          minBreakMinutes: backupData.settings.minBreakMinutes || 30,
          maxWeeklyWorkHours: backupData.settings.maxWeeklyWorkHours || 40,
          emailNotifications: backupData.settings.emailNotifications || true,
          pushNotifications: backupData.settings.pushNotifications || false,
          timezone: backupData.settings.timezone || 'Asia/Tokyo',
          language: backupData.settings.language || 'ja',
        },
      });
    }
    
    return NextResponse.json({ success: true, message: '設定のリストアが完了しました' });
  } catch (error) {
    console.error('リストア中にエラーが発生しました:', error);
    return NextResponse.json({ error: 'リストアに失敗しました' }, { status: 500 });
  }
} 