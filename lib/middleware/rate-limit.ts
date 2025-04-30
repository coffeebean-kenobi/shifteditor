/**
 * レート制限ミドルウェア
 * 
 * APIリクエストに対するレート制限を実装するミドルウェア
 * DoS攻撃や乱用からAPIを保護するために使用
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// キャッシュのインターフェース
interface RateLimitCache {
  get(key: string): { count: number, resetTime: number } | undefined;
  set(key: string, value: { count: number, resetTime: number }): void;
  delete(key: string): void;
}

// メモリベースのレート制限キャッシュ
const memoryCache: Map<string, { count: number, resetTime: number }> = new Map();

// メモリベースのキャッシュ実装
const memoryRateLimitCache: RateLimitCache = {
  get(key: string) {
    return memoryCache.get(key);
  },
  set(key: string, value: { count: number, resetTime: number }) {
    memoryCache.set(key, value);
  },
  delete(key: string) {
    memoryCache.delete(key);
  }
};

// 期限切れのエントリを定期的に削除
setInterval(() => {
  const now = Date.now();
  // Array.fromを使ってイテレータの問題を回避
  Array.from(memoryCache.keys()).forEach(key => {
    const value = memoryCache.get(key);
    if (value && value.resetTime < now) {
      memoryCache.delete(key);
    }
  });
}, 60 * 1000); // 1分ごとにクリーンアップ

/**
 * レート制限ミドルウェアファクトリ
 * 
 * @param options レート制限オプション
 * @returns レート制限ミドルウェア
 */
export function createRateLimit(options: {
  // 時間枠内で許可するリクエスト数
  limit: number;
  // 時間枠（ミリ秒）
  windowMs: number;
  // リクエストの識別子を生成する関数
  keyGenerator?: (req: NextRequest) => string;
  // レート制限時に返すメッセージ
  message?: string;
  // キャッシュ実装
  cache?: RateLimitCache;
}) {
  const {
    limit = 100,
    windowMs = 60 * 1000, // デフォルトは1分
    keyGenerator = (req: NextRequest) => {
      const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
      const path = new URL(req.url).pathname;
      return `${ip}:${path}`;
    },
    message = 'リクエスト数が多すぎます。しばらく経ってからお試しください。',
    cache = memoryRateLimitCache
  } = options;
  
  return async function rateLimit(handler: (req: NextRequest) => Promise<Response>) {
    return async (req: NextRequest) => {
      // リクエストキーを生成
      const key = keyGenerator(req);
      
      // 現在の時間
      const now = Date.now();
      
      // キャッシュからカウンタを取得
      let counter = cache.get(key);
      
      // 初回リクエストまたはリセット時間が過ぎている場合
      if (!counter || counter.resetTime < now) {
        counter = {
          count: 0,
          resetTime: now + windowMs
        };
      }
      
      // カウントをインクリメント
      counter.count += 1;
      
      // カウンタを更新
      cache.set(key, counter);
      
      // ヘッダーに残りのリクエスト数を含める
      const headers = new Headers();
      headers.set('X-RateLimit-Limit', limit.toString());
      headers.set('X-RateLimit-Remaining', Math.max(0, limit - counter.count).toString());
      headers.set('X-RateLimit-Reset', Math.ceil(counter.resetTime / 1000).toString());
      
      // 制限を超えた場合
      if (counter.count > limit) {
        logger.warn('レート制限を超過したリクエスト', {
          key,
          count: counter.count,
          limit,
          path: req.url
        });
        
        // 429 Too Many Requests レスポンスを返す
        return NextResponse.json(
          { error: message },
          { 
            status: 429,
            headers
          }
        );
      }
      
      // リクエストを処理
      const response = await handler(req);
      
      // レスポンスにレート制限ヘッダーを追加
      const newResponse = NextResponse.json(
        await response.json(),
        { 
          status: response.status,
          statusText: response.statusText,
          headers: {
            ...Object.fromEntries(response.headers.entries()),
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': Math.max(0, limit - counter.count).toString(),
            'X-RateLimit-Reset': Math.ceil(counter.resetTime / 1000).toString()
          }
        }
      );
      
      return newResponse;
    };
  };
}

/**
 * 一般的なAPIエンドポイント用のレート制限ミドルウェア
 * 
 * @param handler リクエストハンドラー
 * @returns ラップされたハンドラー
 */
export const withRateLimit = createRateLimit({
  limit: 100,
  windowMs: 60 * 1000, // 1分
});

/**
 * 認証エンドポイント用のより厳格なレート制限ミドルウェア
 * 
 * @param handler リクエストハンドラー
 * @returns ラップされたハンドラー
 */
export const withAuthRateLimit = createRateLimit({
  limit: 10,
  windowMs: 60 * 1000, // 1分
  keyGenerator: (req: NextRequest) => {
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    return `auth:${ip}`;
  },
  message: '認証試行回数が多すぎます。しばらく経ってからお試しください。'
}); 