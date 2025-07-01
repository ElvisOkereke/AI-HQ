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
      { $set: { 
        "chatList.$.chatHistory": chat.chatHistory,
        "chatList.$.mediaItems": chat.mediaItems
      }}
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

export async function updateChatModel(chatId: any, newModel: string, user:{name?: string | null, email?: string | null}) {
  try{
    
    const db = await getDatabase();

    console.log('Original chatId:', chatId, 'Type:', typeof chatId);
    
    // Use chatId exactly as it's stored in the database
    // Since newObjectId() creates JSON.stringify(ObjectId) and we JSON.parse() it on client,
    // the _id should be stored as the parsed object format
    let queryId = chatId;
    
    console.log('Using chatId as received:', queryId);

    console.log('Attempting to update with queryId:', queryId, 'Type:', typeof queryId);

    // Debug: Let's see what chat IDs actually exist for this user
    const userChats = await db.collection('chats').findOne(
      { "email": user.email },
      { projection: { "chatList._id": 1 } }
    );
    
    if (userChats && userChats.chatList) {
      console.log('Existing chat IDs for user:', userChats.chatList.map((c: any) => ({ 
        id: c._id, 
        type: typeof c._id,
        stringified: JSON.stringify(c._id)
      })));
    }

    console.log('Query being executed:', {
      email: user.email,
      'chatList._id': queryId
    });
    
    const result = await db.collection('chats').updateOne(
      { "email": user.email, "chatList._id": queryId },
      { $set: { "chatList.$.model": newModel} }
    );
    
    console.log('Update result:', {
      acknowledged: result.acknowledged,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedCount: result.upsertedCount
    });
    
    if (result.matchedCount === 0) {
      console.warn('No chat found with ID:', chatId, 'for user:', user.email);
      // Let's also try a simpler query to see if we can find the document
      const simpleCheck = await db.collection('chats').findOne(
        { "email": user.email },
        { projection: { "chatList": { $elemMatch: { "_id": queryId } } } }
      );
      console.log('Simple check result:', simpleCheck);
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

export async function sendMessageToGemeni(selectedModel: string, chat: Chat) { //DEPRECATED
  const chatHistory = chat.chatHistory;
  const streamable = createStreamableValue("");
  
  // Get media items for the last message and previous context
  const lastMessage = chat.chatHistory[chat.chatHistory.length - 1];
  const mediaItems = chat.mediaItems || [];
  
  // Separate current message media from previous context media
  const currentMessageMedia = mediaItems.filter(media => media.messageId === lastMessage.id);
  const previousContextMedia = mediaItems.filter(media => media.messageId !== lastMessage.id);
  
  // Convert to inline data format
  const currentInlineData = currentMessageMedia.map(media => ({
    inlineData: {
      mimeType: media.fileType,
      data: media.fileData,
    },
  }));
  
  const previousInlineData = previousContextMedia.map(media => ({
    inlineData: {
      mimeType: media.fileType,
      data: media.fileData,
    },
  }));
  
  const allInlineData = [...currentInlineData, ...previousInlineData];
  console.log(`Sending ${currentInlineData.length} current media items and ${previousInlineData.length} context media items`);
    // Start the streaming process immediately without awaiting
    (async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY as string });
        
        // Check if this is a model that supports Google Search grounding
        const supportsGrounding = selectedModel === 'gemini-2.5-flash-lite-preview-06-17' || selectedModel === 'gemini-2.5-flash';
        
        let requestConfig: any = {
          model: selectedModel,
          contents: createUserContent(["This is the context of user and ai assistant conversation." + JSON.stringify(chatHistory) + " the first " + currentInlineData.length + " inline data elements are new attachments from the most recent message, the other " + previousInlineData.length + " are previous attachments." +
            "(when the user is referencing the attachments in the prompt of the most recent message, they are likely to refering to the new set of attachments, if there are no attachments in the first set and the user tries to reference new attachments remind the user that they did not attach new data," +
            "for example, user asks what is this? when there are no new attachments.)" + " Continue the conversation with the user by answering the most recent message, user may refer to older attachments so carefully read context to understand " +
            "what the user is refering to.", ...allInlineData])
        };
        
        // Add Google Search grounding for supported models
        if (supportsGrounding) {
          requestConfig.tools = [{
            googleSearchRetrieval: {
              dynamicRetrievalConfig: {
                mode: 'MODE_DYNAMIC',
                dynamicThreshold: 0.7
              }
            }
          }];
        }
        
        const response = await ai.models.generateContentStream(requestConfig);
        
        for await (const chunk of response) {
          const text = chunk.text as string;
          streamable.update(text);
        }
      } catch (error) {
        // Send error through the stream
        streamable.error(error instanceof Error ? error.message : String(error));
        return;
      }
        streamable.done();
    })();

    // Return immediately with the stream
    return { stream: streamable.value, img: null }; 
  
}

export async function sendMessageToGemeniImage(selectedModel: string, chat: Chat) { //DEPRECATED
  const chatHistory = chat.chatHistory;
  const streamable = createStreamableValue("");
  const streamableIMG = createStreamableValue("");
  
  try {
    // Get media items for the last message and previous context
    const lastMessage = chat.chatHistory[chat.chatHistory.length - 1];
    const mediaItems = chat.mediaItems || [];
    
    // Separate current message media from previous context media
    const currentMessageMedia = mediaItems.filter(media => media.messageId === lastMessage.id);
    const previousContextMedia = mediaItems.filter(media => media.messageId !== lastMessage.id);
    
    // Convert to inline data format
    const currentInlineData = currentMessageMedia.map(media => ({
      inlineData: {
        mimeType: media.fileType,
        data: media.fileData,
      },
    }));
    
    const previousInlineData = previousContextMedia.map(media => ({
      inlineData: {
        mimeType: media.fileType,
        data: media.fileData,
      },
    }));
    
    const allInlineData = [...currentInlineData, ...previousInlineData];

    // Start the async process without awaiting
    (async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY as string });
        const response = await ai.models.generateContent({
          model: selectedModel,
          contents: createUserContent([
            "This is the context of user and ai assistant conversation." + JSON.stringify(chatHistory) + " the first " + currentInlineData.length + " inline data elements are new attachments from the most recent message, the other " + previousInlineData.length + " are previous attachments." +
            "(when the user is referencing the attachments in the prompt of the most recent message, they are likely to refering to the new set of attachments, if there are no attachments in the first set and the user tries to reference new attachments remind the user that they did not attach new data," +
            "for example, user asks what is this? when there are no new attachments.)" +
            " Continue the conversation with the user by answering the most recent message, user may refer to older attachments so carefully read context to understand what the user is refering to. (You are a image model so make sure you output images if user asks and cross context from previous prompts unless the user specifically says so)",
            ...allInlineData
          ]),
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
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        streamable.error(errorMessage);
        streamableIMG.error(errorMessage);
        return;
      } finally {
        streamableIMG.done();
        streamable.done();
      }
    })();

    // Return immediately with the streams
    return { stream: streamable.value, img: streamableIMG.value };
    
  } catch (error) {
    // Handle synchronous errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    streamable.error(errorMessage);
    streamableIMG.error(errorMessage);
    return { stream: streamable.value, img: streamableIMG.value };
  }
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
    
    // Add default user properties
    const userData = {
      ...JSON.parse(formData),
      lastSeenUpdate: null,
      preferences: {
        loggingEnabled: false
      },
      createdAt: new Date()
    };
    
    const result = await db.collection('users').insertOne(userData);

    if (result.acknowledged) return result.insertedId;
    else throw new Error ('Failed to create user');

  }catch(error){
    console.error('Error creating user or connecting to DB:', error);
    throw error;
  }
}

export async function updateUserLastSeenUpdate(email: string, updateVersion: string) {
  try {
    const db = await getDatabase();
    const result = await db.collection('users').updateOne(
      { "email": email },
      { $set: { "lastSeenUpdate": updateVersion, "updatedAt": new Date() } }
    );
    
    if (result.matchedCount === 0) {
      throw new Error(`User not found: ${email}`);
    }
    
    if (result.acknowledged) {
      return { success: true, modified: result.modifiedCount > 0 };
    }
    
    throw new Error("Failed to update user's last seen update");
  } catch (error) {
    console.error('Error updating user last seen update:', error);
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

export async function getUserPreferences(email: string) {
  try {
    const db = await getDatabase();
    const user = await db.collection('users').findOne(
      { "email": email },
      { projection: { "lastSeenUpdate": 1, "preferences": 1, "_id": 0 } }
    );
    
    if (!user) {
      throw new Error(`User not found: ${email}`);
    }
    
    return {
      lastSeenUpdate: user.lastSeenUpdate || null,
      preferences: user.preferences || { loggingEnabled: false }
    };
  } catch (error) {
    console.error('Error getting user preferences:', error);
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

export async function updateUserPreferences(email: string, preferences: any) {
  try {
    const db = await getDatabase();
    const result = await db.collection('users').updateOne(
      { "email": email },
      { $set: { "preferences": preferences, "updatedAt": new Date() } }
    );
    
    if (result.matchedCount === 0) {
      throw new Error(`User not found: ${email}`);
    }
    
    if (result.acknowledged) {
      return { success: true, modified: result.modifiedCount > 0 };
    }
    
    throw new Error("Failed to update user preferences");
  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

export async function createOrUpdateOAuthUser(email: string, name?: string | null, provider?: string) {
  try {
    const db = await getDatabase();
    
    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ "email": email });
    
    if (existingUser) {
      // User exists, update last login and ensure they have all required fields
      const updateData: any = {
        lastLoginAt: new Date(),
        updatedAt: new Date()
      };
      
      // Update name if provided and different
      if (name && name !== existingUser.name) {
        updateData.name = name;
      }
      
      // Ensure user has required fields for update system
      if (!existingUser.lastSeenUpdate) {
        updateData.lastSeenUpdate = null;
      }
      
      if (!existingUser.preferences) {
        updateData.preferences = { loggingEnabled: false };
      }
      
      const result = await db.collection('users').updateOne(
        { "email": email },
        { $set: updateData }
      );
      
      return { success: true, created: false, userId: existingUser._id };
    } else {
      // Create new OAuth user
      const newUser = {
        email: email,
        name: name || 'OAuth User',
        provider: provider || 'oauth',
        lastSeenUpdate: null,
        preferences: {
          loggingEnabled: false
        },
        createdAt: new Date(),
        lastLoginAt: new Date()
      };
      
      const result = await db.collection('users').insertOne(newUser);
      
      if (result.acknowledged) {
        return { success: true, created: true, userId: result.insertedId };
      } else {
        throw new Error('Failed to create OAuth user');
      }
    }
  } catch (error) {
    console.error('Error creating/updating OAuth user:', error);
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

