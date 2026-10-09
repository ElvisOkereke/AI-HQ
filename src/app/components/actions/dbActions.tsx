'use server';
import { createUser, fetchChatsByUser, saveChatToDb, newObjectId, updateChatModel, getByokConnectionWithKey} from '../server/db';
import { Chat, Message } from "../../types/types"
import { headers } from 'next/headers';
import { checkRateLimit } from '../../lib/rateLimiter';
import { getRequestIdentity } from '../../lib/auth/getServerUser';

// Chat actions never accept an email/user from the client: identity is always
// resolved server-side (session email, or the anonymous cookie id).

async function enforceRateLimit() {
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { allowed } = checkRateLimit(ip);
  if (!allowed) {
    throw new Error('Rate limit reached. Please wait a while before sending more messages.');
  }
}

export async function createUserAction(formData: string) {
  try{ 
    const user = await createUser(formData)
    return { success: true, data: user}
  }catch(error){
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
export async function generateTitleAction(selectedModel: string, userMessage: Message) {
  try{
    if (selectedModel.startsWith('byok:')) {
      const identity = await getRequestIdentity();
      const connection = await getByokConnectionWithKey(identity, selectedModel.slice(5));
      const { BYOKProvider } = await import('../../lib/providers/byok');
      const provider = new BYOKProvider({ baseUrl: connection.baseUrl, apiKey: connection.apiKey });
      const title = await provider.generateTitle!(connection.modelId, userMessage);
      return { success: true, data: title };
    }

    const { providerRegistry } = await import('../../lib/providers/registry');
    const { provider, actualModelId } = providerRegistry.getProviderFromModelId(selectedModel);

    const title = await providerRegistry.generateTitle(provider, actualModelId, userMessage);
    return { success: true, data: title };
  }catch(error){
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function sendMessageToAIAction(selectedModel: string, chat: Chat) {
  try {
    if (selectedModel.startsWith('byok:')) {
      // BYOK runs on the user's own key, so it isn't rate limited
      const identity = await getRequestIdentity();
      const connection = await getByokConnectionWithKey(identity, selectedModel.slice(5));
      const { BYOKProvider } = await import('../../lib/providers/byok');
      const provider = new BYOKProvider({ baseUrl: connection.baseUrl, apiKey: connection.apiKey });
      const modelResponse = await provider.sendMessage(connection.modelId, chat);
      return { success: true, data: modelResponse };
    }

    await enforceRateLimit();

    const { providerRegistry } = await import('../../lib/providers/registry');
    const { provider, actualModelId } = providerRegistry.getProviderFromModelId(selectedModel);

    console.log(`Routing model ${selectedModel} to provider ${provider} with actualModelId ${actualModelId}`);

    const modelResponse = await providerRegistry.sendMessage(provider, actualModelId, chat);

    return { success: true, data: modelResponse };
  } catch (error) {
    console.error('Error in sendMessageToAIAction:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
export async function fetchChatsByUserAction(){
  try{
    const chats = await fetchChatsByUser(await getRequestIdentity());
    return { success: true, data: chats };

  }catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }

}
export async function newObjectIdAction(){
  try{
    const res = newObjectId();
    return { success: true, data: res };
  }catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }

}
export async function saveChatToDbAction(chat: Chat){
  try{
    const res = await saveChatToDb(chat, { email: await getRequestIdentity() });
    return { success: true, data: res };
  }catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }

}

export async function updateChatModelAction(chatId: any, newModel: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    await updateChatModel(chatId, newModel, { email: await getRequestIdentity() });

    return { success: true, data: { chatId, newModel } };
  } catch (error) {
    console.error('Error updating chat model:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function updateUserLastSeenUpdateAction(email: string, updateVersion: string) {
  try {
    const { updateUserLastSeenUpdate } = await import('../server/db');
    const result = await updateUserLastSeenUpdate(email, updateVersion);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error updating user last seen update:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getUserPreferencesAction(email: string) {
  try {
    const { getUserPreferences } = await import('../server/db');
    const result = await getUserPreferences(email);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function createOrUpdateOAuthUserAction(email: string, name?: string | null, provider?: string) {
  try {
    const { createOrUpdateOAuthUser } = await import('../server/db');
    const result = await createOrUpdateOAuthUser(email, name, provider);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error creating/updating OAuth user:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

