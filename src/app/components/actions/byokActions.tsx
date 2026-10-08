'use server';
import { listByokConnections, addByokConnection, deleteByokConnection } from '../server/db';
import { getVerifiedEmail } from '../../lib/auth/getServerUser';

// These actions never accept an email/user param from the client — the only
// identity they trust is whatever getVerifiedEmail() resolves from the real
// server session, so there's nothing here for a client to spoof.

export async function listByokConnectionsAction() {
  try {
    const email = await getVerifiedEmail();
    const connections = await listByokConnections(email);
    return { success: true, data: connections };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function addByokConnectionAction(connection: { label: string; baseUrl: string; modelId: string; apiKey: string }) {
  try {
    const email = await getVerifiedEmail();
    const meta = await addByokConnection(email, connection);
    return { success: true, data: meta };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function deleteByokConnectionAction(connectionId: string) {
  try {
    const email = await getVerifiedEmail();
    const result = await deleteByokConnection(email, connectionId);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
