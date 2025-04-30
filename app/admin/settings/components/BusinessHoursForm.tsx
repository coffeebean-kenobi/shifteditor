'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface DayBusinessHours {
  open: string;
  close: string;
  isOpen: boolean;
}

interface BusinessHours {
  monday: DayBusinessHours;
  tuesday: DayBusinessHours;
  wednesday: DayBusinessHours;
  thursday: DayBusinessHours;
  friday: DayBusinessHours;
  saturday: DayBusinessHours;
  sunday: DayBusinessHours;
}

interface BusinessHoursFormProps {
  businessHours: BusinessHours;
  onSave: (businessHours: BusinessHours) => void;
}

const dayNames = {
  monday: '月曜日',
  tuesday: '火曜日',
  wednesday: '水曜日',
  thursday: '木曜日',
  friday: '金曜日',
  saturday: '土曜日',
  sunday: '日曜日',
} as const;

type DayKey = keyof typeof dayNames;

export default function BusinessHoursForm({ businessHours, onSave }: BusinessHoursFormProps) {
  const [hours, setHours] = useState<BusinessHours>(businessHours);

  const handleDayChange = (day: DayKey, field: keyof DayBusinessHours, value: string | boolean) => {
    setHours({
      ...hours,
      [day]: {
        ...hours[day],
        [field]: value,
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(hours);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6">
        {Object.entries(dayNames).map(([day, label]) => {
          const typedDay = day as DayKey;
          const dayData = hours[typedDay];

          return (
            <div key={day} className="flex items-center justify-between p-4 border rounded-lg bg-white">
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id={`${day}-toggle`}
                    checked={dayData.isOpen}
                    onCheckedChange={(checked) => handleDayChange(typedDay, 'isOpen', checked)}
                  />
                  <Label htmlFor={`${day}-toggle`} className="font-medium w-20">{label}</Label>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col">
                    <Label htmlFor={`${day}-open`} className="mb-1 text-sm">営業開始</Label>
                    <Input
                      id={`${day}-open`}
                      type="time"
                      value={dayData.open}
                      onChange={(e) => handleDayChange(typedDay, 'open', e.target.value)}
                      disabled={!dayData.isOpen}
                      className="w-32"
                    />
                  </div>
                  <div className="flex flex-col">
                    <Label htmlFor={`${day}-close`} className="mb-1 text-sm">営業終了</Label>
                    <Input
                      id={`${day}-close`}
                      type="time"
                      value={dayData.close}
                      onChange={(e) => handleDayChange(typedDay, 'close', e.target.value)}
                      disabled={!dayData.isOpen}
                      className="w-32"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button type="submit">保存</Button>
      </div>
    </form>
  );
} 