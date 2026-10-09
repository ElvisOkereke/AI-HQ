'use server';
import { fetchFuelixModelIds } from '../../lib/providers/fuelix';
import { buildFuelixModelList } from '../../lib/providers/fuelixModels';

// Open to everyone; the upstream /models call is cached for 10 minutes so repeat calls are cheap.
export async function listFuelixModelsAction() {
  try {
    const ids = await fetchFuelixModelIds();
    return { success: true, data: buildFuelixModelList(ids) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
