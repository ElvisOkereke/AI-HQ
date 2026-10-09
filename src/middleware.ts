import { NextResponse, type NextRequest } from 'next/server';
import { ANON_COOKIE, anonCookieOptions, isValidAnonId } from './app/lib/auth/anonymous';

// Hands every browser an anonymous id on its first page load, so server
// actions always have an identity to store chats under — signed in or not.
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  if (!isValidAnonId(request.cookies.get(ANON_COOKIE)?.value)) {
    response.cookies.set(ANON_COOKIE, crypto.randomUUID(), anonCookieOptions);
  }
  return response;
}

export const config = {
  matcher: ['/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)'],
};
