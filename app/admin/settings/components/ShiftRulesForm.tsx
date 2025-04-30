'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ShiftRulesFormProps {
  minShiftHours: number;
  maxShiftHours: number;
  minBreakMinutes: number;
  maxWeeklyWorkHours: number;
  onSave: (settings: {
    minShiftHours: number;
    maxShiftHours: number;
    minBreakMinutes: number;
    maxWeeklyWorkHours: number;
  }) => void;
}

export default function ShiftRulesForm({
  minShiftHours,
  maxShiftHours,
  minBreakMinutes,
  maxWeeklyWorkHours,
  onSave,
}: ShiftRulesFormProps) {
  const [rules, setRules] = useState({
    minShiftHours,
    maxShiftHours,
    minBreakMinutes,
    maxWeeklyWorkHours,
  });

  const handleChange = (field: keyof typeof rules, value: string) => {
    const numValue = parseInt(value, 10) || 0;
    setRules({
      ...rules,
      [field]: numValue,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(rules);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="min-shift-hours" className="block mb-2">最小シフト時間（時間）</Label>
            <Input
              id="min-shift-hours"
              type="number"
              min="1"
              max="24"
              value={rules.minShiftHours}
              onChange={(e) => handleChange('minShiftHours', e.target.value)}
              className="w-full"
            />
            <p className="text-sm text-gray-500 mt-1">1回のシフトで最低限必要な勤務時間</p>
          </div>

          <div>
            <Label htmlFor="max-shift-hours" className="block mb-2">最大シフト時間（時間）</Label>
            <Input
              id="max-shift-hours"
              type="number"
              min={rules.minShiftHours}
              max="24"
              value={rules.maxShiftHours}
              onChange={(e) => handleChange('maxShiftHours', e.target.value)}
              className="w-full"
            />
            <p className="text-sm text-gray-500 mt-1">1回のシフトで最大勤務可能な時間</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="min-break-minutes" className="block mb-2">最小休憩時間（分）</Label>
            <Input
              id="min-break-minutes"
              type="number"
              min="0"
              max="180"
              step="5"
              value={rules.minBreakMinutes}
              onChange={(e) => handleChange('minBreakMinutes', e.target.value)}
              className="w-full"
            />
            <p className="text-sm text-gray-500 mt-1">一定時間以上の勤務での必要休憩時間</p>
          </div>

          <div>
            <Label htmlFor="max-weekly-hours" className="block mb-2">週間最大勤務時間（時間）</Label>
            <Input
              id="max-weekly-hours"
              type="number"
              min="1"
              max="168"
              value={rules.maxWeeklyWorkHours}
              onChange={(e) => handleChange('maxWeeklyWorkHours', e.target.value)}
              className="w-full"
            />
            <p className="text-sm text-gray-500 mt-1">1週間あたりの最大勤務可能時間</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit">保存</Button>
      </div>
    </form>
  );
} 