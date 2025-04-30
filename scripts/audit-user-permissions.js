const { PrismaClient } = require('@prisma/client');
const colors = require('ansi-colors');
const fs = require('fs');
const path = require('path');

// Prismaクライアントの初期化
const prisma = new PrismaClient();

// ログ出力の設定
const log = {
  info: (message) => console.log(colors.blue(`[INFO] ${message}`)),
  success: (message) => console.log(colors.green(`[SUCCESS] ${message}`)),
  warning: (message) => console.log(colors.yellow(`[WARNING] ${message}`)),
  error: (message) => console.log(colors.red(`[ERROR] ${message}`)),
};

// レポートの保存先
const REPORT_DIR = path.join(process.cwd(), 'reports');
const REPORT_FILE = path.join(REPORT_DIR, `user-permissions-audit-${new Date().toISOString().split('T')[0]}.json`);

/**
 * レポートディレクトリの確認・作成
 */
function ensureReportDir() {
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
    log.info(`レポートディレクトリを作成しました: ${REPORT_DIR}`);
  }
}

/**
 * スーパーアドミンユーザーの監査
 */
async function auditSuperAdminUsers() {
  log.info('スーパーアドミンユーザーの監査を開始します...');
  
  try {
    // スーパーアドミン権限を持つユーザーを取得
    const superAdmins = await prisma.user.findMany({
      where: {
        isSuperAdmin: true,
        role: 'ADMIN'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (superAdmins.length === 0) {
      log.warning('スーパーアドミン権限を持つユーザーが見つかりませんでした。');
      return { superAdmins: [], issues: ['スーパーアドミンユーザーが存在しません'] };
    }
    
    log.info(`${superAdmins.length}人のスーパーアドミンユーザーが見つかりました。`);
    
    // ドメイン検証
    const approvedDomains = ['company.com', 'admin.company.com', 'example.com'];
    const issues = [];
    
    for (const admin of superAdmins) {
      const domain = admin.email.split('@')[1];
      
      if (!approvedDomains.includes(domain)) {
        const message = `不正なドメインのスーパーアドミン: ${admin.email}`;
        log.error(message);
        issues.push(message);
      } else {
        log.success(`正規のスーパーアドミン: ${admin.email}`);
      }
    }
    
    return {
      superAdmins: superAdmins,
      issues: issues
    };
  } catch (error) {
    log.error(`監査実行中にエラーが発生しました: ${error}`);
    return { error: error.message };
  }
}

/**
 * 管理者権限の監査
 */
async function auditAdminUsers() {
  log.info('管理者ユーザーの権限監査を開始します...');
  
  try {
    // 管理者ユーザーを取得
    const adminUsers = await prisma.user.findMany({
      where: {
        role: 'ADMIN',
        isSuperAdmin: false
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        storeId: true
      }
    });
    
    log.info(`${adminUsers.length}人の管理者ユーザーが見つかりました。`);
    
    // 追加の検証ロジックをここに実装
    // 例: 店舗ごとの管理者数をチェック
    
    return {
      adminUsers: adminUsers,
      issues: []
    };
  } catch (error) {
    log.error(`監査実行中にエラーが発生しました: ${error}`);
    return { error: error.message };
  }
}

/**
 * 監査レポートの作成と保存
 */
async function saveAuditReport(report) {
  try {
    ensureReportDir();
    
    const reportData = JSON.stringify(report, null, 2);
    fs.writeFileSync(REPORT_FILE, reportData);
    
    log.success(`監査レポートを保存しました: ${REPORT_FILE}`);
  } catch (error) {
    log.error(`レポート保存中にエラーが発生しました: ${error}`);
  }
}

/**
 * メイン実行関数
 */
async function runAudit() {
  log.info('ユーザー権限監査を開始します...');
  
  try {
    // 監査の実行
    const superAdminAudit = await auditSuperAdminUsers();
    const adminAudit = await auditAdminUsers();
    
    // レポートの作成
    const report = {
      timestamp: new Date().toISOString(),
      superAdminAudit: superAdminAudit,
      adminAudit: adminAudit,
      summary: {
        superAdminCount: superAdminAudit.superAdmins?.length || 0,
        adminCount: adminAudit.adminUsers?.length || 0,
        issuesFound: (superAdminAudit.issues?.length || 0) + (adminAudit.issues?.length || 0)
      }
    };
    
    // レポートの保存
    await saveAuditReport(report);
    
    if (report.summary.issuesFound > 0) {
      log.warning(`監査の結果、${report.summary.issuesFound}件の問題が見つかりました。`);
    } else {
      log.success('監査の結果、問題は見つかりませんでした。');
    }
    
    log.info('ユーザー権限監査が完了しました。');
  } catch (error) {
    log.error(`監査プロセス中に致命的なエラーが発生しました: ${error}`);
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプトが直接実行された場合に監査を実行
if (require.main === module) {
  runAudit()
    .catch(error => {
      log.error(`予期しないエラーが発生しました: ${error}`);
      process.exit(1);
    });
} 