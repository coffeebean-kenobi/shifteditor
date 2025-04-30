'use client';

import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Role = 'ADMIN' | 'STAFF';

type Staff = {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string | null;
  createdAt: Date;
};

type StaffDetailModalProps = {
  staff: Staff;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (staff: Staff) => void;
};

export default function StaffDetailModal({ 
  staff, 
  isOpen, 
  onClose, 
  onUpdate 
}: StaffDetailModalProps) {
  const [formData, setFormData] = useState<Staff>({...staff});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '名前は必須です';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'メールアドレスは必須です';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }
    
    if (formData.phone && !/^[0-9-+\s]+$/.test(formData.phone)) {
      newErrors.phone = '有効な電話番号を入力してください';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onUpdate(formData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-black/25 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-auto overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium">スタッフ詳細</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">名前</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">電話番号</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">役割</Label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="ADMIN">管理者</option>
                <option value="STAFF">スタッフ</option>
              </select>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                キャンセル
              </Button>
              <Button type="submit">
                更新
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  );
} 