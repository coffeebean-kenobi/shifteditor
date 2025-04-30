import fs from 'fs';
import path from 'path';

/**
 * 設定ファイルのパス
 */
const CONFIG_DIR = path.join(process.cwd(), 'config');

/**
 * スーパーアドミン設定ファイルの型定義
 */
export interface SuperAdminConfig {
  superAdmin: {
    email: string;
    password: string;
    name: string;
  };
}

/**
 * 設定ファイルの存在確認
 * @param fileName 設定ファイル名
 * @returns 存在するかどうか
 */
export const configFileExists = (fileName: string): boolean => {
  const filePath = path.join(CONFIG_DIR, fileName);
  return fs.existsSync(filePath);
};

/**
 * JSONファイルを読み込む
 * @param fileName ファイル名
 * @returns 読み込んだJSONオブジェクト
 * @throws ファイルが存在しない場合や形式が不正な場合にエラー
 */
export const loadJsonConfig = <T>(fileName: string): T => {
  const filePath = path.join(CONFIG_DIR, fileName);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`設定ファイル ${fileName} が見つかりません`);
  }
  
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent) as T;
  } catch (error) {
    console.error(`設定ファイル ${fileName} の読み込みエラー:`, error);
    throw new Error(`設定ファイル ${fileName} の読み込みに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * スーパーアドミン設定を読み込む
 * @returns スーパーアドミン設定
 * @throws 設定ファイルが存在しない場合にエラー
 */
export const loadSuperAdminConfig = (): SuperAdminConfig => {
  return loadJsonConfig<SuperAdminConfig>('admin.json');
}; 