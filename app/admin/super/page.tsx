'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShieldCheck, Store, Users, CalendarClock, UserPlus, DatabaseZap, Building2
} from 'lucide-react';
import { toast } from 'sonner';

interface SystemStats {
  totalUsers: number;
  adminCount: number;
  staffCount: number;
  totalStores: number;
  totalShifts: number;
  totalShiftRequests: number;
  totalAttendance: number;
}

export default function SuperAdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SystemStats | null>(null);
  
  // 新規ストア作成用のフォームデータ
  const [storeForm, setStoreForm] = useState({
    name: '',
    address: '',
    phone: ''
  });
  
  // セッションが無い場合はログインページへリダイレクト
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);
  
  // スーパーアドミン権限がない場合は通常のダッシュボードへリダイレクト
  useEffect(() => {
    if (session?.user && !(session.user as any).isSuperAdmin) {
      router.push('/admin');
    }
  }, [session, router]);
  
  // 統計情報の取得
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/super');
        if (!response.ok) {
          throw new Error('統計情報の取得に失敗しました');
        }
        
        const data = await response.json();
        setStats(data.systemStats);
      } catch (error) {
        console.error('統計情報取得エラー:', error);
        toast.error('統計情報の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };
    
    if (session?.user && (session.user as any).isSuperAdmin) {
      fetchStats();
    }
  }, [session]);
  
  // 新規ストア作成
  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/super', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'createStore',
          data: storeForm
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'ストアの作成に失敗しました');
      }
      
      const result = await response.json();
      
      // フォームをリセット
      setStoreForm({
        name: '',
        address: '',
        phone: ''
      });
      
      toast.success('ストアを作成しました');
      
      // 統計情報を更新
      const statsResponse = await fetch('/api/admin/super');
      if (statsResponse.ok) {
        const data = await statsResponse.json();
        setStats(data.systemStats);
      }
    } catch (error) {
      console.error('ストア作成エラー:', error);
      toast.error(error instanceof Error ? error.message : '不明なエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setStoreForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl">読み込み中...</div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <ShieldCheck className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">スーパーアドミンダッシュボード</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center gap-2">
              <Users className="h-5 w-5" />
              ユーザー統計
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>総ユーザー数:</span>
                <span className="font-bold">{stats?.totalUsers || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>管理者数:</span>
                <span className="font-bold">{stats?.adminCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>スタッフ数:</span>
                <span className="font-bold">{stats?.staffCount || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center gap-2">
              <Store className="h-5 w-5" />
              店舗統計
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>総店舗数:</span>
                <span className="font-bold">{stats?.totalStores || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center gap-2">
              <CalendarClock className="h-5 w-5" />
              シフト統計
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>総シフト数:</span>
                <span className="font-bold">{stats?.totalShifts || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>シフト申請数:</span>
                <span className="font-bold">{stats?.totalShiftRequests || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>勤怠記録数:</span>
                <span className="font-bold">{stats?.totalAttendance || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="stores" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stores" className="flex items-center gap-1">
            <Building2 className="h-4 w-4" />
            店舗管理
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-1">
            <UserPlus className="h-4 w-4" />
            ユーザー管理
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="stores" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>新規店舗作成</CardTitle>
              <CardDescription>システムに新しい店舗を追加します</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateStore} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">店舗名</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="例: 渋谷店"
                      value={storeForm.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">住所</Label>
                    <Input
                      id="address"
                      name="address"
                      placeholder="例: 東京都渋谷区渋谷1-1-1"
                      value={storeForm.address}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">電話番号</Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="例: 03-1234-5678"
                      value={storeForm.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? '処理中...' : '店舗を作成する'}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>データベース管理</CardTitle>
              <CardDescription>システムのメンテナンス機能</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">バックアップを作成</h3>
                    <p className="text-sm text-muted-foreground">
                      現在のデータベースのバックアップを作成します
                    </p>
                  </div>
                  <Button variant="outline" disabled>
                    <DatabaseZap className="h-4 w-4 mr-1" />
                    バックアップ
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">
              * 一部の機能は現在開発中です
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="users" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>ユーザー権限管理</CardTitle>
              <CardDescription>ユーザーの権限を変更します</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-muted-foreground">
                  この機能は現在開発中です。間もなく利用可能になります。
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 