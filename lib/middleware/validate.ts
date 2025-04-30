/**
 * APIリクエストのバリデーションミドルウェア
 * 
 * Zodスキーマを使用して一貫したバリデーションを行うためのミドルウェア
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';

/**
 * リクエストのバリデーションを行うミドルウェア関数
 * 
 * @param schema バリデーションに使用するZodスキーマ
 * @returns バリデーション済みのデータまたはエラーレスポンス
 */
export function validateRequest(schema: z.Schema) {
  return async (req: NextRequest) => {
    try {
      // リクエストボディをJSONとしてパース
      const body = await req.json();
      
      // Zodスキーマを使用してバリデーション
      const result = schema.safeParse(body);
      
      // バリデーション失敗時はエラーレスポンスを返す
      if (!result.success) {
        logger.warn('リクエストバリデーションに失敗しました', {
          path: req.url,
          errors: result.error.format()
        });
        
        return NextResponse.json(
          { error: '入力データが無効です', details: result.error.format() },
          { status: 400 }
        );
      }
      
      // バリデーション成功時はパース済みのデータを返す
      logger.debug('リクエストバリデーションに成功しました', {
        path: req.url
      });
      
      return result.data;
    } catch (error) {
      // JSON解析エラーの場合
      logger.error('リクエストの解析に失敗しました', {
        path: req.url,
        error: error instanceof Error ? error.message : String(error)
      });
      
      return NextResponse.json(
        { error: 'リクエストの解析に失敗しました' },
        { status: 400 }
      );
    }
  };
} 