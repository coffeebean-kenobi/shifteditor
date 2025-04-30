import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

type ActivityType = 
  | 'SHIFT_CREATED' 
  | 'SHIFT_UPDATED' 
  | 'STAFF_ADDED' 
  | 'STAFF_UPDATED'
  | 'REQUEST_APPROVED'
  | 'REQUEST_REJECTED'
  | 'ATTENDANCE_RECORDED';

interface Activity {
  id: string;
  type: ActivityType;
  message: string;
  userId: string;
  userName: string;
  createdAt: Date;
}

interface ActivityFeedProps {
  activities: Activity[];
}

const getActivityIcon = (type: ActivityType) => {
  switch(type) {
    case 'SHIFT_CREATED':
    case 'SHIFT_UPDATED':
      return '📅';
    case 'STAFF_ADDED':
    case 'STAFF_UPDATED':
      return '👤';
    case 'REQUEST_APPROVED':
      return '✅';
    case 'REQUEST_REJECTED':
      return '❌';
    case 'ATTENDANCE_RECORDED':
      return '⏱️';
    default:
      return '🔔';
  }
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>最近のアクティビティ</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {activities.length > 0 ? (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{activity.userName}</p>
                    <time className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.createdAt), { 
                        addSuffix: true,
                        locale: ja
                      })}
                    </time>
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.message}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-4">
              最近のアクティビティはありません
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 