import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// 設定情報を取得するAPI
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }
    
    const storeId = session.user.storeId;
    
    // 既存の設定を取得
    const settings = await prisma.storeSettings.findUnique({
      where: { storeId },
    });
    
    if (!settings) {
      // 設定がない場合はデフォルト値で作成
      const newSettings = await prisma.storeSettings.create({
        data: {
          storeId,
          businessHours: {
            monday: { open: '09:00', close: '18:00', isOpen: true },
            tuesday: { open: '09:00', close: '18:00', isOpen: true },
            wednesday: { open: '09:00', close: '18:00', isOpen: true },
            thursday: { open: '09:00', close: '18:00', isOpen: true },
            friday: { open: '09:00', close: '18:00', isOpen: true },
            saturday: { open: '10:00', close: '17:00', isOpen: true },
            sunday: { open: '10:00', close: '17:00', isOpen: false },
          }
        }
      });
      
      return NextResponse.json(newSettings);
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('設定の取得中にエラーが発生しました:', error);
    return NextResponse.json({ error: '設定の取得に失敗しました' }, { status: 500 });
  }
}

// 設定情報を更新するAPI
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }
    
    const storeId = session.user.storeId;
    const data = await request.json();
    
    // 既存の設定を確認
    const existingSettings = await prisma.storeSettings.findUnique({
      where: { storeId },
    });
    
    if (!existingSettings) {
      // 設定がない場合は新規作成
      const newSettings = await prisma.storeSettings.create({
        data: {
          storeId,
          ...data,
        },
      });
      
      return NextResponse.json(newSettings);
    }
    
    // 既存の設定を更新
    const updatedSettings = await prisma.storeSettings.update({
      where: { id: existingSettings.id },
      data,
    });
    
    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('設定の更新中にエラーが発生しました:', error);
    return NextResponse.json({ error: '設定の更新に失敗しました' }, { status: 500 });
  }
} 