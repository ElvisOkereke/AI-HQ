import 'server-only'
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
import { Chat, BYOKConnectionMeta } from "../../types/types"
import { encryptSecret, decryptSecret, EncryptedSecret } from '../../lib/security/encryption';
import { isAnonymousIdentity } from '../../lib/auth/anonymous';

const MAX_BYOK_CONNECTIONS = 10;

type StoredByokConnection = BYOKConnectionMeta & {
  encryptedApiKey: EncryptedSecret;
};

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// Lazily create the connection on first use rather than at module load —
// eagerly connecting at import time breaks `next build`'s page-data
// collection step (it imports every route module without a request context)
// whenever MONGODB_URI isn't resolvable yet.
function getClientPromise(): Promise<MongoClient> {
  if (!global._mongoClientPromise) {
    const client = new MongoClient(process.env.MONGODB_URI as string, {
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
  return global._mongoClientPromise;
}

// Database utility function
export async function getDatabase(dbName = 't3chat') {
  try {
    const client = await getClientPromise();
    console.log('MongoDB client connected');
    return client.db(dbName)
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
export async function updateChatModel(chatId: any, newModel: string, user:{name?: string | null, email?: string | null}) {
  try{
    
    const db = await getDatabase();

    console.log('Original chatId:', chatId, 'Type:', typeof chatId);
    
    // Use chatId exactly as it's stored in the database
    // Since newObjectId() creates JSON.stringify(ObjectId) and we JSON.parse() it on client,
    // the _id should be stored as the parsed object format
    const queryId = chatId;
    
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

export async function verifyPass(credentials: { email?: string, password?: string }) {
  
  if (credentials.email && credentials.password) {
  if (isAnonymousIdentity(credentials.email.toLowerCase())) throw new Error('Account not found (User/Email is case sensitive)');
  try{
          const db = await getDatabase();
          const res = await db.collection('users').findOne({ "email": credentials.email });
          if (res !== null) {
              const isValid = await bcrypt.compare(credentials.password, res.password);
              if (isValid) return {
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
    // Anonymous visitors' data is stored under `anon:<id>` in the email field, so that prefix must never be claimable
    if (isAnonymousIdentity(String(JSON.parse(formData).email ?? '').toLowerCase())) {
      throw new Error('Invalid email address');
    }
    const db = await getDatabase();
    const emailCheck = await db.collection('users').findOne({ "email": JSON.parse(formData).email });
    if (emailCheck !== null) {
      //console.warn('Email already exists:', JSON.parse(formData).email);
      throw new Error('Account with this email already exists');
    }
    
    const parsedData = JSON.parse(formData);
    const hashedPassword = await bcrypt.hash(parsedData.password, 12);

    // Add default user properties
    const userData = {
      ...parsedData,
      password: hashedPassword,
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

// BYOK (bring-your-own-key) connections. All functions here take an `email`
// (a session email or `anon:<id>`) that callers must have resolved via
// getRequestIdentity() — this module never re-derives trust, since a leaked
// API key is worse than a leaked chat.

export async function listByokConnections(email: string): Promise<BYOKConnectionMeta[]> {
  try {
    const db = await getDatabase();
    const user = await db.collection('users').findOne(
      { "email": email },
      { projection: { "preferences.byokConnections": 1, "_id": 0 } }
    );
    const connections: StoredByokConnection[] = user?.preferences?.byokConnections || [];
    return connections.map(c => ({ id: c.id, label: c.label, baseUrl: c.baseUrl, modelId: c.modelId, createdAt: c.createdAt }));
  } catch (error) {
    console.error('Error listing BYOK connections:', error);
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

export async function getByokConnectionWithKey(email: string, connectionId: string): Promise<{ baseUrl: string; modelId: string; apiKey: string }> {
  try {
    const db = await getDatabase();
    const user = await db.collection('users').findOne(
      { "email": email },
      { projection: { "preferences.byokConnections": 1, "_id": 0 } }
    );
    const connections: StoredByokConnection[] = user?.preferences?.byokConnections || [];
    const connection = connections.find(c => c.id === connectionId);
    if (!connection) {
      throw new Error(`BYOK connection not found: ${connectionId}`);
    }
    return {
      baseUrl: connection.baseUrl,
      modelId: connection.modelId,
      apiKey: decryptSecret(connection.encryptedApiKey),
    };
  } catch (error) {
    console.error('Error getting BYOK connection:', error);
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

export async function addByokConnection(email: string, connection: { label: string; baseUrl: string; modelId: string; apiKey: string }): Promise<BYOKConnectionMeta> {
  try {
    new URL(connection.baseUrl); // throws if not a valid absolute URL

    const db = await getDatabase();
    const user = await db.collection('users').findOne(
      { "email": email },
      { projection: { "preferences.byokConnections": 1, "_id": 0 } }
    );
    const existing: StoredByokConnection[] = user?.preferences?.byokConnections || [];
    if (existing.length >= MAX_BYOK_CONNECTIONS) {
      throw new Error(`Maximum of ${MAX_BYOK_CONNECTIONS} BYOK connections reached`);
    }

    const stored: StoredByokConnection = {
      id: randomUUID(),
      label: connection.label,
      baseUrl: connection.baseUrl,
      modelId: connection.modelId,
      createdAt: new Date().toISOString(),
      encryptedApiKey: encryptSecret(connection.apiKey),
    };

    // Anonymous visitors have no users record until they save their first key
    const anonymous = isAnonymousIdentity(email);
    const result = await db.collection('users').updateOne(
      { "email": email },
      {
        $push: { "preferences.byokConnections": stored as any },
        $set: { "updatedAt": new Date() },
        ...(anonymous ? { $setOnInsert: { "isAnonymous": true, "createdAt": new Date() } } : {}),
      },
      { upsert: anonymous }
    );

    if (result.matchedCount === 0) {
      throw new Error(`User not found: ${email}`);
    }

    return { id: stored.id, label: stored.label, baseUrl: stored.baseUrl, modelId: stored.modelId, createdAt: stored.createdAt };
  } catch (error) {
    console.error('Error adding BYOK connection:', error);
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

export async function deleteByokConnection(email: string, connectionId: string): Promise<{ success: boolean }> {
  try {
    const db = await getDatabase();
    const result = await db.collection('users').updateOne(
      { "email": email },
      { $pull: { "preferences.byokConnections": { id: connectionId } as any }, $set: { "updatedAt": new Date() } }
    );

    if (result.matchedCount === 0) {
      throw new Error(`User not found: ${email}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting BYOK connection:', error);
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

