import 'server-only'
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
import { GoogleGenAI, createUserContent, Modality } from "@google/genai";
import { createStreamableValue } from 'ai/rsc'
//import argon2 from 'argon2';
import { Chat, Message } from "../../types/types"

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}
let client;
let clientPromise: Promise<MongoClient> | null = null;


if (!global._mongoClientPromise) {
  client = new MongoClient(process.env.NEXT_PUBLIC_MONGODB_URI as string, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
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
  return JSON.stringify(ObjectId.createFromTime(Math.floor(Date.now()/1000)));
}

export async function fetchChatsByUser(email: string){
  try{
    const db = await getDatabase();
    const result = await db.collection('chats').findOne(
    { "email": email },
    { projection: { "chatList": 1, "_id": 0 } } // Project only chats, exclude _id
  );
    if (result === null) {
      console.warn('No chats found for user:', email);
      return [];
    }
    return result.chatList as Chat[];
  }catch (error) {
    console.error('Error fetching chats by user:', error);
    throw new Error(error instanceof Error ? error.message : String(error));
  }

}

export async function saveChatToDb(chat: Chat, user:{name?: string | null, email?: string | null}){
  try{
    const db = await getDatabase();
    const isExistingChat = await db.collection('chats').findOne({"email": user.email, "chatList._id": chat._id})
    const isExistingHistory = await db.collection('chats').findOne({"email": user.email})
    if (isExistingChat === null) {
      if(isExistingHistory === null){
           const final = await db.collection('chats').insertOne({"email": user.email, "chatList":[chat]});
           return ("created new user chat history, result = "+ final.acknowledged);
      }

      const agg = [{ "$match": { "email": user.email }},{'$addFields': {'chatList': {'$concatArrays': ['$chatList', [chat]]}}}];
      const final = await db.collection('chats').aggregate(agg).toArray();
      const final2 = await db.collection('chats').updateOne({ "email": user.email},{ $set: { "chatList": final[0].chatList}});
      if (!final2.acknowledged) throw new Error("Error updating exisiting chat instance")
      return ("created new chat for user, result = "+ final2.acknowledged);
    }
    const final = await db.collection('chats').updateOne(
      { "email": user.email, "chatList._id": chat._id },
      { $set: { "chatList.$.chatHistory": chat.chatHistory} }
    );
    if (!final.acknowledged) throw new Error("Error updating exisiting chat instance")
    return ("updated specific chat for user, result = "+ final.acknowledged);
  }catch (error){
    console.error('Error saving to DB:', error);
    throw new Error(error instanceof Error ? error.message : String(error));
  }

}
export async function generateTitle(selectedModel: string, userMessage: Message){
  try{
      const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY as string });
      const response = await ai.models.generateContent({
      model: `gemini-2.0-flash`,
      contents: "Using this initial user message " + userMessage.content + "output a singular title for this User to AI chat instance, ONLY RESPOND WITH TITLE"
      });
      return response.text
    }catch(error){
      throw new Error(error instanceof Error ? error.message : String(error))
  }
}

export async function updateChatModel(chatId: string, newModel: string, user:{name?: string | null, email?: string | null}) {
  try{
    
    const db = await getDatabase();

    // considering converting chatId to ObjectId if it's a string
    const objectId = typeof chatId === 'string' ? new ObjectId(chatId) : chatId;

    const result = await db.collection('chats').updateOne(
      { "email": user.email, "chatList._id": chatId },
      { $set: { "chatList.$.model": newModel} }
    );
    if (result.matchedCount === 0) {
      console.warn('No chat found with ID:', chatId, 'for user:', user.email);
      throw new Error(`No chat found with ID: ${chatId} for user: ${user.email}`);
    }
    if (result.modifiedCount === 0) {
      console.warn('Chat model already set to:', newModel, 'for chat ID:', chatId);
      return { matchedCount: result.matchedCount, modifiedCount: 0 };
    }
    if (result.acknowledged) return ("done updating chat model, result = "+ result.acknowledged);
    throw new Error("Error updating chat model");
 
  }catch (error) {
    console.error('Error updating chat model:', error);
    throw new Error(error instanceof Error ? error.message : String(error));
  }

}

export async function sendMessageToGemeni(selectedModel: string, chat: Chat) {
  const chatHistory = chat.chatHistory;
  const streamable = createStreamableValue("");

  // Efficiently partition attachments into those matching the last message and the rest
  const lastMessage = chat.chatHistory[chat.chatHistory.length - 1];
  const attachments = chat.attachments || [];
  const [inlineData, previousInlineData] = attachments.reduce<[any[], any[]]>(
    ([match, rest], att) => {
      if (lastMessage && att.id === lastMessage.id) {
        match.push({
          inlineData: {
            mimeType: att.fileType,
            data: att.fileData,
          },
        });
      } else {
        rest.push({
          inlineData: {
            mimeType: att.fileType,
            data: att.fileData,
          },
        });
      }
      return [match, rest];
    },
    [[], []]
  );
  const allInlineData = [...inlineData, ...previousInlineData];
  (async () => {
    try{
      const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY as string });
      const response = await ai.models.generateContentStream({
      model: selectedModel,
      contents: "This is the context of user and ai assistant conversation."+ JSON.stringify(chatHistory) +" the first "+inlineData.length+" inline data elements are new attachments from the most recent message, the other "+previousInlineData.length+" are previous attachments." + 
    "(when the user is referencing the attachments in the prompt of the most recent message, they are likely to refering to the new set of attachments, if there are no attachments in the first set and the user tries to reference new attachments remind the user that they did not attach new data," +
    "for example, user asks what is this? when there are no new attachments.)"+" Continue the conversation with the user by answering the most recent message, user may refer to older attachments so carefully read context to understand "+
    "what the user is refering to. (You are a image model so make sure you output images if user asks and cross context from previous prompts unless the user specifically says so)"
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

  return {stream: streamable.value, img: null};
}

export async function sendMessageToGemeniImage(selectedModel: string, chat: Chat) {
  const chatHistory = chat.chatHistory;
  const streamable = createStreamableValue("");
  const streamableIMG = createStreamableValue("");
  
  const lastMessage = chat.chatHistory[chat.chatHistory.length - 1];
  const attachments = chat.attachments || [];
  const [inlineData, previousInlineData] = attachments.reduce<[any[], any[]]>(
    ([match, rest], att) => {
      if (lastMessage && att.id === lastMessage.id) {
        match.push({
          inlineData: {
            mimeType: att.fileType,
            data: att.fileData,
          },
        });
      } else {
        rest.push({
          inlineData: {
            mimeType: att.fileType,
            data: att.fileData,
          },
        });
      }
      return [match, rest];
    },
    [[], []]
  );
  const allInlineData = [...inlineData, ...previousInlineData];
 
  // Await the AI response and stream updates before returning the result
  await (async () => {
    try{
      const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY as string });
      const response = await ai.models.generateContent({
      model: selectedModel,
      contents: createUserContent([
    "This is the context of user and ai assistant conversation."+ JSON.stringify(chatHistory) +" the first "+inlineData.length+" inline data elements are new attachments from the most recent message, the other "+previousInlineData.length+" are previous attachments." + 
    "(when the user is referencing the attachments in the prompt of the most recent message, they are likely to refering to the new set of attachments, if there are no attachments in the first set and the user tries to reference new attachments remind the user that they did not attach new data," +
    "for example, user asks what is this? when there are no new attachments.)"+
    " Continue the conversation with the user by answering the most recent message, user may refer to older attachments so carefully read context to understand what the user is refering to. (You are a image model so make sure you output images if user asks and cross context from previous prompts unless the user specifically says so)",
      ...allInlineData]),
      config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
    });
      if (
        response.candidates &&
        response.candidates[0] &&
        response.candidates[0].content &&
        Array.isArray(response.candidates[0].content.parts)
      ) {
        for (const part of response.candidates[0].content.parts) {
          // Based on the part type, either show the text or save the image
          if (part.text) {
            streamable.update(part.text);
          } else if (part.inlineData && part.inlineData.data) {

            const buffer = Buffer.from(part.inlineData.data, "base64");
      
            
            streamableIMG.update(part.inlineData.data);
          }
        }
      } else {
        console.warn('No valid candidates or parts found in Gemini response.');
      }


    }catch(error){
      console.error('Error receiving message from Gemini:', error);
      throw new Error(error instanceof Error ? error.message : String(error));
    } finally{
      streamableIMG.done()
      streamable.done()
    }
  })();
  
  return {stream: streamable.value, img: streamableIMG.value};
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
            }; throw new Error('Account not found (User/Email is case sensitive)');
        }catch(error){
          console.error('Error connect to db or querying user:', error);
          throw new Error(error instanceof Error ? error.message : String(error));
        }
      }
}

export async function createUser(formData: string) {
  try{
    const db = await getDatabase();
    const emailCheck = await db.collection('users').findOne({ "email": JSON.parse(formData).email });
    if (emailCheck !== null) {
      //console.warn('Email already exists:', JSON.parse(formData).email);
      throw new Error('Account with this email already exists');
    }
    const result = await db.collection('users').insertOne(JSON.parse(formData));

    if (result.acknowledged) return result.insertedId;
    else throw new Error ('Failed to create user');

  }catch(error){
    console.error('Error creating user or connecting to DB:', error);
    throw error;
  }
}

