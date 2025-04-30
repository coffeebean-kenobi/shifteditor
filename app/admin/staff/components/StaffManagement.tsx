'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import StaffTable from './StaffTable';
import StaffDetailModal from './StaffDetailModal';
import InviteStaffModal from './InviteStaffModal';
import { Role } from '@prisma/client';

type Staff = {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string | null;
  createdAt: Date;
};

export default function StaffManagement() {
  const router = useRouter();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // APIからスタッフデータを取得
    const fetchStaff = async () => {
      try {
        const response = await fetch('/api/admin/staff');
        const data = await response.json();
        setStaff(data);
        setFilteredStaff(data);
        setIsLoading(false);
      } catch (error) {
        console.error('スタッフデータの取得に失敗しました:', error);
        setIsLoading(false);
      }
    };

    fetchStaff();
  }, []);

  useEffect(() => {
    // 検索フィルタリングの適用
    let result = staff;
    
    if (searchQuery) {
      result = result.filter(
        s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
             s.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (roleFilter) {
      result = result.filter(s => s.role === roleFilter);
    }
    
    setFilteredStaff(result);
  }, [searchQuery, roleFilter, staff]);

  const handleStaffSelect = (staff: Staff) => {
    setSelectedStaff(staff);
    setShowDetailModal(true);
  };

  const handleStaffUpdate = async (updatedStaff: Staff) => {
    try {
      const response = await fetch(`/api/admin/staff/${updatedStaff.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedStaff),
      });

      if (response.ok) {
        // 成功時はスタッフリストを更新
        setStaff(prev => 
          prev.map(s => s.id === updatedStaff.id ? updatedStaff : s)
        );
        setShowDetailModal(false);
      } else {
        console.error('スタッフの更新に失敗しました');
      }
    } catch (error) {
      console.error('エラー:', error);
    }
  };

  const handleInviteStaff = async (newStaff: Omit<Staff, 'id' | 'createdAt'>) => {
    try {
      const response = await fetch('/api/admin/staff/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStaff),
      });

      if (response.ok) {
        const createdStaff = await response.json();
        setStaff(prev => [...prev, createdStaff]);
        setShowInviteModal(false);
      } else {
        console.error('スタッフの招待に失敗しました');
      }
    } catch (error) {
      console.error('エラー:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="名前または電子メールで検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            className="border rounded px-3 py-2"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as Role | '')}
          >
            <option value="">全ての役割</option>
            <option value="ADMIN">管理者</option>
            <option value="STAFF">スタッフ</option>
          </select>
          <Button onClick={() => setShowInviteModal(true)}>
            <PlusCircle className="mr-2" size={18} />
            招待する
          </Button>
        </div>
      </div>

      <StaffTable 
        staff={filteredStaff} 
        isLoading={isLoading} 
        onStaffSelect={handleStaffSelect} 
      />

      {selectedStaff && (
        <StaffDetailModal
          staff={selectedStaff}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          onUpdate={handleStaffUpdate}
        />
      )}

      <InviteStaffModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInvite={handleInviteStaff}
      />
    </div>
  );
} 