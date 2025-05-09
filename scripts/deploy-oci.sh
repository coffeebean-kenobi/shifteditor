#!/bin/bash
set -e

# コンテナを停止して削除
echo "Stopping and removing containers..."
docker-compose -f docker-compose.prod.yml down

# 最新のコードをpull
echo "Pulling latest code from repository..."
git pull

# 環境変数ファイルが存在するか確認
if [ ! -f .env.production ]; then
  echo "Error: .env.production file not found"
  exit 1
fi

# イメージをビルドしてコンテナを起動
echo "Building and starting containers..."
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# データベースマイグレーションを実行
echo "Running database migrations..."
docker-compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

echo "Deployment completed successfully!" 