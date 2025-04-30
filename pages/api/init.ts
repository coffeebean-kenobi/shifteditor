import { NextApiRequest, NextApiResponse } from 'next';
import { initializeSuperAdmin } from '@/lib/admin';

/**
 * アプリケーション初期化API
 * アプリケーション起動時に呼び出される
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // POSTリクエストのみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 初期化処理実行
    await initializeSuperAdmin();
    
    // 成功レスポンス
    return res.status(200).json({ success: true, message: '初期化処理が完了しました' });
  } catch (error) {
    console.error('初期化処理エラー:', error);
    return res.status(500).json({ 
      error: '初期化処理に失敗しました', 
      message: error instanceof Error ? error.message : '不明なエラー' 
    });
  }
} 