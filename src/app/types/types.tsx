import React from 'react'

// Message type definition
export type Message = {
  id: number;
  content: string;
  role: string;
  isStreaming?: boolean;
}
export type Attachment = {
  id:number;
  fileName:string;
  fileData:string; 
  fileType:string
}
export type Chat = {
  _id: any; // this is any because I dont want to import {ObjectId} from mongo on every client component, I think that increases bundle size, im never working with this property, only setting a new one on chat creation
  title: string;
  chatHistory: Message[];
  model:string
  attachments: Attachment[]
}


export type ChatProps = {
  key: string | null;
  activeChat: Chat | undefined;
  user?: {
    name?: string | null;
    email?: string | null;
  };
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
};

export type LLMModel = {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  features: ModelFeatures;
  description: string;
  provider: string;
};


function types() {
  return (
    <div>
      
    </div>
  )
}

export default types
