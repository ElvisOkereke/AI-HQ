'use server';
import { getVerifiedEmail } from '../../lib/auth/getServerUser';
import { fetchFuelixModelIds } from '../../lib/providers/fuelix';
import { buildFuelixModelList } from '../../lib/providers/fuelixModels';

// Requires a real session so anonymous callers can't trigger upstream calls with the app's key.
export async function listFuelixModelsAction() {
  try {
    await getVerifiedEmail();
    const ids = await fetchFuelixModelIds();
    return { success: true, data: buildFuelixModelList(ids) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
