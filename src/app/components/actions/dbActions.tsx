'use server';
import { createUser, sendMessageToGemeni, fetchChatsByUser, saveHistoryToDB} from '../server/db';

export async function createUserAction(formData: string) {
  try{ 
    const user = await createUser(formData)
    return { success: true, data: user}
  }catch(error){
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
export async function sendMessageToAIAction( selectedModel: string, chatHistory: object[], user:{name?: string | null, email?: string | null}){
  try{ 
    let modelResponse;
    if (selectedModel.includes('gemini')) modelResponse = await sendMessageToGemeni(selectedModel, chatHistory);
    if (selectedModel.includes('gpt')) {
    }
    if (selectedModel.includes('claude')) {
    }

    await saveHistoryToDB(chatHistory, user)

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
