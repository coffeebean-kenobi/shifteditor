import { prisma } from '@/lib/prisma';
import { formatISO, addHours } from 'date-fns';
import nodemailer from 'nodemailer';

// 通知タイプの定義
export enum NotificationType {
  SHIFT_CONFIRMED = 'SHIFT_CONFIRMED',
  SHIFT_CHANGED = 'SHIFT_CHANGED',
  REQUEST_APPROVED = 'REQUEST_APPROVED',
  REQUEST_REJECTED = 'REQUEST_REJECTED',
  SHIFT_REMINDER = 'SHIFT_REMINDER',
  SYSTEM_NOTIFICATION = 'SYSTEM_NOTIFICATION',
  ADMIN_MESSAGE = 'ADMIN_MESSAGE',
}

// 通知作成パラメータ
interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedId?: string;
  link?: string;
}

// メール送信パラメータ
interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * 通知を作成する関数
 * @param params 通知パラメータ
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    // 通知をデータベースに保存
    return await prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        relatedId: params.relatedId,
        link: params.link,
        isRead: false,
      },
    });
  } catch (error) {
    console.error('通知の作成に失敗しました:', error);
    throw error;
  }
}

/**
 * メール通知を送信する関数
 * @param params メール送信パラメータ
 */
export async function sendEmail(params: SendEmailParams) {
  try {
    // 環境変数からSMTP設定を取得
    const smtpHost = process.env.SMTP_HOST || '';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER || '';
    const smtpPass = process.env.SMTP_PASS || '';
    const smtpFrom = process.env.SMTP_FROM || 'no-reply@shiftsystem.example.com';

    // SMTPトランスポートを作成
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // メール送信
    await transporter.sendMail({
      from: smtpFrom,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html || params.text,
    });
  } catch (error) {
    console.error('メール送信に失敗しました:', error);
    // メール送信の失敗はアプリケーションを停止させないように例外をスローしない
  }
}

/**
 * ユーザーと通知タイプに基づいて通知設定を取得する関数
 * @param userId ユーザーID
 * @param type 通知タイプ
 */
export async function getUserNotificationSettings(userId: string, type: NotificationType) {
  // ユーザーの通知設定を取得
  const preference = await prisma.notificationPreference.findFirst({
    where: {
      userId: userId,
      type: type,
    },
  });

  // ユーザー情報を取得
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      store: {
        select: {
          settings: {
            select: {
              emailNotifications: true,
              pushNotifications: true,
            }
          }
        }
      }
    }
  });

  // ストア設定が見つからない場合はデフォルト値を使用
  const emailEnabled = user?.store?.settings?.emailNotifications ?? true;
  const pushEnabled = user?.store?.settings?.pushNotifications ?? false;

  // 設定が見つかれば使用、なければデフォルト値を使用
  return {
    email: preference ? preference.email : emailEnabled,
    push: preference ? preference.push : pushEnabled,
    inApp: preference ? preference.inApp : true,
    userEmail: user?.email
  };
}

/**
 * 通知を送信する関数（アプリ内、メール、プッシュ通知）
 * @param params 通知パラメータ
 */
export async function sendNotification(params: CreateNotificationParams) {
  try {
    // ユーザーの通知設定を取得
    const settings = await getUserNotificationSettings(params.userId, params.type);

    // アプリ内通知が有効な場合
    if (settings.inApp) {
      await createNotification(params);
    }

    // メール通知が有効で、メールアドレスが存在する場合
    if (settings.email && settings.userEmail) {
      await sendEmail({
        to: settings.userEmail,
        subject: params.title,
        text: params.message,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4a5568;">${params.title}</h2>
            <p style="color: #4a5568; font-size: 16px;">${params.message}</p>
            ${params.link ? `<p><a href="${params.link}" style="display: inline-block; background-color: #4299e1; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">詳細を確認</a></p>` : ''}
            <p style="color: #718096; font-size: 14px; margin-top: 20px;">
              このメールは自動送信されています。返信はできません。
            </p>
          </div>
        `,
      });
    }

    // プッシュ通知の実装はここに追加（Web Push API などを使用）
    if (settings.push) {
      // TODO: プッシュ通知の実装
      console.log('プッシュ通知は現在実装中です');
    }
  } catch (error) {
    console.error('通知の送信に失敗しました:', error);
    // 通知送信の失敗はアプリケーションを停止させないように例外をスローしない
  }
}

/**
 * シフト確定通知を送信する関数
 * @param shiftId シフトID
 */
export async function sendShiftConfirmedNotification(shiftId: string) {
  try {
    // シフト情報を取得
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        user: true,
      },
    });

    if (!shift) {
      throw new Error('シフトが見つかりません');
    }

    // 日付をフォーマット（例: 2023年4月1日 9:00-17:00）
    const startTime = new Date(shift.startTime);
    const endTime = new Date(shift.endTime);
    const formattedDate = `${startTime.getFullYear()}年${startTime.getMonth() + 1}月${startTime.getDate()}日`;
    const formattedTime = `${startTime.getHours()}:${startTime.getMinutes().toString().padStart(2, '0')}-${endTime.getHours()}:${endTime.getMinutes().toString().padStart(2, '0')}`;

    // 通知を送信
    await sendNotification({
      userId: shift.userId,
      title: 'シフトが確定しました',
      message: `${formattedDate} ${formattedTime}のシフトが確定しました。`,
      type: NotificationType.SHIFT_CONFIRMED,
      relatedId: shiftId,
      link: `/shifts/${shiftId}`,
    });
  } catch (error) {
    console.error('シフト確定通知の送信に失敗しました:', error);
  }
}

/**
 * シフト変更通知を送信する関数
 * @param shiftId シフトID
 * @param oldStartTime 以前の開始時間
 * @param oldEndTime 以前の終了時間
 */
export async function sendShiftChangedNotification(shiftId: string, oldStartTime: Date, oldEndTime: Date) {
  try {
    // シフト情報を取得
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        user: true,
      },
    });

    if (!shift) {
      throw new Error('シフトが見つかりません');
    }

    // 新しい日付をフォーマット
    const newStartTime = new Date(shift.startTime);
    const newEndTime = new Date(shift.endTime);
    const formattedNewDate = `${newStartTime.getFullYear()}年${newStartTime.getMonth() + 1}月${newStartTime.getDate()}日`;
    const formattedNewTime = `${newStartTime.getHours()}:${newStartTime.getMinutes().toString().padStart(2, '0')}-${newEndTime.getHours()}:${newEndTime.getMinutes().toString().padStart(2, '0')}`;

    // 以前の日付をフォーマット
    const formattedOldDate = `${oldStartTime.getFullYear()}年${oldStartTime.getMonth() + 1}月${oldStartTime.getDate()}日`;
    const formattedOldTime = `${oldStartTime.getHours()}:${oldStartTime.getMinutes().toString().padStart(2, '0')}-${oldEndTime.getHours()}:${oldEndTime.getMinutes().toString().padStart(2, '0')}`;

    // 通知を送信
    await sendNotification({
      userId: shift.userId,
      title: 'シフトが変更されました',
      message: `シフトが変更されました。\n以前: ${formattedOldDate} ${formattedOldTime}\n新規: ${formattedNewDate} ${formattedNewTime}`,
      type: NotificationType.SHIFT_CHANGED,
      relatedId: shiftId,
      link: `/shifts/${shiftId}`,
    });
  } catch (error) {
    console.error('シフト変更通知の送信に失敗しました:', error);
  }
}

/**
 * シフト申請結果通知を送信する関数
 * @param requestId シフト申請ID
 * @param isApproved 承認されたかどうか
 * @param reason 拒否理由（拒否された場合）
 */
export async function sendShiftRequestResultNotification(requestId: string, isApproved: boolean, reason?: string) {
  try {
    // シフト申請情報を取得
    const request = await prisma.shiftRequest.findUnique({
      where: { id: requestId },
      include: {
        user: true,
      },
    });

    if (!request) {
      throw new Error('シフト申請が見つかりません');
    }

    // 日付をフォーマット
    const startTime = new Date(request.startTime);
    const endTime = new Date(request.endTime);
    const formattedDate = `${startTime.getFullYear()}年${startTime.getMonth() + 1}月${startTime.getDate()}日`;
    const formattedTime = `${startTime.getHours()}:${startTime.getMinutes().toString().padStart(2, '0')}-${endTime.getHours()}:${endTime.getMinutes().toString().padStart(2, '0')}`;

    if (isApproved) {
      // 承認通知を送信
      await sendNotification({
        userId: request.userId,
        title: 'シフト申請が承認されました',
        message: `${formattedDate} ${formattedTime}のシフト申請が承認されました。`,
        type: NotificationType.REQUEST_APPROVED,
        relatedId: requestId,
        link: `/shifts`,
      });
    } else {
      // 拒否通知を送信
      await sendNotification({
        userId: request.userId,
        title: 'シフト申請が拒否されました',
        message: `${formattedDate} ${formattedTime}のシフト申請が拒否されました。${reason ? `\n理由: ${reason}` : ''}`,
        type: NotificationType.REQUEST_REJECTED,
        relatedId: requestId,
        link: `/shifts`,
      });
    }
  } catch (error) {
    console.error('シフト申請結果通知の送信に失敗しました:', error);
  }
}

/**
 * 出勤リマインダー通知を送信する関数
 * 実際の運用ではcronジョブなどで定期的に実行
 */
export async function sendShiftReminders() {
  try {
    // 現在時刻から2時間後にシフトが開始するユーザーを検索
    const now = new Date();
    const reminderTime = addHours(now, 2);
    
    // 検索条件：現在時刻から2時間後～2時間15分後に開始するシフト
    const upcomingShifts = await prisma.shift.findMany({
      where: {
        startTime: {
          gte: reminderTime,
          lt: addHours(reminderTime, 0.25), // 15分の範囲で検索
        },
        status: 'SCHEDULED',
      },
      include: {
        user: true,
      },
    });

    // 各シフトに対してリマインダーを送信
    for (const shift of upcomingShifts) {
      const startTime = new Date(shift.startTime);
      const formattedTime = `${startTime.getHours()}:${startTime.getMinutes().toString().padStart(2, '0')}`;

      await sendNotification({
        userId: shift.userId,
        title: '間もなくシフトが始まります',
        message: `本日${formattedTime}からのシフトが間もなく始まります。`,
        type: NotificationType.SHIFT_REMINDER,
        relatedId: shift.id,
        link: `/shifts/${shift.id}`,
      });
    }

    return upcomingShifts.length; // 送信した通知の数を返す
  } catch (error) {
    console.error('シフトリマインダーの送信に失敗しました:', error);
    return 0;
  }
} 