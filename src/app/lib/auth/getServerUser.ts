import 'server-only';
import { randomUUID } from 'crypto';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from './authOptions';
import { ANON_COOKIE, ANON_PREFIX, anonCookieOptions, isValidAnonId } from './anonymous';

// The only identity server actions trust: the verified session email when
// signed in, otherwise `anon:<id>` from the httpOnly anonymous cookie.
// Never derived from anything the client passes as an argument.
export async function getRequestIdentity(): Promise<string> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (email) {
    return email;
  }

  const cookieStore = await cookies();
  let anonId = cookieStore.get(ANON_COOKIE)?.value;
  if (!isValidAnonId(anonId)) {
    // Middleware normally sets this on page load; this covers a cleared cookie mid-session.
    anonId = randomUUID();
    cookieStore.set(ANON_COOKIE, anonId, anonCookieOptions);
  }
  return `${ANON_PREFIX}${anonId}`;
}
