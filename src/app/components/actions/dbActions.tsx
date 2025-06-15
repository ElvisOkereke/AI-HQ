'use server';
import { createUser, sendMessageToGemeni, fetchChatsByUser, saveChatToDb, newObjectId, generateTitle} from '../server/db';

type Chat = {
  _id: any;
  title: string;
  chatHistory: Message[];
}
type Message = {
  id: number;
  content: string;
  role: string;
  isStreaming?: boolean;
};

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
    if (selectedModel.includes('gemini')) modelResponse = await sendMessageToGemeni(selectedModel, chat);
    if (selectedModel.includes('gpt')) {
    }
    if (selectedModel.includes('claude')) {
    }

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

