import React from 'react';
import CurrentStatus from './components/CurrentStatus';
import AttendanceHistory from './components/AttendanceHistory';

export default function AttendancePage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">勤怠記録</h1>
      
      <div className="grid gap-6">
        {/* 現在の勤務状況 */}
        <CurrentStatus />
        
        {/* 勤怠履歴 */}
        <AttendanceHistory />
      </div>
    </div>
  );
} 