import { PrismaClient } from "@prisma/client";

// PrismaClientのグローバルインスタンスを作成
// 開発環境では複数のインスタンスが作成されないようにする
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

// 初回接続時のエラーハンドリングを追加
if (!global.prisma) {
  prisma.$connect()
    .then(() => {
      console.log('Prisma: データベース接続成功');
    })
    .catch((e: Error) => {
      console.error('Prisma: データベース接続エラー', e);
    });
}

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
} 