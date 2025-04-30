/**
 * CSRF保護ミドルウェア
 * 
 * クロスサイトリクエストフォージェリ攻撃からの保護を提供するミドルウェア
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { env } from '@/lib/env';
import { createHash, randomBytes } from 'crypto';

// CSRFトークンの有効期限（1時間）
const TOKEN_EXPIRY = 60 * 60 * 1000;

/**
 * CSRFトークンを生成する関数
 * 
 * @param userId ユーザーID
 * @returns 生成されたCSRFトークンと有効期限
 */
export function generateCsrfToken(userId: string): { token: string, expires: number } {
  // ランダムな文字列を生成
  const randomString = randomBytes(32).toString('hex');
  
  // 現在のタイムスタンプ
  const timestamp = Date.now();
  
  // 有効期限
  const expires = timestamp + TOKEN_EXPIRY;
  
  // ソルトとして使用するシークレットキー
  const secret = env.NEXTAUTH_SECRET;
  
  // userId + ランダム文字列 + タイムスタンプ + シークレットからハッシュを生成
  const hmac = createHash('sha256')
    .update(`${userId}:${randomString}:${timestamp}:${secret}`)
    .digest('hex');
  
  // トークン = ランダム文字列:タイムスタンプ:ハッシュ
  const token = `${randomString}:${timestamp}:${hmac}`;
  
  return { token, expires };
}

/**
 * CSRFトークンを検証する関数
 * 
 * @param token CSRFトークン
 * @param userId ユーザーID
 * @returns トークンが有効かどうか
 */
export function validateCsrfToken(token: string, userId: string): boolean {
  try {
    // トークンをパース
    const [randomString, timestampStr, hmac] = token.split(':');
    
    // パースされた値が揃っていない場合は無効
    if (!randomString || !timestampStr || !hmac) {
      return false;
    }
    
    const timestamp = parseInt(timestampStr, 10);
    
    // タイムスタンプが数値でない場合は無効
    if (isNaN(timestamp)) {
      return false;
    }
    
    // 有効期限チェック
    if (Date.now() > timestamp + TOKEN_EXPIRY) {
      return false;
    }
    
    // シークレットキー
    const secret = env.NEXTAUTH_SECRET;
    
    // 期待されるハッシュを計算
    const expectedHmac = createHash('sha256')
      .update(`${userId}:${randomString}:${timestamp}:${secret}`)
      .digest('hex');
    
    // ハッシュの一致を確認
    return hmac === expectedHmac;
  } catch (error) {
    logger.error('CSRFトークンの検証中にエラーが発生しました', { error });
    return false;
  }
}

/**
 * CSRFトークン検証ミドルウェア
 * 
 * @param handler リクエストハンドラー
 * @returns ラップされたハンドラー
 */
export function withCsrfProtection(handler: (req: NextRequest) => Promise<Response>) {
  return async (req: NextRequest) => {
    // GETリクエストはCSRF保護の対象外
    if (req.method === 'GET') {
      return handler(req);
    }
    
    // リクエストからCSRFトークンを取得
    const csrfToken = req.headers.get('X-CSRF-Token');
    
    // リクエストからユーザーIDを取得（認証情報から）
    // 注: 実際の実装では、認証済みセッションからユーザーIDを取得する必要がある
    const session = req.cookies.get('next-auth.session-token');
    
    if (!csrfToken || !session) {
      logger.warn('CSRFトークンまたはセッションが見つかりません', {
        path: req.url,
        method: req.method
      });
      
      return NextResponse.json(
        { error: 'CSRF保護のために有効なトークンが必要です' },
        { status: 403 }
      );
    }
    
    // セッションからユーザーIDを取得する実際のロジック
    // この例では、単純化のためにセッショントークン自体をユーザーIDとして使用
    const userId = session.value;
    
    if (!validateCsrfToken(csrfToken, userId)) {
      logger.warn('無効なCSRFトークンが検出されました', {
        path: req.url,
        method: req.method
      });
      
      return NextResponse.json(
        { error: 'CSRF保護のために有効なトークンが必要です' },
        { status: 403 }
      );
    }
    
    // CSRFトークンが有効な場合、ハンドラーを実行
    return handler(req);
  };
} 