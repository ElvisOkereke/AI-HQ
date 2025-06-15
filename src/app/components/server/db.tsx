import 'server-only'
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
import { GoogleGenAI } from "@google/genai";
import { createStreamableValue } from 'ai/rsc'
//import argon2 from 'argon2';

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}
let client;
let clientPromise: Promise<MongoClient> | null = null;

type Chat = {
  _id: ObjectId;
  title: string;
  chatHistory: Message[];
}
type Message = {
  id: number;
  content: string;
  role: string;
  isStreaming?: boolean;
};

if (!global._mongoClientPromise) {
  client = new MongoClient(process.env.NEXT_PUBLIC_MONGODB_URI as string, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;
export {clientPromise};

// Database utility function
export async function getDatabase(dbName = 't3chat') {
  try {
    const client = await clientPromise;
    console.log('MongoDB client connected');
    return client!.db(dbName)
  }catch (error) {
    console.error('Error connecting to the database:', error);
    throw error;
  }
}

export function newObjectId(){
  return ObjectId.createFromTime(Math.floor(Date.now()/1000));
}

export async function fetchChatsByUser(email: string){
  try{
    const db = await getDatabase();
    const result = await db.collection('chats').findOne({ "email": email });
    if (result === null) {
      console.warn('No chats found for user:', email);
      return [];
    }
    return result.chatHistory;
  }catch (error) {
    console.error('Error fetching chats by user:', error);
    throw new Error(error instanceof Error ? error.message : String(error));
  }

}

export async function saveChatToDb(chat: Chat, user:{name?: string | null, email?: string | null}){
  try{
    const db = await getDatabase();
    const allChats = await db.collection('chats').findOne({"email": user.email})
    let existingChat;
    if (allChats){
      allChats.chats
    }
    
    if (existingChat === null) {
      const final = await db.collection('chats').insertOne(chat);
      if (!final.acknowledged) throw new Error("Error inserting new chat instance")
      return;
    }
    const final = await db.collection('chats').replaceOne({"_id": chat._id}, chat)
    if (!final.acknowledged) throw new Error("Error updating exisiting chat instance")
  }catch (error){

  }

}
export async function generateTitle(selectedModel: string, userMessage: Message){
  try{
      const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY as string });
      const response = await ai.models.generateContent({
      model: selectedModel,
      contents: "Using this initial user message " + userMessage.content + " create a title for this User to AI chat instance"
      });
      return response.text
    }catch(error){
      throw new Error(error instanceof Error ? error.message : String(error))

  }
 

}

export async function sendMessageToGemeni(selectedModel: string, chat: Chat) {
  const chatHistory = chat.chatHistory;
  const streamable = createStreamableValue("");
  (async () => {
    try{
      const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY as string });
      const response = await ai.models.generateContentStream({
      model: selectedModel,
      contents: "This is the context of user and ai assistant conversation,"+ JSON.stringify(chatHistory) +" continue the conversation with the user by answering the most recent message"
    });
      for await (const chunk of response){
        const text = chunk.text as string;
        streamable.update(text);
      }


    }catch(error){
      console.error('Error receiving message from Gemini:', error);
      throw new Error(error instanceof Error ? error.message : String(error));
    } finally{
      streamable.done()
    }
  })();

  return streamable.value;
}

export async function verifyPass(credentials: { email?: string, password?: string }) {
  
  if (credentials.email && credentials.password) {
  try{
          const db = await getDatabase();
          const res = await db.collection('users').findOne({ "email": credentials.email });
          if (res !== null) {
              // Verifying
              //const isValid = await argon2.verify(res.password, credentials?.password);
              if (res.password === credentials.password) return {
                id: res._id.toString(),
                email: res.email,
                name: res.name,
              }
              else throw new Error('Invalid password'); 
            };
        }catch(error){
          console.error('Error connect to db or querying user:', error);
          throw new Error(error instanceof Error ? error.message : String(error));
        }
      }
}

export async function createUser(formData: string) {
  try{
    const db = await getDatabase();
    const result = await db.collection('users').insertOne(JSON.parse(formData));

    if (result.acknowledged) return result.insertedId;
    else throw new Error ('Failed to create user');

  }catch(error){
    console.error('Error creating user or connecting to DB:', error);
    throw error;
  }
}

