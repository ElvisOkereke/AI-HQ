'use server';
import { listByokConnections, addByokConnection, deleteByokConnection } from '../server/db';
import { getRequestIdentity } from '../../lib/auth/getServerUser';

// These actions never accept an email/user param from the client — the only
// identity they trust is whatever getRequestIdentity() resolves server-side
// (session email or anonymous cookie id), so there's nothing here to spoof.

export async function listByokConnectionsAction() {
  try {
    const identity = await getRequestIdentity();
    const connections = await listByokConnections(identity);
    return { success: true, data: connections };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function addByokConnectionAction(connection: { label: string; baseUrl: string; modelId: string; apiKey: string }) {
  try {
    const identity = await getRequestIdentity();
    const meta = await addByokConnection(identity, connection);
    return { success: true, data: meta };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function deleteByokConnectionAction(connectionId: string) {
  try {
    const identity = await getRequestIdentity();
    const result = await deleteByokConnection(identity, connectionId);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
