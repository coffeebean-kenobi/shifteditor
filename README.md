# Shift Editor - アルバイトシフト管理アプリ

シフト希望の提出から確定、勤怠管理までを効率化するアルバイトシフト管理システムです。

## 概要

Shift Editorは、アルバイトスタッフのシフト管理プロセスを効率化するためのWebアプリケーションです。管理者（店長）とスタッフそれぞれに最適化された機能を提供し、シフト管理の負担を軽減します。

### 主な機能

- ユーザー管理（管理者/スタッフ）
- シフト希望提出
- シフト作成・管理
- シフト確認（カレンダー表示）
- 勤怠管理（打刻・記録）

## 技術スタック

- **フロントエンド**: Next.js, ShadCN UI, React Hook Form, FullCalendar
- **バックエンド**: Next.js API Routes, NextAuth.js
- **データベース**: PostgreSQL, Prisma ORM
- **インフラ**: Docker, CI/CD, OCI

## 開発環境のセットアップ

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

## ドキュメント

プロジェクトの詳細なドキュメントは以下から確認できます：

[プロジェクトドキュメント](./docs/index.md)

以下のドキュメントが利用可能です：

- [要件定義](./docs/要件定義.md)
- [データベース設計](./docs/データベース設計.md)
- [画面設計](./docs/画面設計.md)
- [ファイル設計](./docs/ファイル設計.md)
- [インフラ構成図](./docs/インフラ構成図.md)
- [実装概念図](./docs/実装概念図.md)
- [実装計画](./docs/実装計画.md)
- [コントリビューションガイド](./docs/コントリビューションガイド.md)

## ライセンス

MIT License # shifteditor
