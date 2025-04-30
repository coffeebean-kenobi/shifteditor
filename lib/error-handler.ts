/**
 * アプリケーション全体で一貫したエラーハンドリングを行うための
 * グローバルエラーハンドラーモジュール
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

/**
 * アプリケーション固有のエラークラス
 * エラーメッセージ、ステータスコード、エラーコードを含む
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * API ハンドラーにエラーハンドリングを追加するためのラッパー関数
 * 
 * @param handler API リクエストを処理するハンドラー関数
 * @returns エラーハンドリングを含むラップされたハンドラー関数
 */
export function withErrorHandler(handler: (req: NextRequest) => Promise<Response>) {
  return async (req: NextRequest) => {
    try {
      return await handler(req);
    } catch (error) {
      return handleError(error, req);
    }
  };
}

/**
 * エラーの種類に応じた適切なレスポンスを返す内部関数
 * 
 * @param error 発生したエラー
 * @param req 現在のリクエスト
 * @returns 適切なエラーレスポンス
 */
function handleError(error: unknown, req: NextRequest): Response {
  // アプリケーション固有のエラー
  if (error instanceof AppError) {
    logger.warn('アプリケーションエラーが発生しました', {
      errorCode: error.code,
      message: error.message,
      url: req.url
    });
    
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }
  
  // Prismaデータベースエラー
  if (error instanceof PrismaClientKnownRequestError) {
    logger.error('データベースエラーが発生しました', {
      code: error.code,
      meta: error.meta,
      url: req.url
    });
    
    // エラーコードに基づいた適切なレスポンス
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: '一意制約違反: 既に存在するデータです', code: 'UNIQUE_CONSTRAINT_VIOLATION' },
        { status: 409 }
      );
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'データが見つかりません', code: 'RECORD_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: '外部キー制約違反: 関連するデータが存在しません', code: 'FOREIGN_KEY_VIOLATION' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'データベースエラーが発生しました', code: error.code },
      { status: 500 }
    );
  }
  
  // その他の未処理エラー
  const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
  
  logger.error('未処理のエラーが発生しました', {
    error: errorMessage,
    stack: error instanceof Error ? error.stack : undefined,
    url: req.url
  });
  
  return NextResponse.json(
    { error: '内部サーバーエラーが発生しました' },
    { status: 500 }
  );
} 