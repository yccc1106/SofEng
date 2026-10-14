import { NextRequest, NextResponse } from 'next/server';

const adminPaths = ['/dashboard', '/moderation', '/interest/manage', '/feedback', '/user-management'];

/** 进入受保护页面前向 Java 核对会话，并对管理路由额外检查角色。 */
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === '/user/login') return NextResponse.next();
  const admin = adminPaths.some(prefix => path === prefix || path.startsWith(`${prefix}/`));
  const restricted = admin || path === '/' || path === '/user' || path.startsWith('/user/') ||
    path.startsWith('/interest/');
  if (!restricted) return NextResponse.next();

  try {
    const sessionId = request.cookies.get('JSESSIONID')?.value;
    if (!sessionId || !/^[A-Za-z0-9]+$/.test(sessionId))
      return NextResponse.redirect(new URL('/user/login', request.url));
    const backend = process.env.JAVA_BACKEND_URL || 'http://localhost:8080';
    const response = await fetch(`${backend}/api/users/profile`, {
      headers: { cookie: `JSESSIONID=${sessionId}` },
      cache: 'no-store',
    });
    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data?.id) {
        if (admin && result.data.role !== 'ADMIN') return NextResponse.redirect(new URL('/', request.url));
        return NextResponse.next();
      }
    }
  } catch {
    // A missing backend must not grant access to protected pages.
  }
  return NextResponse.redirect(new URL('/user/login', request.url));
}

export const config = {
  matcher: ['/((?!java|api|_next/static|_next/image|favicon.ico).*)'],
};
