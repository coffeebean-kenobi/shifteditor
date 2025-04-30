'use client';

import Link from 'next/link';
import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // URLのエラーパラメータを確認
  useEffect(() => {
    const errorParam = searchParams?.get('error');
    if (errorParam) {
      // URLからエラーコードを取得した場合
      switch (errorParam) {
        case 'CredentialsSignin':
          setError('メールアドレスまたはパスワードが正しくありません');
          break;
        default:
          setError('ログインに失敗しました。再度お試しください');
          break;
      }
    }
  }, [searchParams]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 直接リダイレクトさせる設定
      const result = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password
      });

      if (!result) {
        throw new Error('サーバーとの通信に失敗しました');
      }

      if (result.error) {
        throw new Error(result.error === 'CredentialsSignin' 
          ? 'メールアドレスまたはパスワードが正しくありません' 
          : result.error);
      }

      // 成功したらダッシュボードへリダイレクト
      router.push('/dashboard');
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'ログインに失敗しました';
      setError(errorMessage);
      console.error('ログインエラー:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-8 bg-card rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center mb-6">ログイン</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              placeholder="email@example.com"
              autoComplete="username"
              className="w-full p-2 border rounded-md"
              required
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="w-full p-2 border rounded-md"
              required
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                checked={formData.remember}
                onChange={handleChange}
                disabled={loading}
              />
              <label htmlFor="remember" className="ml-2 block">
                ログイン状態を保存
              </label>
            </div>
            <Link href="/reset-password" className="text-primary hover:underline">
              パスワードを忘れた場合
            </Link>
          </div>
          
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90 transition"
            disabled={loading}
          >
            {loading ? '処理中...' : 'ログイン'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm">
          アカウントをお持ちでない場合は
          <Link href="/register" className="text-primary hover:underline ml-1">
            新規登録
          </Link>
        </div>
      </div>
    </div>
  );
} 