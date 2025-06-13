'use client';

import { Plus, MessageSquare, LogOut, User } from 'lucide-react';
import React from 'react';

// Mock data for chat history
const mockChats = [
  { id: 'chat-1', title: 'Frontend CSS Help' },
  { id: 'chat-2', title: 'Python script for automation' },
  { id: 'chat-3', title: 'Next.js API routes explanation' },
];

type SidebarProps = {
  activeChatId: string | null;
  setActiveChatId: React.Dispatch<React.SetStateAction<string | null>>;
  onLogout: () => void;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
};

export default function Sidebar({ activeChatId, setActiveChatId, onLogout }: SidebarProps) {


  return (
    <div className="flex flex-col w-72 bg-gray-800 border-r border-gray-700 p-4">
      {/* New Chat Button */}
      <button 
        onClick={() => setActiveChatId(null)}
        className="flex items-center justify-center gap-2 w-full px-4 py-3 mb-6 bg-blue-600 rounded-lg font-semibold hover:bg-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        <Plus className="w-5 h-5" />
        New Chat
      </button>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-2 -mr-2">
        <h2 className="text-sm font-semibold text-gray-400 px-2 mb-2">Recent</h2>
        {mockChats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => setActiveChatId(chat.id)}
            className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              activeChatId === chat.id
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
          <span className="font-semibold flex-1">Demo User</span>
           <button onClick={onLogout} className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-md">
                <LogOut className="w-5 h-5" />
           </button>
        </div>
      </div>
    </div>
  );
}