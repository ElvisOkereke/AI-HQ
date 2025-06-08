'use server';
import {sendMessageToOpenAPI} from '../server/db';

export async function sendMessageAction(gametag: string) {
  try {
    const user = await sendMessageToOpenAPI(gametag); //null if not user found in db
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}