import { User } from "next-auth";
import { prisma } from "./prisma";

/**
 * 監査ログのアクションタイプ
 */
export enum AuditActionType {
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  SHIFT_CREATED = 'SHIFT_CREATED',
  SHIFT_UPDATED = 'SHIFT_UPDATED',
  SHIFT_DELETED = 'SHIFT_DELETED',
  SHIFT_APPROVED = 'SHIFT_APPROVED',
  SHIFT_REJECTED = 'SHIFT_REJECTED',
  STAFF_INVITED = 'STAFF_INVITED',
  ROLE_CHANGED = 'ROLE_CHANGED',
  SETTINGS_UPDATED = 'SETTINGS_UPDATED',
  STORE_UPDATED = 'STORE_UPDATED',
}

/**
 * 監査ログインターフェース
 */
interface AuditLogData {
  actionType: AuditActionType;
  userId: string;
  targetId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  storeId?: string;
}

/**
 * 監査ログを記録する関数
 * @param {AuditLogData} logData - 記録するログデータ
 * @returns {Promise<void>}
 */
export async function logAuditEvent(logData: AuditLogData): Promise<void> {
  try {
    // サニタイズと検証
    const sanitizedDetails = logData.details ? JSON.stringify(logData.details) : null;
    
    // Prismaを使用してデータベースにログを保存
    await prisma.auditLog.create({
      data: {
        actionType: logData.actionType,
        userId: logData.userId,
        targetId: logData.targetId || null,
        details: sanitizedDetails,
        ipAddress: logData.ipAddress || null,
        userAgent: logData.userAgent || null,
        storeId: logData.storeId || null,
      },
    });
  } catch (error) {
    console.error('監査ログの保存に失敗しました:', error);
    // エラーをスローせず、ロギングの失敗でアプリケーションが停止しないようにする
  }
}

/**
 * API Routeから監査ログを記録するためのヘルパー関数
 * @param {AuditActionType} actionType - アクションタイプ
 * @param {User} user - 操作を実行しているユーザー
 * @param {string} targetId - 操作の対象ID（オプション）
 * @param {Record<string, any>} details - 追加詳細（オプション）
 * @param {Request} request - HTTPリクエスト
 * @returns {Promise<void>}
 */
export async function logApiAction(
  actionType: AuditActionType,
  user: User,
  targetId?: string,
  details?: Record<string, any>,
  request?: Request
): Promise<void> {
  if (!user || !user.id) {
    console.warn('ユーザー情報なしでの監査ログ記録が試みられました');
    return;
  }

  // リクエストからIPアドレスとUser-Agentを取得
  let ipAddress: string | undefined;
  let userAgent: string | undefined;

  if (request) {
    // IPアドレスの取得（プロキシ対応）
    ipAddress = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') ||
                'unknown';
                
    // User-Agentの取得
    userAgent = request.headers.get('user-agent') || 'unknown';
  }

  await logAuditEvent({
    actionType,
    userId: user.id,
    targetId,
    details,
    ipAddress,
    userAgent,
    storeId: (user as any).storeId,
  });
}

/**
 * ログ検索パラメータ
 */
export interface AuditLogSearchParams {
  userId?: string;
  actionType?: AuditActionType;
  startDate?: Date;
  endDate?: Date;
  storeId?: string;
  limit?: number;
  offset?: number;
}

/**
 * 監査ログを検索する関数
 * @param {AuditLogSearchParams} params - 検索パラメータ
 * @returns {Promise<{ logs: any[], total: number }>} - 検索結果とトータル件数
 */
export async function searchAuditLogs(params: AuditLogSearchParams) {
  const {
    userId,
    actionType,
    startDate,
    endDate,
    storeId,
    limit = 50,
    offset = 0,
  } = params;

  // 検索条件を構築
  const where: any = {};
  
  if (userId) where.userId = userId;
  if (actionType) where.actionType = actionType;
  if (storeId) where.storeId = storeId;
  
  // 日付範囲の条件
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  // ログを取得
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
} 