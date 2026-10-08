import 'server-only';
import { getServerSession } from 'next-auth';
import { authOptions } from './authOptions';

// Real session verification, unlike the rest of the app's server actions
// (which trust a client-supplied email) — BYOK keys are sensitive enough
// that a leaked one is worse than a leaked chat.
export async function getVerifiedEmail(): Promise<string> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    throw new Error('Not authenticated');
  }
  return email;
}
