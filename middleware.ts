import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // スーパーアドミン専用ルートの保護 (/admin/super/*)
  if (pathname.startsWith('/admin/super')) {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    // セッションがないか、ADMIN権限がないか、スーパーアドミンでない場合はリダイレクト
    if (!token || token.role !== 'ADMIN' || !token.isSuperAdmin) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
  }
  
  // 通常の管理者ルートの保護 (/admin/*)
  else if (pathname.startsWith('/admin')) {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    // セッションがないか、ADMIN権限がない場合はログインページへリダイレクト
    if (!token || token.role !== 'ADMIN') {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
  }
  
  // スーパーアドミンAPI保護 (/api/admin/super/*)
  if (pathname.startsWith('/api/admin/super')) {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    // APIアクセスには認証が必要
    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: 'アクセスが拒否されました' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }
    
    // スーパーアドミン権限チェック
    if (token.role !== 'ADMIN' || !token.isSuperAdmin) {
      return new NextResponse(
        JSON.stringify({ error: 'スーパーアドミン権限が必要です' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      );
    }
  }
  // 通常の管理者API保護 (/api/admin/*)
  else if (pathname.startsWith('/api/admin')) {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    // APIアクセスには認証が必要
    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: 'アクセスが拒否されました' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }
    
    // 管理者権限チェック
    if (token.role !== 'ADMIN') {
      return new NextResponse(
        JSON.stringify({ error: '権限がありません' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      );
    }
  }
  
  // 初期化処理 - アプリケーション起動時に実行
  if (pathname === '/api/init' && request.method === 'POST') {
    // 初期化APIはクライアントからの直接アクセスを禁止
    const referer = request.headers.get('referer');
    const isServerRequest = !referer || referer.includes('/_next/');
    
    if (!isServerRequest) {
      return new NextResponse(
        JSON.stringify({ error: '不正なアクセスです' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      );
    }
  }
  
  // レスポンスにセキュリティヘッダーを追加
  const response = NextResponse.next();
  
  // セキュリティヘッダー設定
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // 本番環境のみHTTPSを強制
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security', 
      'max-age=63072000; includeSubDomains; preload'
    );
  }
  
  return response;
}

// ミドルウェアを適用するパスを指定
export const config = {
  matcher: [
    // 管理者ルート
    '/admin/:path*',
    // 管理者API
    '/api/admin/:path*',
    // 初期化API
    '/api/init',
    // その他セキュリティヘッダーを適用したいパス
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 