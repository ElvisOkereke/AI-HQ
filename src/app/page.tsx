'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './components/client/Sidebar';
import Chat from "./components/client/Chat";
import { Bot } from 'lucide-react';

export default function HomePage() {
  // NextAuth
  const [isLoggedIn, setIsLoggedIn] = useState(true); 
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const router = useRouter();

  // A simple function to toggle login state
  const handleLogout = () => setIsLoggedIn(false);

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white font-sans">
        <div className="text-center">
            <Bot className="w-24 h-24 text-purple-400 mx-auto mb-6" />
            <h1 className="text-4xl font-bold mb-2">Welcome to Multi AI Chat</h1>
            <p className="text-gray-400 mb-8">Log in to begin your conversation with the future of AI.</p>
            <div className="flex gap-4 justify-center">
                 <button 
                    onClick={() => router.push('/login')}
                    className="px-6 py-3 bg-blue-600 rounded-lg font-semibold hover:bg-blue-500 transition-colors"
                >
                    Login
                </button>
                 <button 
                    onClick={() => router.push('/signup')}
                    className="px-6 py-3 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                >
                    Sign Up
                </button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white font-sans">
      <Sidebar 
        activeChatId={activeChatId} 
        setActiveChatId={setActiveChatId} 
        onLogout={handleLogout}
      />
      <main className="flex-1 flex flex-col">
        {/* The 'key' prop is a powerful React trick. When it changes, React
            will unmount the old component and mount a new one, effectively
            resetting its state. This is perfect for switching between chats. */}
        <Chat key={activeChatId || 'new'} chatId={activeChatId} />
      </main>
    </div>
  );
}