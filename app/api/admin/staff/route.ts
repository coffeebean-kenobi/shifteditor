import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// スタッフ一覧を取得するAPI
export async function GET() {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // スタッフのデータを取得
    const users = await prisma.user.findMany({
      where: {
        storeId: session.user.storeId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// 新しいスタッフを招待するAPI
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

    // 仮パスワードの生成（本番環境では適切な方法でパスワードを生成し、メールで送信するべき）
    const temporaryPassword = Math.random().toString(36).slice(-8);

    // 新しいユーザーを作成
    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: temporaryPassword, // 本番環境ではハッシュ化する
        role: data.role,
        phone: data.phone,
        storeId: session.user.storeId,
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

    // TODO: ここで招待メールを送信する処理を実装

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating staff:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 