import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-5xl w-full text-center">
        <h1 className="text-4xl font-bold mb-4">Shift Editor</h1>
        <p className="text-xl mb-8">アルバイトシフト管理アプリケーション</p>
        <p className="mb-8">シフト希望の提出から確定、勤怠管理までを効率化するアルバイトシフト管理システムです。</p>
        
        <div className="flex flex-col md:flex-row justify-center gap-4 mt-8">
          <Link 
            href="/login"
            className="bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 transition"
          >
            ログイン
          </Link>
          <Link 
            href="/register"
            className="bg-secondary text-secondary-foreground px-6 py-3 rounded-md hover:bg-secondary/90 transition"
          >
            新規登録
          </Link>
        </div>
      </div>
    </main>
  )
} 