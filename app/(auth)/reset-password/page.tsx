import Link from 'next/link';

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-8 bg-card rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center mb-6">パスワードのリセット</h1>
        
        <p className="mb-6 text-center text-muted-foreground">
          登録時のメールアドレスを入力してください。パスワード再設定用のリンクをお送りします。
        </p>
        
        <form className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              placeholder="email@example.com"
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90 transition"
          >
            リセットリンクを送信
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm">
          <Link href="/login" className="text-primary hover:underline">
            ログインページに戻る
          </Link>
        </div>
      </div>
    </div>
  );
} 