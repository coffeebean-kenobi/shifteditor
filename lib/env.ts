/**
 * 型安全な環境変数管理モジュール
 * 
 * 環境変数を検証し、型付きで安全にアクセスするためのモジュール
 */

import { z } from 'zod';

/**
 * 環境変数のスキーマ定義
 */
const envSchema = z.object({
  // データベース
  DATABASE_URL: z.string().url({ message: 'DATABASE_URLは有効なURL形式である必要があります' }),
  
  // Next Auth
  NEXTAUTH_SECRET: z.string().min(1, { message: 'NEXTAUTH_SECRETは必須です' }),
  NEXTAUTH_URL: z.string().url({ message: 'NEXTAUTH_URLは有効なURL形式である必要があります' }),
  
  // メール設定
  SMTP_HOST: z.string().min(1, { message: 'SMTP_HOSTは必須です' }),
  SMTP_PORT: z.string().transform(Number),
  SMTP_USER: z.string().min(1, { message: 'SMTP_USERは必須です' }),
  SMTP_PASSWORD: z.string().min(1, { message: 'SMTP_PASSWORDは必須です' }),
  EMAIL_FROM: z.string().email({ message: 'EMAIL_FROMは有効なメールアドレス形式である必要があります' }),
  
  // アプリケーション
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // オプション設定
  INITIALIZE_SUPER_ADMIN: z.enum(['true', 'false'])
    .transform(val => val === 'true')
    .optional()
    .default('false'),
  
  // Cloudinary設定（画像アップロード用）
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  
  // ロギングサービス設定
  LOG_SERVICE_URL: z.string().url({ message: 'LOG_SERVICE_URLは有効なURL形式である必要があります' }).optional(),
  LOG_SERVICE_API_KEY: z.string().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info')
});

/**
 * 環境変数を検証し、型付きオブジェクトとして返す関数
 */
function getEnvVariables() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`環境変数のバリデーションに失敗しました:\n${missingVars.join('\n')}`);
    }
    throw error;
  }
}

/**
 * 型安全な環境変数オブジェクト
 * エクスポートされた環境変数にアクセスする際に使用する
 */
export const env = getEnvVariables(); 