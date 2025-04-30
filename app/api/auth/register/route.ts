import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { z } from "zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

// ユーザー登録のバリデーションスキーマ
const registerSchema = z.object({
  name: z.string().min(1, "お名前は必須です"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上である必要があります"),
  phone: z.string().optional(),
  storeId: z.string().optional() // storeIdをオプショナルに変更
});

// サーバーエラーレスポンスを作成する関数
const createErrorResponse = (message: string, details?: any, status = 500) => {
  console.error(`登録API エラー - ${message}:`, details);
  return NextResponse.json(
    { 
      error: message, 
      details: details instanceof Error ? details.message : String(details || "詳細なし") 
    },
    { status }
  );
};

export async function POST(req: Request) {
  try {
    console.log('登録API: リクエスト開始');
    
    // リクエストボディの解析
    let body;
    try {
      body = await req.json();
      console.log('登録API: リクエストボディ', { ...body, password: '***' });
    } catch (parseError) {
      return createErrorResponse(
        "リクエストの解析に失敗しました", 
        parseError, 
        400
      );
    }
    
    // バリデーション
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      console.log('登録API: バリデーションエラー', result.error.format());
      return NextResponse.json(
        { error: "入力内容に問題があります", details: result.error.format() },
        { status: 400 }
      );
    }
    
    // storeIdがない場合は空文字列を設定
    const { name, email, password, phone } = result.data;
    const storeId = result.data.storeId || '';
    
    console.log('登録API: バリデーション成功', { email, name, phone, storeId: storeId || 'デフォルト値を使用' });
    
    // データベース接続チェック
    try {
      await prisma.$connect();
      console.log('登録API: データベース接続成功');
    } catch (dbConnectError) {
      return createErrorResponse(
        "データベースへの接続に失敗しました", 
        dbConnectError
      );
    }
    
    try {
      // メールアドレスの重複チェック
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        console.log('登録API: メールアドレス重複', { email });
        return NextResponse.json(
          { error: "このメールアドレスは既に使用されています" },
          { status: 409 }
        );
      }
      
      // デフォルトの店舗を作成または検索
      console.log('登録API: 店舗の検索/作成開始');
      let targetStoreId = storeId;
      
      if (!targetStoreId) {
        try {
          // デフォルト店舗を検索
          const defaultStore = await prisma.store.findFirst({
            where: { name: "テスト店舗" }
          });
          
          if (defaultStore) {
            console.log('登録API: デフォルト店舗が見つかりました', { storeId: defaultStore.id });
            targetStoreId = defaultStore.id;
          } else {
            // デフォルト店舗がなければ作成
            try {
              const newStore = await prisma.store.create({
                data: {
                  name: "テスト店舗",
                  address: "東京都渋谷区1-1-1",
                  phone: "03-1234-5678",
                  businessHours: {
                    monday: { open: "09:00", close: "18:00" },
                    tuesday: { open: "09:00", close: "18:00" },
                    wednesday: { open: "09:00", close: "18:00" },
                    thursday: { open: "09:00", close: "18:00" },
                    friday: { open: "09:00", close: "18:00" },
                    saturday: { open: "10:00", close: "17:00" },
                    sunday: { open: "10:00", close: "17:00" }
                  }
                }
              });
              console.log('登録API: 新しい店舗を作成しました', { storeId: newStore.id });
              targetStoreId = newStore.id;
            } catch (storeCreateError) {
              return createErrorResponse(
                "デフォルト店舗の作成に失敗しました", 
                storeCreateError
              );
            }
          }
        } catch (storeFindError) {
          return createErrorResponse(
            "店舗の検索中にエラーが発生しました", 
            storeFindError
          );
        }
      }
      
      if (!targetStoreId) {
        return createErrorResponse(
          "有効な店舗IDが見つかりませんでした",
          null,
          400
        );
      }
      
      // パスワードハッシュ化
      console.log('登録API: パスワードのハッシュ化開始');
      let hashedPassword;
      try {
        hashedPassword = await hash(password, 10);
        console.log('登録API: パスワードのハッシュ化完了');
      } catch (hashError) {
        return createErrorResponse(
          "パスワードの暗号化に失敗しました", 
          hashError
        );
      }
      
      // ユーザー作成
      try {
        console.log('登録API: ユーザー作成開始', { email, name, storeId: targetStoreId });
        const user = await prisma.user.create({
          data: {
            name,
            email,
            passwordHash: hashedPassword,
            phone,
            role: "STAFF",
            storeId: targetStoreId
          }
        });
        
        console.log('登録API: ユーザー作成成功', { userId: user.id });
        
        // パスワードハッシュを除外した安全なユーザー情報を返す
        const safeUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          storeId: user.storeId,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        };
        
        return NextResponse.json(
          { message: "ユーザーが正常に登録されました", user: safeUser },
          { status: 201 }
        );
      } catch (userCreateError) {
        // Prismaの特定のエラーをより詳細に処理
        if (userCreateError instanceof PrismaClientKnownRequestError) {
          if (userCreateError.code === 'P2002') {
            return createErrorResponse(
              "このメールアドレスは既に使用されています",
              userCreateError,
              409
            );
          } else if (userCreateError.code === 'P2003') {
            return createErrorResponse(
              "関連する店舗が見つかりません。有効な店舗IDを指定してください",
              userCreateError,
              400
            );
          }
        }
        
        return createErrorResponse(
          "ユーザーの作成に失敗しました", 
          userCreateError
        );
      }
    } catch (dbError) {
      return createErrorResponse(
        "データベース処理中にエラーが発生しました", 
        dbError
      );
    } finally {
      // 接続を閉じる
      await prisma.$disconnect();
      console.log('登録API: データベース接続を閉じました');
    }
  } catch (error) {
    console.error("ユーザー登録エラー（予期しない例外）:", error);
    return NextResponse.json(
      { 
        error: "予期しないエラーが発生しました", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 