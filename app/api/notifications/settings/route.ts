import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";

type NotificationPreference = {
  userId: string;
  type: string;
  email: boolean;
  push: boolean;
  inApp: boolean;
};

// 通知設定を取得するAPI
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
    
    // ユーザーIDを取得
    const userId = session.user.id;
    
    // 通知タイプの定義
    const notificationTypes = [
      'SHIFT_CONFIRMED',
      'SHIFT_CHANGED',
      'REQUEST_APPROVED',
      'REQUEST_REJECTED',
      'SHIFT_REMINDER',
      'SYSTEM_NOTIFICATION',
      'ADMIN_MESSAGE'
    ];
    
    // ユーザーの通知設定を取得
    const userSettings = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        store: {
          select: {
            settings: {
              select: {
                emailNotifications: true,
                pushNotifications: true,
              }
            }
          }
        }
      }
    });
    
    // ストア設定が見つからない場合はデフォルト値を使用
    const emailEnabled = userSettings?.store?.settings?.emailNotifications ?? true;
    const pushEnabled = userSettings?.store?.settings?.pushNotifications ?? false;
    
    // 通知設定の取得
    const notificationPreferences = await prisma.notificationPreference.findMany({
      where: {
        userId: userId,
      },
    });
    
    // 各通知タイプに対する設定を構築
    const preferences = notificationTypes.map(type => {
      // このタイプの既存設定を探す
      const existingPreference = notificationPreferences.find(
        (pref: NotificationPreference) => pref.type === type
      );
      
      // 設定が見つかれば使用、なければデフォルト値を使用
      return {
        type,
        email: existingPreference ? existingPreference.email : emailEnabled,
        push: existingPreference ? existingPreference.push : pushEnabled,
        inApp: existingPreference ? existingPreference.inApp : true,
      };
    });
    
    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    return NextResponse.json(
      { error: "通知設定の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// 通知設定を更新するAPI
export async function POST(request: NextRequest) {
  try {
    // 認証確認
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }
    
    // ユーザーIDを取得
    const userId = session.user.id;
    
    // リクエストボディを取得
    const body = await request.json();
    const { preferences } = body;
    
    if (!preferences || !Array.isArray(preferences)) {
      return NextResponse.json(
        { error: "有効な設定データが必要です" },
        { status: 400 }
      );
    }
    
    // トランザクションを使用して一括更新
    await prisma.$transaction(async (tx: PrismaClient) => {
      // 既存の設定をすべて削除
      await tx.notificationPreference.deleteMany({
        where: { userId: userId },
      });
      
      // 新しい設定を作成
      const createPromises = preferences.map(pref => 
        tx.notificationPreference.create({
          data: {
            userId: userId,
            type: pref.type,
            email: pref.email,
            push: pref.push,
            inApp: pref.inApp,
          },
        })
      );
      
      await Promise.all(createPromises);
    });
    
    return NextResponse.json({ message: "通知設定を更新しました" });
  } catch (error) {
    console.error("Error updating notification settings:", error);
    return NextResponse.json(
      { error: "通知設定の更新に失敗しました" },
      { status: 500 }
    );
  }
} 