const fs = require('fs');
const path = require('path');
const colors = require('ansi-colors');
const { glob } = require('glob');

// ログ出力の設定
const log = {
  info: (message) => console.log(colors.blue(`[INFO] ${message}`)),
  success: (message) => console.log(colors.green(`[SUCCESS] ${message}`)),
  warning: (message) => console.log(colors.yellow(`[WARNING] ${message}`)),
  error: (message) => console.log(colors.red(`[ERROR] ${message}`)),
};

// レポートの保存先
const REPORT_DIR = path.join(process.cwd(), 'reports');
const REPORT_FILE = path.join(REPORT_DIR, `api-security-check-${new Date().toISOString().split('T')[0]}.json`);

// APIルートのパス
const API_ROUTES_PATH = path.join(process.cwd(), 'app', 'api');

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
 * APIルートファイルの検索
 */
function findApiRouteFiles() {
  return new Promise((resolve, reject) => {
    try {
      // app/apiディレクトリが存在するか確認
      if (!fs.existsSync(API_ROUTES_PATH)) {
        resolve([]);
        return;
      }
      
      // 簡易的なファイル検索の実装
      const results = [];
      
      // APIルートディレクトリ内のすべての階層を再帰的に検索する関数
      function searchDir(dir) {
        const files = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const file of files) {
          const fullPath = path.join(dir, file.name);
          
          if (file.isDirectory()) {
            searchDir(fullPath);
          } else if (file.isFile() && (file.name === 'route.js' || file.name === 'route.ts')) {
            // パスをワークスペースルートからの相対パスに変換
            const relativePath = path.relative(process.cwd(), fullPath);
            results.push(relativePath);
          }
        }
      }
      
      // 検索を開始
      searchDir(API_ROUTES_PATH);
      resolve(results);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * ファイル内容を検索して特定のパターンを見つける
 */
function checkFileForPatterns(filePath, patterns) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const results = {};
    
    for (const [key, pattern] of Object.entries(patterns)) {
      results[key] = {
        found: pattern.regex.test(content),
        pattern: pattern.description
      };
    }
    
    return results;
  } catch (error) {
    log.error(`ファイル ${filePath} の解析中にエラーが発生しました: ${error}`);
    return {};
  }
}

/**
 * APIルートのセキュリティチェック
 */
async function checkApiRouteSecurity() {
  log.info('APIルートのセキュリティチェックを開始します...');
  
  try {
    const apiFiles = await findApiRouteFiles();
    log.info(`${apiFiles.length}個のAPIルートファイルが見つかりました。`);
    
    const patterns = {
      authentication: {
        regex: /(getServerSession|authOptions|session|auth\.)/i,
        description: '認証チェック'
      },
      validation: {
        regex: /(validate|schema|zod|joi|yup|validator\.)/i,
        description: '入力バリデーション'
      },
      csrf: {
        regex: /(csrf|xsrf|token)/i,
        description: 'CSRF対策'
      },
      rateLimit: {
        regex: /(rateLimit|throttle|limiter)/i,
        description: 'レート制限'
      },
      errorHandling: {
        regex: /(try\s*{|catch\s*\(|error)/i,
        description: 'エラーハンドリング'
      },
      sensitiveDataLogging: {
        regex: /(console\.log|console\.error)/i,
        description: '機密データのログ出力の可能性'
      }
    };
    
    const results = [];
    let issuesCount = 0;
    
    for (const file of apiFiles) {
      const fileCheck = {
        file: file,
        checks: checkFileForPatterns(file, patterns),
        issues: []
      };
      
      // 認証チェックが見つからない場合は問題として記録
      if (!fileCheck.checks.authentication.found) {
        fileCheck.issues.push('認証チェックが見つかりません。公開APIでない場合は認証を追加してください。');
        issuesCount++;
      }
      
      // バリデーションが見つからない場合は問題として記録
      if (!fileCheck.checks.validation.found) {
        fileCheck.issues.push('入力バリデーションが見つかりません。すべての入力データを検証してください。');
        issuesCount++;
      }
      
      // エラーハンドリングが見つからない場合は問題として記録
      if (!fileCheck.checks.errorHandling.found) {
        fileCheck.issues.push('明示的なエラーハンドリングが見つかりません。例外処理を追加してください。');
        issuesCount++;
      }
      
      // 機密データのログ出力がある場合は問題として記録
      if (fileCheck.checks.sensitiveDataLogging.found) {
        fileCheck.issues.push('コンソールログが検出されました。機密情報が漏洩する可能性があります。');
        issuesCount++;
      }
      
      results.push(fileCheck);
    }
    
    return {
      apiFilesCount: apiFiles.length,
      issuesCount: issuesCount,
      results: results
    };
  } catch (error) {
    log.error(`APIセキュリティチェック中にエラーが発生しました: ${error}`);
    return { error: error.message };
  }
}

/**
 * 環境変数の使用状況をチェック
 */
function checkEnvVariableUsage() {
  log.info('環境変数の使用状況をチェックします...');
  
  try {
    // .env.exampleファイルが存在するか確認
    const envExampleExists = fs.existsSync(path.join(process.cwd(), '.env.example'));
    
    // .envファイルが.gitignoreに含まれているか確認
    let envInGitignore = false;
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    
    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      envInGitignore = /^\.env$/m.test(gitignoreContent);
    }
    
    const issues = [];
    
    if (!envExampleExists) {
      issues.push('.env.exampleファイルが見つかりません。環境変数の設定例を提供してください。');
    }
    
    if (!envInGitignore) {
      issues.push('.envファイルが.gitignoreに含まれていない可能性があります。機密情報を保護するために追加してください。');
    }
    
    return {
      envExampleExists,
      envInGitignore,
      issues
    };
  } catch (error) {
    log.error(`環境変数の使用状況チェック中にエラーが発生しました: ${error}`);
    return { error: error.message };
  }
}

/**
 * レポートの保存
 */
function saveReport(report) {
  try {
    ensureReportDir();
    
    const reportData = JSON.stringify(report, null, 2);
    fs.writeFileSync(REPORT_FILE, reportData);
    
    log.success(`セキュリティチェックレポートを保存しました: ${REPORT_FILE}`);
  } catch (error) {
    log.error(`レポート保存中にエラーが発生しました: ${error}`);
  }
}

/**
 * メイン実行関数
 */
async function runApiSecurityCheck() {
  log.info('APIセキュリティチェックを開始します...');
  
  try {
    // APIルートのセキュリティチェック
    const apiSecurityResults = await checkApiRouteSecurity();
    
    // 環境変数のチェック
    const envVarResults = checkEnvVariableUsage();
    
    // レポートの作成
    const report = {
      timestamp: new Date().toISOString(),
      apiSecurity: apiSecurityResults,
      environmentVariables: envVarResults,
      summary: {
        apiFilesChecked: apiSecurityResults.apiFilesCount || 0,
        totalIssuesFound: (apiSecurityResults.issuesCount || 0) + (envVarResults.issues?.length || 0)
      }
    };
    
    // レポートの保存
    saveReport(report);
    
    if (report.summary.totalIssuesFound > 0) {
      log.warning(`セキュリティチェックの結果、${report.summary.totalIssuesFound}件の問題が見つかりました。`);
    } else {
      log.success('セキュリティチェックの結果、問題は見つかりませんでした。');
    }
    
    // 問題があれば詳細を表示
    if (apiSecurityResults.results) {
      for (const result of apiSecurityResults.results) {
        if (result.issues && result.issues.length > 0) {
          log.warning(`ファイル ${result.file} に問題が見つかりました:`);
          result.issues.forEach(issue => log.warning(`- ${issue}`));
        }
      }
    }
    
    if (envVarResults.issues && envVarResults.issues.length > 0) {
      log.warning('環境変数に関する問題が見つかりました:');
      envVarResults.issues.forEach(issue => log.warning(`- ${issue}`));
    }
    
    log.info('APIセキュリティチェックが完了しました。');
  } catch (error) {
    log.error(`セキュリティチェック中に致命的なエラーが発生しました: ${error}`);
  }
}

// スクリプトが直接実行された場合にチェックを実行
if (require.main === module) {
  runApiSecurityCheck()
    .catch(error => {
      log.error(`予期しないエラーが発生しました: ${error}`);
      process.exit(1);
    });
} 