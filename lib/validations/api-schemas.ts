/**
 * APIリクエストのバリデーションスキーマ
 * 
 * すべてのAPIエンドポイントで一貫した入力検証を行うために使用するZodスキーマを定義
 */

import { z } from 'zod';

/**
 * スタッフ作成リクエストのスキーマ
 */
export const staffCreateSchema = z.object({
  email: z.string().email({ message: '有効なメールアドレスを入力してください' }),
  name: z.string().min(2, { message: '名前は2文字以上である必要があります' }).max(50, { message: '名前は50文字以下である必要があります' }),
  role: z.enum(['ADMIN', 'STAFF'], { message: '役割は「ADMIN」または「STAFF」である必要があります' }),
  storeId: z.string().uuid({ message: '有効な店舗IDを入力してください' })
});

/**
 * シフト希望リクエストのスキーマ
 */
export const shiftRequestSchema = z.object({
  startTime: z.string().datetime({ message: '開始時間は有効な日時形式である必要があります' }),
  endTime: z.string().datetime({ message: '終了時間は有効な日時形式である必要があります' }),
  note: z.string().optional()
}).refine(data => new Date(data.startTime) < new Date(data.endTime), {
  message: '開始時間は終了時間より前である必要があります',
  path: ['startTime']
});

/**
 * ユーザーログインリクエストのスキーマ
 */
export const loginSchema = z.object({
  email: z.string().email({ message: '有効なメールアドレスを入力してください' }),
  password: z.string().min(8, { message: 'パスワードは8文字以上である必要があります' })
});

/**
 * ユーザー登録リクエストのスキーマ
 */
export const registerSchema = z.object({
  name: z.string().min(2, { message: '名前は2文字以上である必要があります' }).max(50, { message: '名前は50文字以下である必要があります' }),
  email: z.string().email({ message: '有効なメールアドレスを入力してください' }),
  password: z.string()
    .min(8, { message: 'パスワードは8文字以上である必要があります' })
    .regex(/[A-Z]/, { message: 'パスワードは少なくとも1つの大文字を含む必要があります' })
    .regex(/[a-z]/, { message: 'パスワードは少なくとも1つの小文字を含む必要があります' })
    .regex(/[0-9]/, { message: 'パスワードは少なくとも1つの数字を含む必要があります' })
    .regex(/[^A-Za-z0-9]/, { message: 'パスワードは少なくとも1つの特殊文字を含む必要があります' }),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'パスワードと確認用パスワードが一致しません',
  path: ['confirmPassword']
});

/**
 * シフト確定リクエストのスキーマ
 */
export const shiftConfirmSchema = z.object({
  shiftId: z.string().uuid({ message: '有効なシフトIDを入力してください' }),
  isConfirmed: z.boolean(),
  note: z.string().optional()
});

/**
 * 出勤記録リクエストのスキーマ
 */
export const attendanceRecordSchema = z.object({
  shiftId: z.string().uuid({ message: '有効なシフトIDを入力してください' }),
  clockInTime: z.string().datetime({ message: '出勤時間は有効な日時形式である必要があります' }).optional(),
  clockOutTime: z.string().datetime({ message: '退勤時間は有効な日時形式である必要があります' }).optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'ABSENT'], { message: 'ステータスは「PENDING」、「COMPLETED」、または「ABSENT」である必要があります' })
}).refine(
  data => !data.clockInTime || !data.clockOutTime || new Date(data.clockInTime) < new Date(data.clockOutTime),
  {
    message: '出勤時間は退勤時間より前である必要があります',
    path: ['clockInTime']
  }
); 