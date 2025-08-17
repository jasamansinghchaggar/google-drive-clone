import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // With Appwrite OAuth2, session management is handled client-side
  // We'll let the client-side components handle authentication checks
  
  // Only redirect away from auth pages if we have indication of a session
  const hasSession = request.cookies.get('a_session_' + process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
  
  // Redirect authenticated users away from auth pages
  if (request.nextUrl.pathname.startsWith('/signin') || 
      request.nextUrl.pathname.startsWith('/signup')) {
    if (hasSession) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
