'use server';
import { createUser, sendMessageToGemeni, fetchChatsByUser, saveChatToDb, newObjectId, generateTitle, updateChatModel, sendMessageToGemeniImage} from '../server/db';
import { Chat, SidebarProps, Attachment, Message } from "../../types/types"

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
    const { providerRegistry } = await import('../../lib/providers/registry');
    const { provider, actualModelId } = providerRegistry.getProviderFromModelId(selectedModel);
    
    const title = await providerRegistry.generateTitle(provider, actualModelId, userMessage);
    return { success: true, data: title };
  }catch(error){
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function sendMessageToAIAction(selectedModel: string, chat: Chat, user: { name?: string | null, email?: string | null }) {
  try {
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
export async function fetchChatsByUserAction(email: string){
  try{
    const chats = await fetchChatsByUser(email);
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
export async function saveChatToDbAction(chat: Chat, user:{name?: string | null, email?: string | null}){
  try{
    const res = await saveChatToDb(chat, user);
    return { success: true, data: res };
  }catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }

}

export async function updateChatModelAction(chatId: any, newModel: string, user: { name?: string | null; email?: string | null; }): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    if (!user?.email) {
      return { success: false, error: 'User not authenticated' };
    }
    const result = await updateChatModel(chatId, newModel, user);

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

