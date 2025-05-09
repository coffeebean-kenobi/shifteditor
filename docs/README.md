# Shift Editor - アルバイトシフト管理アプリ

## プロジェクト概要

Shift Editorは、アルバイトスタッフのシフト管理を効率化するためのWebアプリケーションです。シフト希望の提出から確定、勤怠管理までをシームレスに行うことができます。管理者（店長）とスタッフそれぞれに最適化された機能を提供します。

## ドキュメント一覧

プロジェクトの詳細は以下のドキュメントを参照してください：

- [要件定義書](./要件定義.md) - 機能要件、非機能要件の詳細
- [データベース設計](./データベース設計.md) - ERモデル、テーブル定義
- [画面設計](./画面設計.md) - 各画面の仕様とモックアップ
- [ファイル設計](./ファイル設計.md) - プロジェクト構造、主要ファイル
- [インフラ構成図](./インフラ構成図.md) - システムインフラの構成
- [実装概念図](./実装概念図.md) - 主要機能の実装概念
- [コントリビューションガイド](./コントリビューションガイド.md) - 開発参加の手引き

## 開発環境のセットアップ

### 通常の開発環境

```bash
# リポジトリのクローン
git clone https://github.com/yourorganization/shift-editor.git
cd shift-editor

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env.local
# .env.localを編集して必要な環境変数を設定

# データベースの初期化
npx prisma migrate dev

# 開発サーバーの起動
npm run dev
```

### Docker開発環境

```bash
# リポジトリのクローン
git clone https://github.com/yourorganization/shift-editor.git
cd shift-editor

# 環境変数の設定
cp .env.example .env.local
# .env.localを編集（DatabaseURLはdocker-compose.ymlで設定済み）

# Docker開発環境の起動
./scripts/docker-dev.sh up

# マイグレーションの実行
./scripts/docker-dev.sh migrate
```

Docker開発環境の詳細な利用方法は[コントリビューションガイド](./コントリビューションガイド.md)を参照してください。

## 技術スタック / インフラ

| 環境 | ホスティング | 役割 |
|------|--------------|------|
| **本番** | OCI | 本番環境 |
| **開発** | Docker Compose | ローカル開発環境 |

- フロントエンド: Next.js, ShadCN UI, React Hook Form, FullCalendar
- バックエンド: Next.js API Routes, NextAuth.js, Prisma ORM
- データベース: PostgreSQL
- IaC: Terraform / OCI CLI

## ライセンス

MIT 

# セキュリティテスト

## 概要

このディレクトリには、アプリケーションのセキュリティテストに関するドキュメントが含まれています。セキュリティテストは、アプリケーションの脆弱性を特定し、改善するために実施されます。

## テスト項目

以下のセキュリティテストが実装されています：

1. **パスワードハッシュ検証テスト**
   - パスワードが正しくハッシュ化されているか
   - ハッシュ検証が正しく動作するか

2. **スーパーアドミン権限テスト**
   - スーパーアドミンユーザーが適切なドメインのメールアドレスを使用しているか
   - 権限設定が適切か

3. **API セキュリティチェック**
   - 認証チェックの有無
   - 入力バリデーションの有無
   - エラーハンドリングの確認
   - 機密データのログ出力の確認

4. **ユーザー権限監査**
   - スーパーアドミンユーザーの監査
   - 一般管理者ユーザーの監査

5. **依存関係の脆弱性スキャン**
   - npm audit による依存パッケージの脆弱性チェック

## テストの実行方法

セキュリティテストを実行するには、以下のコマンドを使用します：

```bash
# すべてのセキュリティテストを実行
npm run security-test

# または
npm run test:security
```

## テスト結果

テスト結果は `reports` ディレクトリに JSON 形式で保存されます。以下のレポートが生成されます：

- `dependency-audit-YYYY-MM-DD.json` - 依存関係の監査結果
- `user-permissions-audit-YYYY-MM-DD.json` - ユーザー権限監査結果
- `api-security-check-YYYY-MM-DD.json` - API セキュリティチェック結果

## テストスクリプト

以下のスクリプトが含まれています：

- `scripts/test-security.js` - パスワードハッシュとスーパーアドミン権限のテスト
- `scripts/audit-user-permissions.js` - ユーザー権限の監査
- `scripts/api-security-check.js` - API のセキュリティチェック
- `scripts/run-security-tests.js` - すべてのテストを実行するマスタースクリプト

## セキュリティ基準

セキュリティテストは [OWASP Top 10](https://owasp.org/www-project-top-ten/) の脆弱性カテゴリに基づいて設計されています。特に以下の項目に注意しています：

1. **認証の不備**
2. **アクセス制御の不備**
3. **機密データの露出**
4. **セキュリティの設定ミス**
5. **クロスサイトスクリプティング**

## 継続的インテグレーション

CI パイプラインでは、以下のタイミングでセキュリティテストが実行されます：

1. プルリクエスト時
2. メインブランチへのマージ時
3. リリース前

## 詳細情報

セキュリティテストに関する詳細情報は [セキュリティテスト計画](./セキュリティテスト計画.md) を参照してください。 