'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChangeEvent, FormEvent } from 'react';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    passwordConfirm: '',
    // storeIdは省略し、サーバー側でデフォルト値を使用する
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // パスワード確認
    if (formData.password !== formData.passwordConfirm) {
      setError('パスワードが一致しません');
      setLoading(false);
      return;
    }

    try {
      console.log('登録フォーム: 送信開始', { 
        name: formData.name, 
        email: formData.email,
        phone: formData.phone || ''
      });
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || '',
          password: formData.password,
          // storeIdは省略
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || 'アカウント作成に失敗しました';
        console.error('登録エラー詳細:', data.details || '詳細なし');
        throw new Error(errorMsg);
      }

      console.log('登録フォーム: 登録成功');
      // 成功
      setSuccess(true);
      
      // 3秒後にログインページへリダイレクト
      setTimeout(() => {
        router.push('/login');
      }, 3000);
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'アカウント作成に失敗しました';
      setError(errorMessage);
      console.error('エラー詳細:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-8 bg-card rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center mb-6">新規登録</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            アカウントが正常に作成されました。ログインページにリダイレクトします...
          </div>
        )}
        
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium">
              お名前
            </label>
            <input
              id="name"
              type="text"
              placeholder="山田 太郎"
              className="w-full p-2 border rounded-md"
              required
              value={formData.name}
              onChange={handleChange}
              disabled={loading || success}
              autoComplete="name"
            />
          </div>
          
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
              disabled={loading || success}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-medium">
              電話番号
            </label>
            <input
              id="phone"
              type="tel"
              placeholder="090-1234-5678"
              className="w-full p-2 border rounded-md"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading || success}
              autoComplete="tel"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              className="w-full p-2 border rounded-md"
              required
              value={formData.password}
              onChange={handleChange}
              disabled={loading || success}
            />
            <p className="text-xs text-muted-foreground">
              8文字以上で、英字・数字を含めてください
            </p>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="passwordConfirm" className="block text-sm font-medium">
              パスワード（確認）
            </label>
            <input
              id="passwordConfirm"
              type="password"
              className="w-full p-2 border rounded-md"
              required
              value={formData.passwordConfirm}
              onChange={handleChange}
              disabled={loading || success}
              autoComplete="new-password"
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90 transition"
            disabled={loading || success}
          >
            {loading ? '処理中...' : '登録する'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm">
          すでにアカウントをお持ちの場合は
          <Link href="/login" className="text-primary hover:underline ml-1">
            ログイン
          </Link>
        </div>
      </div>
    </div>
  );
} 