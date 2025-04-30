'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function BackupRestore() {
  const [isLoading, setIsLoading] = useState(false);
  const [backupData, setBackupData] = useState<string | null>(null);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);

  const handleBackup = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/settings/backup');
      
      if (!response.ok) {
        throw new Error('バックアップの作成に失敗しました');
      }
      
      const data = await response.json();
      
      // JSONデータをBlobに変換
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      
      // ダウンロード用のリンクを作成
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // ファイル名を日付を含めて設定
      const date = new Date().toISOString().split('T')[0];
      link.download = `store_backup_${date}.json`;
      
      // リンクをクリックしてダウンロード開始
      document.body.appendChild(link);
      link.click();
      
      // 不要になったオブジェクトを解放
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      toast.success('バックアップを作成しました');
    } catch (error) {
      console.error('バックアップエラー:', error);
      toast.error('バックアップの作成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setRestoreFile(files[0]);
    }
  };

  const handleOpenRestoreDialog = () => {
    setIsRestoreDialogOpen(true);
  };

  const handleCloseRestoreDialog = () => {
    setIsRestoreDialogOpen(false);
    setRestoreFile(null);
  };

  const handleRestore = async () => {
    if (!restoreFile) return;

    try {
      setIsLoading(true);
      
      // ファイルを読み込む
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          
          // バックアップデータをAPIに送信
          const response = await fetch('/api/settings/backup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });
          
          if (!response.ok) {
            throw new Error('リストアに失敗しました');
          }
          
          toast.success('設定をリストアしました');
          handleCloseRestoreDialog();
        } catch (error) {
          console.error('リストアエラー:', error);
          toast.error('リストアに失敗しました');
        } finally {
          setIsLoading(false);
        }
      };
      
      reader.onerror = () => {
        toast.error('ファイルの読み込みに失敗しました');
        setIsLoading(false);
      };
      
      reader.readAsText(restoreFile);
    } catch (error) {
      console.error('リストアエラー:', error);
      toast.error('リストアに失敗しました');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 border rounded-lg bg-white">
        <h3 className="text-lg font-medium mb-2">データバックアップ</h3>
        <p className="text-sm text-gray-500 mb-4">
          現在のシステム設定とデータをJSONファイルとしてエクスポートします。
          このバックアップファイルは、設定の復元に使用できます。
        </p>
        <Button 
          onClick={handleBackup}
          disabled={isLoading}
          className="w-full md:w-auto"
        >
          {isLoading ? 'バックアップ中...' : 'バックアップを作成'}
        </Button>
      </div>

      <div className="p-6 border rounded-lg bg-white">
        <h3 className="text-lg font-medium mb-2">データリストア</h3>
        <p className="text-sm text-gray-500 mb-4">
          以前作成したバックアップファイルから設定を復元します。
          <span className="text-amber-600 font-medium">注意: 現在の設定は上書きされます。</span>
        </p>
        <Button 
          onClick={handleOpenRestoreDialog}
          variant="outline"
          className="w-full md:w-auto"
        >
          リストアを開始
        </Button>
      </div>

      <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>バックアップからリストア</DialogTitle>
            <DialogDescription>
              バックアップファイルをアップロードして設定を復元します。
              現在の設定は上書きされますのでご注意ください。
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex flex-col space-y-2">
              <label htmlFor="backup-file" className="text-sm font-medium">
                バックアップファイル
              </label>
              <input
                id="backup-file"
                type="file"
                accept=".json"
                onChange={handleFileChange}
                disabled={isLoading}
                className="border p-2 rounded"
              />
              <p className="text-xs text-gray-500">
                .json形式のバックアップファイルを選択してください
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={handleCloseRestoreDialog}
              disabled={isLoading}
            >
              キャンセル
            </Button>
            <Button 
              onClick={handleRestore}
              disabled={!restoreFile || isLoading}
            >
              {isLoading ? 'リストア中...' : 'リストア実行'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 