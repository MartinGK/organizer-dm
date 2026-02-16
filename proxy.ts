import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const allowedEmails = new Set(
  (process.env.ALLOWED_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const url = new URL(request.url);

  if (!token?.email) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('callbackUrl', url.pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (!allowedEmails.has(token.email.toLowerCase())) {
    return NextResponse.redirect(new URL('/access-denied', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
