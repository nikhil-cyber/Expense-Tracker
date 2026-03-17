import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from './lib/auth';

const publicPaths = ['/login', '/register', '/'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPaths.includes(pathname)) {
    const session = await getSessionFromRequest(request);
    if (session && (pathname === '/login' || pathname === '/register')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/expenses') ||
      pathname.startsWith('/api/recurring') || pathname.startsWith('/api/savings') ||
      pathname.startsWith('/api/credit-cards') || pathname.startsWith('/api/accounts') ||
      pathname.startsWith('/api/ai')) {
    const session = await getSessionFromRequest(request);
    if (!session) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|fonts).*)'],
};
