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
export async function generateTitleAction( selectedModel: string, userMessage: Message) {
  try{ 
    const user = await generateTitle( selectedModel, userMessage)
    return { success: true, data: user}
  }catch(error){
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function sendMessageToAIAction( selectedModel: string, chat: Chat, user:{name?: string | null, email?: string | null}){

  try{ 
    let modelResponse;
    if (selectedModel.includes('gemini')) {
      if (selectedModel.includes('image')) modelResponse = await sendMessageToGemeniImage(selectedModel, chat);
      else modelResponse = await sendMessageToGemeni(selectedModel, chat);
    }
    if (selectedModel.includes('llama')) modelResponse = await sendMessageToGemeni(selectedModel, chat);
    if (selectedModel.includes('deepseek')) modelResponse = await sendMessageToGemeni(selectedModel, chat);
    

    return { success: true, data: modelResponse}
  }catch(error){
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

