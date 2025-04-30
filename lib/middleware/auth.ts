import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';

/**
 * 認証とロールベースのアクセス制御を行うミドルウェア
 * 
 * @param handler 認証後に実行するハンドラー関数
 * @param options オプション（必要な権限ロールなど）
 * @returns 認証後にハンドラーを実行する関数
 */
export async function withAuth(
  handler: (req: NextRequest, session: any) => Promise<Response>,
  options?: { requiredRole?: 'ADMIN' | 'STAFF' | 'SUPER_ADMIN' }
) {
  return async (req: NextRequest) => {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      logger.warn('認証されていないアクセスが検出されました', { url: req.url });
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }
    
    if (options?.requiredRole && session.user.role !== options.requiredRole) {
      logger.warn('不十分な権限によるアクセスが検出されました', {
        url: req.url,
        userRole: session.user.role,
        requiredRole: options.requiredRole
      });
      
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }
    
    return handler(req, session);
  };
} 