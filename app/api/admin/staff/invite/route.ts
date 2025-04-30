import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// スタッフ招待API
export async function POST(request: Request) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // バリデーション
    if (!data.name || !data.email || !data.role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // メールアドレスの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    // 仮パスワードの生成（実際のシステムでは強力なランダムパスワードを生成すべき）
    const temporaryPassword = Math.random().toString(36).slice(-8);
    
    // パスワードのハッシュ化
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    // 新しいユーザーを作成
    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: passwordHash,
        role: data.role,
        phone: data.phone || null,
        storeId: session.user.storeId, // 同じ店舗に属するように設定
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
      },
    });

    // ここでメール送信処理を追加（実装は省略）
    // 例: メール送信サービスを使用して招待メールを送信
    // await sendInvitationEmail(data.email, {
    //   name: data.name,
    //   temporaryPassword,
    //   inviterName: session.user.name
    // });

    // デバッグ用（本番環境では削除すること）
    console.log(`Generated temporary password for ${data.email}: ${temporaryPassword}`);

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error inviting staff:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 