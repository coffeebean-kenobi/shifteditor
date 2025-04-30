import { hash } from 'bcryptjs';
import { loadSuperAdminConfig, configFileExists } from './config';
import { prisma } from './prisma';

/**
 * スーパーアドミンユーザーの作成・更新
 * アプリケーション起動時に実行される
 */
export const initializeSuperAdmin = async (): Promise<void> => {
  // 設定ファイルが存在するか確認
  if (!configFileExists('admin.json')) {
    console.warn('スーパーアドミン設定ファイルが見つかりません。スーパーアドミンは作成されません。');
    return;
  }

  try {
    // 設定ファイルを読み込む
    const config = loadSuperAdminConfig();
    const { email, password, name } = config.superAdmin;

    // 既存のスーパーアドミンを検索
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { isSuperAdmin: true }
    });

    // 既存のスーパーアドミンが存在する場合
    if (existingSuperAdmin) {
      console.log(`スーパーアドミンが既に存在します: ${existingSuperAdmin.email}`);
      
      // 設定ファイルのemailと既存のスーパーアドミンのemailが一致しない場合は更新
      if (existingSuperAdmin.email !== email) {
        console.log(`スーパーアドミンのメールアドレスを更新します: ${existingSuperAdmin.email} -> ${email}`);
        await prisma.user.update({
          where: { id: existingSuperAdmin.id },
          data: { email, name }
        });
      }
      
      return;
    }
    
    // 既存のスーパーアドミンがいない場合は新規作成
    
    // メールアドレスが既に存在するか確認
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      // 既存ユーザーをスーパーアドミンに昇格
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          isSuperAdmin: true,
          role: 'ADMIN',
          name
        }
      });
      console.log(`既存ユーザー ${email} をスーパーアドミンに昇格しました`);
    } else {
      // まず最初のストアを探す（スーパーアドミンはどこかのストアに所属する必要がある）
      const firstStore = await prisma.store.findFirst();
      
      if (!firstStore) {
        console.error('スーパーアドミンを作成するにはストアが少なくとも1つ必要です');
        return;
      }
      
      // パスワードのハッシュ化
      const passwordHash = await hash(password, 10);
      
      // 新規スーパーアドミンを作成
      await prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
          role: 'ADMIN',
          isSuperAdmin: true,
          storeId: firstStore.id
        }
      });
      
      console.log(`スーパーアドミンを作成しました: ${email}`);
    }
  } catch (error) {
    console.error('スーパーアドミンの初期化中にエラーが発生しました:', error);
  }
}; 