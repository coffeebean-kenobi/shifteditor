import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// 現時点ではPrismaAdapterの互換性の問題があるため、
// @next-auth/prisma-adapterを使用。将来的に@auth/prisma-adapterに移行する予定。
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "メールアドレス", type: "email" },
        password: { label: "パスワード", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("メールアドレスとパスワードを入力してください");
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: { store: true }
          });

          if (!user) {
            throw new Error("メールアドレスまたはパスワードが正しくありません");
          }

          const passwordMatch = await compare(credentials.password, user.passwordHash);

          if (!passwordMatch) {
            throw new Error("メールアドレスまたはパスワードが正しくありません");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            storeId: user.storeId
          };
        } catch (error) {
          console.error("認証エラー:", error);
          throw new Error(error instanceof Error ? error.message : "認証に失敗しました");
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60 // 30日
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60 // 30日
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.storeId = user.storeId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.storeId = token.storeId as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
    newUser: "/register",
    error: "/login"  // エラー時はログインページに戻す
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
}; 