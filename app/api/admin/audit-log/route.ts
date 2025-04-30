import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  AuditActionType, 
  searchAuditLogs, 
  AuditLogSearchParams 
} from '@/lib/audit-logger';

/**
 * 監査ログ取得API
 * GETメソッドで監査ログを取得する
 * クエリパラメータ:
 * - userId: 特定ユーザーの操作に限定
 * - actionType: アクションタイプでフィルター
 * - startDate: 開始日
 * - endDate: 終了日
 * - limit: 取得件数
 * - offset: オフセット (ページング用)
 */
export async function GET(request: NextRequest) {
  try {
    // 認証とADMIN権限の確認
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '管理者権限が必要です' }, 
        { status: 403 }
      );
    }

    // URLクエリパラメータの取得
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || undefined;
    const actionType = searchParams.get('actionType') as AuditActionType | undefined;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    // 日付パラメータの変換
    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;
    
    // 数値パラメータの変換
    const limit = limitParam ? parseInt(limitParam, 10) : 50;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;
    
    // 管理者は店舗に関連付けられているため、その店舗のログのみ取得可能
    const storeId = session.user.storeId;

    // 検索パラメータの構築
    const params: AuditLogSearchParams = {
      userId,
      actionType,
      startDate,
      endDate,
      storeId,
      limit,
      offset
    };

    // 監査ログの検索
    const { logs, total } = await searchAuditLogs(params);

    // 結果を返す
    return NextResponse.json({ 
      data: logs, 
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + logs.length < total
      }
    });

  } catch (error) {
    console.error('監査ログ取得エラー:', error);
    return NextResponse.json(
      { error: '監査ログの取得中にエラーが発生しました' }, 
      { status: 500 }
    );
  }
} 