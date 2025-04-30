#!/usr/bin/env node

const path = require('path');
const { execSync } = require('child_process');
const colors = require('ansi-colors');
const fs = require('fs');

// ログ出力の設定
const log = {
  info: (message) => console.log(colors.blue(`[INFO] ${message}`)),
  success: (message) => console.log(colors.green(`[SUCCESS] ${message}`)),
  warning: (message) => console.log(colors.yellow(`[WARNING] ${message}`)),
  error: (message) => console.log(colors.red(`[ERROR] ${message}`)),
  separator: () => console.log(colors.gray('───────────────────────────────────────────────────────'))
};

/**
 * レポートディレクトリの確認・作成
 */
function ensureReportDir() {
  const reportDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
    log.info(`レポートディレクトリを作成しました: ${reportDir}`);
  }
  return reportDir;
}

/**
 * 依存関係の監査を実行
 */
function runDependencyAudit() {
  log.info('依存関係の監査を実行しています...');
  log.separator();
  
  try {
    const output = execSync('npm audit --json', { encoding: 'utf8' });
    const auditResult = JSON.parse(output);
    
    const reportDir = ensureReportDir();
    const reportFile = path.join(reportDir, `dependency-audit-${new Date().toISOString().split('T')[0]}.json`);
    
    fs.writeFileSync(reportFile, JSON.stringify(auditResult, null, 2));
    
    // 結果の概要を表示
    const vulnerabilities = auditResult.metadata?.vulnerabilities;
    
    if (vulnerabilities) {
      const totalVulnerabilities = Object.values(vulnerabilities).reduce((acc, val) => acc + val, 0);
      
      if (totalVulnerabilities > 0) {
        log.warning(`${totalVulnerabilities}件の脆弱性が見つかりました:`);
        
        for (const [severity, count] of Object.entries(vulnerabilities)) {
          if (count > 0) {
            const severityColor = {
              critical: colors.red,
              high: colors.red,
              moderate: colors.yellow,
              low: colors.blue,
              info: colors.green
            };
            
            const colorFn = severityColor[severity] || colors.white;
            console.log(colorFn(`  ${severity}: ${count}件`));
          }
        }
        
        log.info(`詳細は ${reportFile} を確認してください。`);
      } else {
        log.success('依存関係に脆弱性は見つかりませんでした。');
      }
    } else {
      log.warning('監査結果が予期しない形式でした。');
    }
    
    return true;
  } catch (error) {
    log.error(`依存関係の監査中にエラーが発生しました: ${error.message}`);
    return false;
  } finally {
    log.separator();
  }
}

/**
 * セキュリティテストスクリプトを実行
 */
function runSecurityTestScript() {
  log.info('セキュリティテストスクリプトを実行しています...');
  log.separator();
  
  try {
    execSync('node scripts/test-security.js', { stdio: 'inherit' });
    log.success('セキュリティテストスクリプトが正常に実行されました。');
    return true;
  } catch (error) {
    log.error(`セキュリティテストスクリプトの実行中にエラーが発生しました: ${error.message}`);
    return false;
  } finally {
    log.separator();
  }
}

/**
 * ユーザー権限監査スクリプトを実行
 */
function runUserPermissionsAudit() {
  log.info('ユーザー権限監査を実行しています...');
  log.separator();
  
  try {
    execSync('node scripts/audit-user-permissions.js', { stdio: 'inherit' });
    log.success('ユーザー権限監査が正常に実行されました。');
    return true;
  } catch (error) {
    log.error(`ユーザー権限監査の実行中にエラーが発生しました: ${error.message}`);
    return false;
  } finally {
    log.separator();
  }
}

/**
 * APIセキュリティチェックを実行
 */
function runApiSecurityCheck() {
  log.info('APIセキュリティチェックを実行しています...');
  log.separator();
  
  try {
    execSync('node scripts/api-security-check.js', { stdio: 'inherit' });
    log.success('APIセキュリティチェックが正常に実行されました。');
    return true;
  } catch (error) {
    log.error(`APIセキュリティチェックの実行中にエラーが発生しました: ${error.message}`);
    return false;
  } finally {
    log.separator();
  }
}

/**
 * メイン実行関数
 */
function runAllSecurityTests() {
  log.info('セキュリティテストを開始します...');
  
  const results = {};
  
  // 依存関係の監査
  results.dependencyAudit = runDependencyAudit();
  
  // セキュリティテストスクリプト
  results.securityTest = runSecurityTestScript();
  
  // ユーザー権限監査
  results.userPermissionsAudit = runUserPermissionsAudit();
  
  // APIセキュリティチェック
  results.apiSecurityCheck = runApiSecurityCheck();
  
  // 結果のサマリー
  log.separator();
  log.info('セキュリティテスト結果のサマリー:');
  
  for (const [test, succeeded] of Object.entries(results)) {
    const testNameMap = {
      dependencyAudit: '依存関係の監査',
      securityTest: 'セキュリティテスト',
      userPermissionsAudit: 'ユーザー権限監査',
      apiSecurityCheck: 'APIセキュリティチェック'
    };
    
    const testName = testNameMap[test] || test;
    const resultText = succeeded ? colors.green('成功') : colors.red('失敗');
    
    console.log(`  ${testName}: ${resultText}`);
  }
  
  // 全体の結果
  const allSucceeded = Object.values(results).every(result => result);
  
  log.separator();
  if (allSucceeded) {
    log.success('すべてのセキュリティテストが正常に完了しました。');
  } else {
    log.warning('一部のセキュリティテストが失敗しました。詳細なログを確認してください。');
  }
}

// スクリプトを実行
if (require.main === module) {
  runAllSecurityTests();
} 