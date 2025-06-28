import React from 'react'

// Message type definition - now only contains text content
export type Message = {
  id: number;
  content: string;
  role: string;
  isStreaming?: boolean;
  // Reference to associated media items
  mediaIds?: number[];
}

// Media items (images and other attachments) stored separately
export type MediaItem = {
  id: number;
  messageId: number; // Associates with the message that included this media
  fileName: string;
  fileData: string; // base64 encoded data
  fileType: string;
  mediaType: 'image' | 'file'; // Distinguishes between images and other files
  timestamp: number;
}

// Legacy Attachment type for backward compatibility
export type Attachment = {
  id: number;
  fileName: string;
  fileData: string; 
  fileType: string;
}

export type Chat = {
  _id: any; // this is any because I dont want to import {ObjectId} from mongo on every client component, I think that increases bundle size, im never working with this property, only setting a new one on chat creation
  title: string;
  chatHistory: Message[];
  model: string;
  // Deprecated: keeping for backward compatibility during migration
  attachments?: Attachment[];
  // New: all media items stored here
  mediaItems: MediaItem[];
}


export type User = {
  name?: string | null;
  email?: string | null;
  lastSeenUpdate?: string; // timestamp of last seen update
  preferences?: {
    loggingEnabled?: boolean;
  };
};

export type ChatProps = {
  key: string | null;
  activeChat: Chat | undefined;
  user?: User;
  setActiveChat: React.Dispatch<React.SetStateAction<Chat | undefined>>;
  setChatList: React.Dispatch<React.SetStateAction<Chat[]>>;
}

export type SidebarProps = {
  chatList: Chat[];
  activeChat?: Chat;
  setChatList: React.Dispatch<React.SetStateAction<Chat[]>>;
  setActiveChat: React.Dispatch<React.SetStateAction<Chat | undefined>>;
  onLogout: () => void;
  user?: {
    name?: string | null;
    email?: string | null;
  };
};
export type ModelFeatures = {
  imageGeneration?: boolean;
  imageUpload?: boolean;
  fileUpload?: boolean;
  webSearch?: boolean;
  streaming?: boolean;
  maxTokens?: number;
};

export type ModelProvider = 'Google' | 'HuggingFace' | 'Nvidia' | 'OpenAI' | 'Anthropic';

export type LLMModel = {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  features: ModelFeatures;
  description: string;
  provider: ModelProvider;
  category: 'text' | 'multimodal' | 'image' | 'code' | 'reasoning';
  contextLength?: number;
  isExperimental?: boolean;
};


function types() {
  return (
    <div>
      
    </div>
  )
}

export default types
