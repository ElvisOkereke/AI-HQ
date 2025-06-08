'use client';
import React from 'react'
import { useState, useRef, useEffect } from 'react';
import { Bot, User, CornerDownLeft, Paperclip, Mic, ChevronDown, WandSparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { sendMessageAction } from '../actions/dbActions'
// Message type definition
type Message = {
  id: number;
  text: string;
  sender: string;
  isStreaming?: boolean;
};

// Mock data for demonstration
const mockMessages: Message[] = [
  { id: 1, text: "Hello! I'm a Llama 2, ready to assist you. What can I help you with today?", sender: 'ai' },
  { id: 2, text: "I'm creating a chat app and need help with the frontend.", sender: 'user' },
];

const llmModels = [
    { id: 'gpt-4o', name: 'GPT-4o', icon: WandSparkles },
    { id: 'claude-3-opus', name: 'Claude 3 Opus', icon: WandSparkles },
    { id: 'llama-3', name: 'Llama 3', icon: WandSparkles },
];

function WelcomeScreen() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="p-4 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 mb-4">
                <Bot className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white">How can I help you today?</h2>
            {/* You can add example prompts here */}
        </div>
    );
}

export default function Chat({chatId}: {chatId: string | null}) {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(llmModels[0]);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

useEffect(() => {
    if (chatId) {
      // In a real app: fetchMessages(chatId);
      // For demo:
      setMessages([
        { id: 1, text: `Loaded conversation for chat ID: ${chatId}. How can I help?`, sender: 'ai' }
      ]);
    } else {
      setMessages([]);
    }
  }, [chatId]);

  const handleSend = () => {
    if (input.trim() !== '') {
      setMessages([...messages, { id: Date.now(), text: input, sender: 'user' }]);
      setInput('');
      // Simulate AI response after a short delay
      setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now() + 1, text: `This is a simulated response from ${selectedModel.name}.`, sender: 'ai', isStreaming: true }]);
      }, 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!chatId && messages.length === 0) {
    return (
        <div className="flex flex-col h-full bg-gray-900">
            <WelcomeScreen />
            {/* Render the input footer on the welcome screen too */}
            <footer className="p-4">
                <div className="max-w-3xl mx-auto">
                    {/* The modern "container" that looks like a textbox */}
                    <div className="relative rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg p-2">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Ask anything..."
                            className="w-full bg-transparent p-3 pr-20 text-gray-100 placeholder-gray-400 focus:outline-none resize-none"
                            rows={1}
                        />
                        <div className="absolute right-3 bottom-3 flex items-center gap-2">
                            <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                                <Paperclip className="w-5 h-5" />
                            </button>
                            <button onClick={handleSend} className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-500 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed" disabled={!input.trim()}>
                                <CornerDownLeft className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <p className="text-xs text-center text-gray-500 mt-2">
                    AI can make mistakes. Consider checking important information.
                    </p>
                </div>
            </footer>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 font-sans">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">Multi AI Chat</h1>
        <div className="relative">
            <button
                onClick={() => setDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
                <WandSparkles className="w-5 h-5 text-purple-400" />
                <span>{selectedModel.name}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
            {isDropdownOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10"
                >
                    {llmModels.map(model => (
                        <a
                            key={model.id}
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                setSelectedModel(model);
                                setDropdownOpen(false);
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                        >
                            <model.icon className="w-4 h-4 text-purple-400"/>
                            {model.name}
                        </a>
                    ))}
                </motion.div>
            )}
            </AnimatePresence>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto p-6 space-y-8">
        {messages.map((msg, index) => (
          <div key={msg.id} className={`flex items-start gap-4 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
            {msg.sender === 'ai' && (
              <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500 rounded-full">
                <Bot className="w-6 h-6 text-white" />
              </div>
            )}
            <div className={`max-w-xl p-4 rounded-xl ${
              msg.sender === 'user'
                ? 'bg-blue-600 rounded-br-none'
                : 'bg-gray-700 rounded-bl-none'
            }`}>
              <p className="whitespace-pre-wrap">
                {msg.text}
                {/* Streaming Indicator */}
                {msg.isStreaming && <span className="inline-block w-2 h-4 bg-white ml-2 animate-pulse rounded-full" />}
              </p>
            </div>
             {msg.sender === 'user' && (
              <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-gray-600 rounded-full">
                <User className="w-6 h-6 text-gray-300" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      {/* Message Input Area */}
      <footer className="p-4">
        <div className="max-w-3xl mx-auto">
            {/* The modern "container" that looks like a textbox */}
            <div className="relative rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg p-2">
                 <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask anything..."
                    className="w-full bg-transparent p-3 pr-20 text-gray-100 placeholder-gray-400 focus:outline-none resize-none"
                    rows={1}
                />
                <div className="absolute right-3 bottom-3 flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                        <Paperclip className="w-5 h-5" />
                    </button>
                    <button onClick={handleSend} className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-500 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed" disabled={!input.trim()}>
                        <CornerDownLeft className="w-5 h-5" />
                    </button>
                </div>
            </div>
            <p className="text-xs text-center text-gray-500 mt-2">
              AI can make mistakes. Consider checking important information.
            </p>
        </div>
      </footer>
    </div>
  );
}
