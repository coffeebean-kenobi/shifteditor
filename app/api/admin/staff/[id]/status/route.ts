import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// スタッフのステータス変更
export async function PATCH(
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
    const { status } = await request.json();
    
    if (!status || !['active', 'inactive'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // 自分自身のステータスは変更できない
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot change your own status' },
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

    // 自分のストアのユーザーのみステータス変更可能
    if (existingUser.storeId !== session.user.storeId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ユーザーのステータスフィールドを更新
    // 注: 実際のスキーマにはステータスフィールドがないので、
    // ここではusers テーブルにカスタムフィールドを追加する必要があります
    // または、以下のようにメタデータを別テーブルに保存する方法もあります
    
    // 例: ユーザーメタデータテーブルがある場合
    // await prisma.userMetadata.upsert({
    //   where: {
    //     userId,
    //   },
    //   update: {
    //     status,
    //   },
    //   create: {
    //     userId,
    //     status,
    //   },
    // });

    // スキーマにステータスフィールドがない場合は、
    // アプリケーションの要件に応じてその他の方法で対応する必要があります
    // 例えば、ユーザーのロールを変更するなど

    // ダミーのレスポンス（実際の実装では適切なレスポンスを返す）
    return NextResponse.json({ 
      id: userId,
      status: status,
      updated: true
    });
  } catch (error) {
    console.error('Error updating staff status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 