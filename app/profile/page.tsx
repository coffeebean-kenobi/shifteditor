"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

// セッションのユーザーに追加のプロパティを定義するための型拡張
interface CustomUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: string;
  storeId: string;
  phone?: string | null;
  imageUrl?: string | null;
}

// プロフィール編集のバリデーションスキーマ
const profileSchema = z.object({
  name: z.string().min(1, 'お名前は必須です'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  phone: z.string().optional(),
});

// パスワード変更のバリデーションスキーマ
const passwordSchema = z.object({
  currentPassword: z.string().min(1, '現在のパスワードを入力してください'),
  newPassword: z.string().min(8, 'パスワードは8文字以上である必要があります'),
  confirmPassword: z.string().min(8, 'パスワードを再入力してください'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: '新しいパスワードと確認用パスワードが一致しません',
  path: ['confirmPassword'],
});

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  // セッションのユーザーを拡張型としてキャスト
  const user = session?.user as CustomUser | undefined;

  // プロフィール編集フォーム
  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
  });

  // パスワード変更フォーム
  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // セッションからユーザー情報を取得
  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
      
      // ユーザーの画像URLがあれば設定
      if (user.imageUrl) {
        setImageUrl(user.imageUrl);
      }
    }
  }, [session, profileForm, user]);

  // 画像アップロード処理
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ファイルタイプチェック
    if (!file.type.startsWith('image/')) {
      toast.error('画像ファイルを選択してください');
      return;
    }

    // サイズチェック (5MB以下)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('画像サイズは5MB以下にしてください');
      return;
    }

    try {
      setImageLoading(true);

      const formData = new FormData();
      formData.append('file', file);

      console.log('画像アップロード開始:', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });

      const response = await fetch('/api/profile/upload-image', {
        method: 'POST',
        body: formData,
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('画像アップロードAPI エラー:', responseData);
        throw new Error(responseData.error || '画像のアップロードに失敗しました');
      }

      console.log('画像アップロード成功:', responseData);
      setImageUrl(responseData.url);
      toast.success('プロフィール画像がアップロードされました');
    } catch (error) {
      console.error('画像アップロード処理エラー:', error);
      toast.error(error instanceof Error ? error.message : '画像のアップロードに失敗しました');
    } finally {
      setImageLoading(false);
    }
  };

  // プロフィール更新処理
  const onProfileSubmit = async (data: z.infer<typeof profileSchema>) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          imageUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'プロフィールの更新に失敗しました');
      }

      const result = await response.json();
      
      // セッション更新
      await update({
        ...session,
        user: {
          ...user,
          name: data.name,
          email: data.email,
          phone: data.phone,
          imageUrl,
        },
      });

      toast.success('プロフィールが更新されました');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'プロフィールの更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // パスワード変更処理
  const onPasswordSubmit = async (data: z.infer<typeof passwordSchema>) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileForm.getValues('name'),
          email: profileForm.getValues('email'),
          phone: profileForm.getValues('phone'),
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'パスワードの変更に失敗しました');
      }

      passwordForm.reset();
      toast.success('パスワードが変更されました');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'パスワードの変更に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 認証チェック
  if (!session) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="mb-4">このページにアクセスするにはログインが必要です</p>
        <Button asChild>
          <Link href="/login">ログイン</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">プロフィール設定</h1>
      
      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>プロフィール画像</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative w-40 h-40 mb-4 overflow-hidden rounded-full border">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt="プロフィール"
                  fill
                  sizes="(max-width: 160px) 100vw, 160px"
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-muted text-muted-foreground">
                  画像なし
                </div>
              )}
            </div>
            
            <Label htmlFor="profile-image" className="cursor-pointer">
              <Button variant="outline" size="sm" disabled={imageLoading} className="w-full">
                {imageLoading ? '読み込み中...' : '画像を変更'}
              </Button>
              <Input
                id="profile-image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={imageLoading}
              />
            </Label>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="profile">
          <TabsList className="mb-4">
            <TabsTrigger value="profile">基本情報</TabsTrigger>
            <TabsTrigger value="password">パスワード変更</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>基本情報編集</CardTitle>
                <CardDescription>
                  アカウントの基本情報を更新できます
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form id="profile-form" onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">お名前</Label>
                      <Input
                        id="name"
                        placeholder="山田 太郎"
                        {...profileForm.register('name')}
                      />
                      {profileForm.formState.errors.name && (
                        <p className="text-sm text-red-500">
                          {profileForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="email">メールアドレス</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="yamada@example.com"
                        {...profileForm.register('email')}
                      />
                      {profileForm.formState.errors.email && (
                        <p className="text-sm text-red-500">
                          {profileForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="phone">電話番号</Label>
                      <Input
                        id="phone"
                        placeholder="090-1234-5678"
                        {...profileForm.register('phone')}
                      />
                      {profileForm.formState.errors.phone && (
                        <p className="text-sm text-red-500">
                          {profileForm.formState.errors.phone.message}
                        </p>
                      )}
                    </div>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  type="submit"
                  form="profile-form" 
                  disabled={loading || !profileForm.formState.isDirty}
                >
                  {loading ? '保存中...' : '保存する'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle>パスワード変更</CardTitle>
                <CardDescription>
                  安全のため、定期的にパスワードを変更することをおすすめします
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form id="password-form" onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="currentPassword">現在のパスワード</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        {...passwordForm.register('currentPassword')}
                      />
                      {passwordForm.formState.errors.currentPassword && (
                        <p className="text-sm text-red-500">
                          {passwordForm.formState.errors.currentPassword.message}
                        </p>
                      )}
                    </div>
                    
                    <Separator />
                    
                    <div className="grid gap-2">
                      <Label htmlFor="newPassword">新しいパスワード</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        {...passwordForm.register('newPassword')}
                      />
                      {passwordForm.formState.errors.newPassword && (
                        <p className="text-sm text-red-500">
                          {passwordForm.formState.errors.newPassword.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="confirmPassword">新しいパスワード（確認）</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        {...passwordForm.register('confirmPassword')}
                      />
                      {passwordForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-red-500">
                          {passwordForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  type="submit"
                  form="password-form" 
                  disabled={loading || !passwordForm.formState.isDirty}
                >
                  {loading ? '保存中...' : 'パスワードを変更'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="mt-6">
        <Link href="/dashboard" className="text-primary hover:underline">
          &larr; ダッシュボードに戻る
        </Link>
      </div>
    </div>
  );
} 