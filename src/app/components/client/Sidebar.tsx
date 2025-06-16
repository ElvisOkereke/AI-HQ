'use client';
import { Plus, MessageSquare, LogOut, User } from 'lucide-react';
import React from 'react';
import { fetchChatsByUserAction } from '../actions/dbActions';
import { useEffect } from 'react';

type SidebarProps = {
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

type Chat = {
  _id: any;
  title: string;
  chatHistory: Message[];
  model: string;
}
type Message = {
  id: number;
  content: string;
  role: string;
  isStreaming?: boolean;
};


export default function Sidebar({ chatList, setChatList, activeChat, setActiveChat, onLogout, user }: SidebarProps) {
  
  useEffect(() => {
    if(user){// fetch only if user is logged in
    const fetchAllChats = async () => {
      const fetchChats = await fetchChatsByUserAction(user.email as string);
      if (!fetchChats.success) {
        console.error('Failed to fetch chats:', fetchChats.error);
        throw new Error(fetchChats.error);
      }
      setChatList(fetchChats.data ?? []);
    };
    fetchAllChats();
    }
  }, [])

  return (
    <div className="flex flex-col w-72 bg-gray-800 border-r border-gray-700 p-4">
      {/* New Chat Button */}
      <button 
        onClick={() => setActiveChat(undefined)}
        className="flex items-center justify-center gap-2 w-full px-4 py-3 mb-6 bg-blue-600 rounded-lg font-semibold hover:bg-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        <Plus className="w-5 h-5" />
        New Chat
      </button>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-2 -mr-2">
        <h2 className="text-sm font-semibold text-gray-400 px-2 mb-2">Recent</h2>
        {chatList.map((chat) => (
          <button
            key={chat._id.toString()}
            onClick={() => setActiveChat(chat)} // this should probbably be setActiveChat(chat) instead
            className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              activeChat === chat
                ? 'bg-gray-700'
                : 'hover:bg-gray-700/50'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-gray-400" />
            <span className="truncate flex-1">{chat.title}</span>
          </button>
        ))}
      </div>
      
      {/* Footer / User Profile Area */}
      <div className="pt-4 border-t border-gray-700">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700/50 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
             <User className="w-5 h-5 text-gray-300"/>
          </div>
          <span className="font-semibold flex-1">{user?.name ?? "User"}</span>
           <button onClick={onLogout} className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-md">
                <LogOut className="w-5 h-5" />
           </button>
        </div>
      </div>
    </div>
  );
}