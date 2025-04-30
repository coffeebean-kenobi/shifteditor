import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/auth-options";
import { v2 as cloudinary } from "cloudinary";

// Cloudinaryの設定
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// 設定値のログ出力 (APIキーは部分的にマスク)
console.log("Cloudinary設定:", {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKeyMasked: process.env.CLOUDINARY_API_KEY ? `${process.env.CLOUDINARY_API_KEY.substring(0, 4)}...${process.env.CLOUDINARY_API_KEY.substring(process.env.CLOUDINARY_API_KEY.length - 4)}` : undefined,
  hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    // セッションから認証ユーザーを取得
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "認証されていません" },
        { status: 401 }
      );
    }

    console.log("プロフィール画像アップロード開始:", { userId: session.user.id });

    // フォームデータを取得
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      console.log("画像ファイルなし");
      return NextResponse.json(
        { error: "画像ファイルがアップロードされていません" },
        { status: 400 }
      );
    }

    console.log("アップロードファイル情報:", { 
      type: file.type,
      size: file.size,
      name: file.name
    });

    // ファイルタイプのチェック
    if (!file.type.startsWith("image/")) {
      console.log("不正なファイルタイプ:", file.type);
      return NextResponse.json(
        { error: "アップロードされたファイルは画像である必要があります" },
        { status: 400 }
      );
    }

    // ファイルサイズチェック (5MB以下)
    if (file.size > 5 * 1024 * 1024) {
      console.log("ファイルサイズ超過:", file.size);
      return NextResponse.json(
        { error: "画像サイズは5MB以下である必要があります" },
        { status: 400 }
      );
    }

    // バッファに変換
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Base64エンコード
    const base64Data = buffer.toString("base64");
    const fileType = file.type;
    const dataURI = `data:${fileType};base64,${base64Data}`;
    
    console.log("Cloudinaryアップロード準備完了");

    // Cloudinaryにアップロード
    try {
      const result = await new Promise<any>((resolve, reject) => {
        const uploadOptions = {
          folder: "profiles",
          public_id: `user_${session.user.id}`,
          overwrite: true,
          transformation: [
            { width: 400, height: 400, crop: "fill", gravity: "face" },
          ],
        };
        
        console.log("Cloudinaryアップロードオプション:", uploadOptions);
        
        cloudinary.uploader.upload(
          dataURI,
          uploadOptions,
          (error, result) => {
            if (error) {
              console.error("Cloudinaryアップロードエラー:", error);
              reject(error);
            } else {
              console.log("Cloudinaryアップロード成功:", { 
                publicId: result.public_id,
                url: result.secure_url,
                format: result.format,
                resourceType: result.resource_type
              });
              resolve(result);
            }
          }
        );
      });

      return NextResponse.json({
        message: "画像がアップロードされました",
        url: result.secure_url,
      });
    } catch (cloudinaryError) {
      console.error("Cloudinaryエラー詳細:", cloudinaryError);
      return NextResponse.json(
        { 
          error: "Cloudinaryへの画像アップロードに失敗しました", 
          details: cloudinaryError instanceof Error ? cloudinaryError.message : String(cloudinaryError)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("画像アップロード処理エラー:", error);
    return NextResponse.json(
      { 
        error: "画像のアップロードに失敗しました", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 