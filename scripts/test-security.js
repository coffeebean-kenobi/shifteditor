const { compare, hash } = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const colors = require('ansi-colors');

// テスト用のPrismaClientを初期化
const prisma = new PrismaClient();

// ログ出力用の設定
const log = {
  info: (message) => console.log(colors.blue(`[INFO] ${message}`)),
  success: (message) => console.log(colors.green(`[SUCCESS] ${message}`)),
  warning: (message) => console.log(colors.yellow(`[WARNING] ${message}`)),
  error: (message) => console.log(colors.red(`[ERROR] ${message}`)),
};

/**
 * スーパーアドミンの権限テスト
 */
async function testSuperAdminPermissions() {
  log.info('スーパーアドミン権限テストを開始します...');
  
  try {
    // スーパーアドミンユーザーを取得（isSuperAdmin = trueのユーザー）
    const superAdmins = await prisma.user.findMany({
      where: { 
        isSuperAdmin: true,
        role: 'ADMIN'
      }
    });
    
    if (superAdmins.length === 0) {
      log.warning('スーパーアドミンが設定されていません。');
      return;
    }
    
    log.info(`${superAdmins.length}人のスーパーアドミンが見つかりました。`);
    
    // 各スーパーアドミンのメールアドレスのドメインをチェック
    const approvedDomains = ['company.com', 'admin.company.com', 'example.com'];
    
    for (const admin of superAdmins) {
      const email = admin.email;
      const domain = email.split('@')[1];
      
      if (!approvedDomains.includes(domain)) {
        log.error(`不正なドメインのスーパーアドミン: ${email}`);
      } else {
        log.success(`正規のスーパーアドミン: ${email}`);
      }
    }
  } catch (error) {
    log.error(`テスト実行中にエラーが発生しました: ${error}`);
  }
}

/**
 * パスワードハッシュのテスト
 */
async function testPasswordHashing() {
  log.info('パスワードハッシュのテストを開始します...');
  
  const testPassword = 'TestPassword123!';
  
  try {
    // ハッシュ化
    const hashedPassword = await hash(testPassword, 10);
    log.info(`パスワードをハッシュ化しました: ${hashedPassword.substring(0, 20)}...`);
    
    // 検証
    const isValid = await compare(testPassword, hashedPassword);
    
    if (isValid) {
      log.success('パスワード検証が正常に機能しています');
    } else {
      log.error('パスワード検証に失敗しました');
    }
    
    // 誤ったパスワードでの検証
    const isInvalid = await compare('WrongPassword', hashedPassword);
    
    if (!isInvalid) {
      log.success('誤ったパスワードの検証が正常に機能しています');
    } else {
      log.error('誤ったパスワードが受け入れられています');
    }
  } catch (error) {
    log.error(`テスト実行中にエラーが発生しました: ${error}`);
  }
}

/**
 * メインの実行関数
 */
async function runSecurityTests() {
  log.info('セキュリティテストを開始します...');
  
  await testSuperAdminPermissions();
  await testPasswordHashing();
  
  log.info('セキュリティテストが完了しました');
  
  // Prismaの接続を閉じる
  await prisma.$disconnect();
}

// スクリプトが直接実行された場合のみテストを実行
if (require.main === module) {
  runSecurityTests()
    .catch(error => {
      log.error(`テスト実行中に致命的エラーが発生しました: ${error}`);
      process.exit(1);
    });
} 