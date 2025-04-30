/**
 * 構造化ロギングシステム
 * 機密情報のマスキングと環境に応じたログ出力を行う
 */

import { env } from '@/lib/env';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  sensitiveFields?: string[];
  context?: Record<string, any>;
}

/**
 * 機密情報をマスクする関数
 * 
 * @param data マスク対象のデータ
 * @param sensitiveFields マスクするフィールド名の配列
 * @returns マスク処理されたデータ
 */
function maskSensitiveData(data: any, sensitiveFields: string[] = []) {
  if (!data) return data;
  
  const masked = { ...data };
  for (const field of sensitiveFields) {
    if (field in masked) {
      masked[field] = '********';
    }
  }
  return masked;
}

/**
 * 外部ロギングサービスにログを送信する関数
 * 
 * @param logData ログデータ
 */
async function sendToExternalLoggingService(logData: any) {
  if (env.LOG_SERVICE_URL) {
    try {
      const response = await fetch(env.LOG_SERVICE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.LOG_SERVICE_API_KEY || ''}`
        },
        body: JSON.stringify(logData)
      });
      
      if (!response.ok) {
        console.error(`ログサービスへの送信に失敗しました: ${response.status}`);
      }
    } catch (error) {
      console.error('ログサービスへの接続に失敗しました:', error);
    }
  } else {
    // 外部サービスが設定されていない場合はJSON形式でコンソール出力
    console.log(JSON.stringify(logData));
  }
}

/**
 * ロガーオブジェクト
 * 各ログレベルに対応するメソッドを提供
 */
export const logger = {
  debug: (message: string, data?: any, options?: LogOptions) => {
    logMessage('debug', message, data, options);
  },
  info: (message: string, data?: any, options?: LogOptions) => {
    logMessage('info', message, data, options);
  },
  warn: (message: string, data?: any, options?: LogOptions) => {
    logMessage('warn', message, data, options);
  },
  error: (message: string, data?: any, options?: LogOptions) => {
    logMessage('error', message, data, options);
  }
};

/**
 * ログメッセージを処理する内部関数
 * 
 * @param level ログレベル
 * @param message ログメッセージ
 * @param data 付加データ
 * @param options ロギングオプション
 */
function logMessage(level: LogLevel, message: string, data?: any, options?: LogOptions) {
  const sensitiveFields = options?.sensitiveFields || ['password', 'token', 'secret', 'apiKey'];
  const maskedData = data ? maskSensitiveData(data, sensitiveFields) : undefined;
  
  const logData = {
    timestamp: new Date().toISOString(),
    level,
    message,
    data: maskedData,
    context: options?.context,
    environment: env.NODE_ENV,
    appVersion: process.env.npm_package_version || 'unknown'
  };
  
  // 開発環境ではコンソールに出力
  if (env.NODE_ENV === 'development') {
    const logFn = level === 'error' ? console.error : 
                  level === 'warn' ? console.warn : 
                  level === 'debug' ? console.debug : 
                  console.log;
    
    logFn(`[${logData.timestamp}] [${level.toUpperCase()}] ${message}`, maskedData);
  } else {
    // 本番環境では外部ロギングサービスに送信
    sendToExternalLoggingService(logData);
  }
} 