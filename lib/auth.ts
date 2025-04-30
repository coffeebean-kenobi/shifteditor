import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcrypt";
import { prisma } from "@/lib/prisma";
import { User } from "next-auth";
import { initializeSuperAdmin } from "./admin";

// ロールの型定義
export type UserRole = 'ADMIN' | 'STAFF';

// 権限チェック関数
export function hasRequiredRole(userRole: string | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false;
  
  // ADMIN は常に全ての権限を持つ
  if (userRole === 'ADMIN') return true;
  
  // 必要な権限とユーザーの権限が一致するか確認
  return userRole === requiredRole;
}

// 権限関連の定数
export const PERMISSIONS = {
  STAFF_MANAGEMENT: 'STAFF_MANAGEMENT',
  SHIFT_CREATION: 'SHIFT_CREATION',
  SHIFT_APPROVAL: 'SHIFT_APPROVAL',
  ATTENDANCE_MANAGEMENT: 'ATTENDANCE_MANAGEMENT',
  VIEW_REPORTS: 'VIEW_REPORTS',
  MANAGE_STORE: 'MANAGE_STORE',
  SUPER_ADMIN: 'SUPER_ADMIN',  // スーパーアドミン専用権限
} as const;

export type Permission = keyof typeof PERMISSIONS;

// 各ロールに割り当てられた権限のマップ
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    'STAFF_MANAGEMENT',
    'SHIFT_CREATION',
    'SHIFT_APPROVAL',
    'ATTENDANCE_MANAGEMENT',
    'VIEW_REPORTS',
    'MANAGE_STORE',
  ],
  STAFF: [],
};

// ユーザーが特定の権限を持っているかチェックする関数
export function hasPermission(userRole: string | undefined, permission: Permission): boolean {
  if (!userRole) return false;
  
  const rolePermissions = ROLE_PERMISSIONS[userRole as UserRole] || [];
  return rolePermissions.includes(permission);
}

// ユーザーがスーパーアドミンかどうかを確認する関数
export async function isSuperAdmin(userId: string): Promise<boolean> {
  if (!userId) return false;
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isSuperAdmin: true }
    });
    
    return !!user?.isSuperAdmin;
  } catch (error) {
    console.error('スーパーアドミン確認エラー:', error);
    return false;
  }
}

// アプリケーション用の拡張Userインターフェース
interface AppUser extends User {
  id: string;
  email: string;
  name: string;
  role: string;
  storeId: string;
  isSuperAdmin?: boolean;
}

export const authOptions: NextAuthOptions = {
  // @ts-ignore - 型定義の不一致を無視
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    // セッション有効期限を設定（8時間）
    maxAge: 8 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // @ts-ignore - 型定義の不一致を無視
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          storeId: user.storeId || '', // 必須フィールドに対応
          isSuperAdmin: user.isSuperAdmin,
        } as AppUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          role: user.role,
          storeId: (user as AppUser).storeId || '',
          isSuperAdmin: (user as AppUser).isSuperAdmin || false,
        };
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          role: token.role,
          storeId: token.storeId || '',
          isSuperAdmin: token.isSuperAdmin || false,
        },
      };
    },
  },
  events: {
    // サーバー起動時に実行されるイベント
    async signIn() {
      // 環境変数でスーパーアドミン初期化を制御
      if (process.env.INITIALIZE_SUPER_ADMIN === 'true') {
        try {
          await initializeSuperAdmin();
        } catch (error) {
          console.error('スーパーアドミン初期化エラー:', error);
        }
      }
    }
  }
}; 