import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/auth-options";
import { z } from "zod";
import { hash, compare } from "bcryptjs";

// プロフィール更新のバリデーションスキーマ
const profileUpdateSchema = z.object({
  name: z.string().min(1, "お名前は必須です"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  phone: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  imageUrl: z.string().optional(),
});

export async function PUT(req: Request) {
  try {
    // セッションから認証ユーザーを取得
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "認証されていません" },
        { status: 401 }
      );
    }

    // リクエストボディをパース
    const body = await req.json();
    
    // バリデーション
    const validationResult = profileUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "入力データが無効です", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { name, email, phone, currentPassword, newPassword, imageUrl } = validationResult.data;

    // 現在のユーザー情報を取得
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    // 更新データの準備
    const updateData: any = {
      name,
      phone,
    };

    // メールアドレスが変更された場合、他のユーザーと重複していないか確認
    if (email !== currentUser.email) {
      const existingUserWithEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUserWithEmail && existingUserWithEmail.id !== session.user.id) {
        return NextResponse.json(
          { error: "このメールアドレスは既に使用されています" },
          { status: 409 }
        );
      }
      
      updateData.email = email;
    }

    // 画像URLが提供された場合は更新
    if (imageUrl) {
      updateData.imageUrl = imageUrl;
    }

    // パスワード変更の処理
    if (newPassword && currentPassword) {
      // 現在のパスワードを検証
      const passwordMatch = await compare(currentPassword, currentUser.passwordHash);
      
      if (!passwordMatch) {
        return NextResponse.json(
          { error: "現在のパスワードが正しくありません" },
          { status: 400 }
        );
      }
      
      // 新しいパスワードをハッシュ化
      updateData.passwordHash = await hash(newPassword, 10);
    }

    // ユーザー情報の更新
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    // パスワードハッシュを除外した安全なユーザー情報を返す
    const { passwordHash, ...safeUser } = updatedUser;

    return NextResponse.json(
      { message: "プロフィールが正常に更新されました", user: safeUser },
      { status: 200 }
    );
  } catch (error) {
    console.error("プロフィール更新エラー:", error);
    return NextResponse.json(
      { error: "プロフィールの更新に失敗しました", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 