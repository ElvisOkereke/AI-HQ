'use server';
import { createUser, sendMessageToGemeni} from '../server/db';
//import { GoogleGenAI } from "@google/genai";


export async function createUserAction(formData: string) {
  try{ 
    const user = await createUser(formData)
    return { success: true, data: user}
  }catch(error){
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
export async function sendMessageToAIAction( selectedModel: string, chatHistory: object[]) {
  try{ 
    let user;
    if (selectedModel.includes('gemini')) user = await sendMessageToGemeni(selectedModel, chatHistory);
    if (selectedModel.includes('gpt')) {
    }
    if (selectedModel.includes('claude')) {
    }

    return { success: true, data: user}
  }catch(error){
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
