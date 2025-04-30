#!/bin/bash

# スクリプトのディレクトリに移動
cd "$(dirname "$0")/.."

# コマンドライン引数に基づいて実行
case "$1" in
  up)
    echo "🚀 開発環境を起動しています..."
    docker compose up -d
    echo "✅ 開発環境が起動しました！http://localhost:3001 でアクセスできます"
    ;;
    
  down)
    echo "⏹️ 開発環境を停止しています..."
    docker compose down
    echo "✅ 開発環境を停止しました"
    ;;
    
  restart)
    echo "🔄 開発環境を再起動しています..."
    docker compose restart
    echo "✅ 開発環境を再起動しました"
    ;;
    
  logs)
    echo "📋 ログを表示しています..."
    docker compose logs -f
    ;;
    
  exec)
    echo "💻 コンテナ内でコマンドを実行しています..."
    shift
    docker compose exec app "$@"
    ;;
    
  db-shell)
    echo "🗄️ データベースシェルに接続しています..."
    docker compose exec db psql -U postgres -d shift_editor
    ;;
    
  migrate)
    echo "🔄 データベースマイグレーションを実行しています..."
    docker compose exec app npx prisma migrate dev
    ;;
    
  *)
    echo "使用方法: $0 {up|down|restart|logs|exec|db-shell|migrate}"
    exit 1
    ;;
esac

exit 0 