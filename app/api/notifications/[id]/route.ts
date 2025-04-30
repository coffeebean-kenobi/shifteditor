import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Params {
  params: {
    id: string;
  };
}

// 特定の通知を取得するAPI
export async function GET(request: NextRequest, { params }: Params) {
  try {
    // 認証確認
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }
    
    // 通知IDを取得
    const notificationId = params.id;
    
    // ユーザーIDを取得
    const userId = session.user.id;
    
    // 通知を取得
    const notification = await prisma.notification.findUnique({
      where: {
        id: notificationId,
      },
    });
    
    // 通知が存在しない場合
    if (!notification) {
      return NextResponse.json(
        { error: "通知が見つかりません" },
        { status: 404 }
      );
    }
    
    // 他のユーザーの通知は取得不可
    if (notification.userId !== userId) {
      return NextResponse.json(
        { error: "この通知にアクセスする権限がありません" },
        { status: 403 }
      );
    }
    
    return NextResponse.json(notification);
  } catch (error) {
    console.error("Error fetching notification:", error);
    return NextResponse.json(
      { error: "通知の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// 特定の通知を更新するAPI
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    // 認証確認
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }
    
    // 通知IDを取得
    const notificationId = params.id;
    
    // ユーザーIDを取得
    const userId = session.user.id;
    
    // リクエストボディを取得
    const body = await request.json();
    const { isRead } = body;
    
    // 通知を取得して確認
    const notification = await prisma.notification.findUnique({
      where: {
        id: notificationId,
      },
    });
    
    // 通知が存在しない場合
    if (!notification) {
      return NextResponse.json(
        { error: "通知が見つかりません" },
        { status: 404 }
      );
    }
    
    // 他のユーザーの通知は更新不可
    if (notification.userId !== userId) {
      return NextResponse.json(
        { error: "この通知を更新する権限がありません" },
        { status: 403 }
      );
    }
    
    // 通知を更新
    const updatedNotification = await prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        isRead: isRead !== undefined ? isRead : notification.isRead,
      },
    });
    
    return NextResponse.json(updatedNotification);
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { error: "通知の更新に失敗しました" },
      { status: 500 }
    );
  }
}

// 特定の通知を削除するAPI
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    // 認証確認
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }
    
    // 通知IDを取得
    const notificationId = params.id;
    
    // ユーザーIDを取得
    const userId = session.user.id;
    
    // 通知を取得して確認
    const notification = await prisma.notification.findUnique({
      where: {
        id: notificationId,
      },
    });
    
    // 通知が存在しない場合
    if (!notification) {
      return NextResponse.json(
        { error: "通知が見つかりません" },
        { status: 404 }
      );
    }
    
    // 他のユーザーの通知は削除不可
    if (notification.userId !== userId) {
      return NextResponse.json(
        { error: "この通知を削除する権限がありません" },
        { status: 403 }
      );
    }
    
    // 通知を削除
    await prisma.notification.delete({
      where: {
        id: notificationId,
      },
    });
    
    return NextResponse.json({ message: "通知を削除しました" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { error: "通知の削除に失敗しました" },
      { status: 500 }
    );
  }
} 