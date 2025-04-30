import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 通知を取得するAPI
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
    
    // クエリパラメータの取得
    const searchParams = request.nextUrl.searchParams;
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const countOnly = searchParams.get('count') === 'true';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string) : 20;
    const type = searchParams.get('type') || undefined;
    
    // ユーザーIDを取得
    const userId = session.user.id;
    
    // 通知カウントのみを要求された場合
    if (countOnly) {
      const count = await prisma.notification.count({
        where: {
          userId: userId,
          ...(unreadOnly && { isRead: false }),
          ...(type && { type: type as any }),
        },
      });
      
      return NextResponse.json({ count });
    }
    
    // 通知の取得
    const notifications = await prisma.notification.findMany({
      where: {
        userId: userId,
        ...(unreadOnly && { isRead: false }),
        ...(type && { type: type as any }),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });
    
    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "通知の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// 全ての通知を既読にするAPI
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
    
    // 指定されたタイプの通知のみを既読にする場合
    if (body.type) {
      await prisma.notification.updateMany({
        where: {
          userId: userId,
          type: body.type as any,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });
      
      return NextResponse.json({ message: "指定されたタイプの通知を既読にしました" });
    }
    
    // 全ての未読通知を既読にする
    await prisma.notification.updateMany({
      where: {
        userId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
    
    return NextResponse.json({ message: "全ての通知を既読にしました" });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json(
      { error: "通知の既読処理に失敗しました" },
      { status: 500 }
    );
  }
} 