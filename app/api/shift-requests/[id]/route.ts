import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
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
    
    // シフト希望を取得
    const shiftRequest = await prisma.shiftRequest.findUnique({
      where: { id },
    });
    
    // 存在確認
    if (!shiftRequest) {
      return NextResponse.json(
        { error: "シフト希望が見つかりません" },
        { status: 404 }
      );
    }
    
    // 所有者確認
    if (shiftRequest.userId !== userId) {
      return NextResponse.json(
        { error: "このシフト希望を削除する権限がありません" },
        { status: 403 }
      );
    }
    
    // ステータスがPENDINGかを確認
    if (shiftRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "既に処理されたシフト希望はキャンセルできません" },
        { status: 400 }
      );
    }
    
    // シフト希望を削除
    await prisma.shiftRequest.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting shift request:", error);
    return NextResponse.json(
      { error: "シフト希望の削除に失敗しました" },
      { status: 500 }
    );
  }
} 