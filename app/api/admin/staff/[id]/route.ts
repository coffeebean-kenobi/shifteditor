import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// スタッフ情報の取得
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;
    
    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
        storeId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 自分のストアのユーザーのみ取得可能
    if (user.storeId !== session.user.storeId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching staff details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// スタッフ情報の更新
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;
    const data = await request.json();
    
    // バリデーション
    if (!data.name || !data.email || !data.role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // ユーザーの存在確認と権限チェック
    const existingUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 自分のストアのユーザーのみ更新可能
    if (existingUser.storeId !== session.user.storeId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // メールの重複チェック（自分以外の同じメールアドレスがある場合）
    if (data.email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email: data.email,
          id: {
            not: userId,
          },
        },
      });

      if (emailExists) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
      }
    }

    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        phone: data.phone,
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

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating staff:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// スタッフの削除
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;

    // 自分自身は削除できない
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // ユーザーの存在確認と権限チェック
    const existingUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 自分のストアのユーザーのみ削除可能
    if (existingUser.storeId !== session.user.storeId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ユーザーを削除
    await prisma.user.delete({
      where: {
        id: userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting staff:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 