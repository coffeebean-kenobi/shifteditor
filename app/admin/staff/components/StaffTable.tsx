'use client';

import React from 'react';
import { Edit, Trash, MoreHorizontal, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Role = 'ADMIN' | 'STAFF';

type Staff = {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string | null;
  createdAt: Date;
};

type StaffTableProps = {
  staff: Staff[];
  isLoading: boolean;
  onStaffSelect: (staff: Staff) => void;
};

export default function StaffTable({ staff, isLoading, onStaffSelect }: StaffTableProps) {
  // 日付フォーマット用関数
  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleDeleteClick = async (id: string) => {
    if (confirm('このスタッフを削除してもよろしいですか？')) {
      try {
        const response = await fetch(`/api/admin/staff/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          // 削除成功のフィードバック
          alert('スタッフを削除しました');
          // ここでページのリロードや状態更新などを行う
          window.location.reload();
        } else {
          alert('スタッフの削除に失敗しました');
        }
      } catch (error) {
        console.error('エラー:', error);
        alert('エラーが発生しました');
      }
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/staff/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        // 状態更新成功のフィードバック
        alert(`スタッフのステータスを${status}に変更しました`);
        // ここでページのリロードや状態更新などを行う
        window.location.reload();
      } else {
        alert('ステータスの変更に失敗しました');
      }
    } catch (error) {
      console.error('エラー:', error);
      alert('エラーが発生しました');
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">読み込み中...</div>;
  }

  if (staff.length === 0) {
    return <div className="text-center py-8">スタッフが見つかりませんでした</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border rounded-lg overflow-hidden">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名前</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">メール</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">電話番号</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">役割</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">登録日</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">アクション</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {staff.map((person) => (
            <tr key={person.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="font-medium">{person.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">{person.email}</td>
              <td className="px-6 py-4 whitespace-nowrap">{person.phone || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${person.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'}`}>
                  {person.role === 'ADMIN' ? '管理者' : 'スタッフ'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">{formatDate(person.createdAt)}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <select
                  className="border rounded px-2 py-1 text-sm"
                  defaultValue="active"
                  onChange={(e) => handleStatusChange(person.id, e.target.value)}
                >
                  <option value="active">有効</option>
                  <option value="inactive">無効</option>
                </select>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onStaffSelect(person)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Edit size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(person.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash size={16} />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 