'use client';
import React, { act } from 'react'
import { useState, useRef, useEffect } from 'react';
import { Bot, User, CornerDownLeft, Paperclip, Mic, ChevronDown, WandSparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { newObjectIdAction, sendMessageToAIAction, generateTitleAction, saveChatToDbAction } from '../actions/dbActions'
import {readStreamableValue} from 'ai/rsc'
import ModelDropdown, { llmModels } from './ModelDropdown';

// Message type definition
type Message = {
  id: number;
  content: string;
  role: string;
  isStreaming?: boolean;
};

type ChatProps = {
  key: string | null;
  activeChat: Chat | undefined;
  user?: {
    name?: string | null;
    email?: string | null;
  };
  setActiveChat: React.Dispatch<React.SetStateAction<Chat | undefined>>;
  setChatList: React.Dispatch<React.SetStateAction<Chat[]>>;
}
type Chat = {
  _id: any; // this is any because I dont want to import {ObjectId} from mongo on every client component, I think that increases bundle size, im never working with this property, only setting a new one on chat creation
  title: string;
  chatHistory: Message[];
  //add model parameter to track what model each chat is for
}


function WelcomeScreen() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="p-4 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 mb-4">
                <Bot className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white">How can I help you today?</h2>
            {/* add example prompts here later */}
        </div>
    );
}

export default function Chat({ activeChat, user, setActiveChat, setChatList }: ChatProps) {
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(llmModels[0]);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isSending, setIsSending] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat]);

  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);



  const handleSend = async () => {
    if (input.trim() === '' || isSending) return;
    if (!user?.email) throw new Error('Something went wrong, user not authenticated');
    setInput('');
    setIsSending(true);

    const userMessage: Message = { id: Date.now(), content: input, role: 'user' };

    let chatToUpdate = activeChat;
    if (activeChat) {
      chatToUpdate = { ...activeChat, chatHistory: [...activeChat.chatHistory, userMessage] };
      setActiveChat(chatToUpdate);
    } else {
      const idResp = await newObjectIdAction();
      const titleResp = await generateTitleAction(selectedModel.id, userMessage);
      if (idResp.success && idResp.data && titleResp.success && titleResp.data) {
        const id = JSON.parse(idResp.data);
        const title = titleResp.data;
        chatToUpdate = {
          _id: id,
          title: title,
          chatHistory: [userMessage],
        };
        setActiveChat(chatToUpdate);
      } else throw new Error("Error creating ID for new chat");
    }

    // Add AI placeholder message
    const aiMessagePlaceholder: Message = {
      id: Date.now() + 1,
      content: '',
      role: 'model',
      isStreaming: true,
    };
    chatToUpdate = {
      ...chatToUpdate!,
      chatHistory: [...chatToUpdate!.chatHistory, aiMessagePlaceholder],
    };
    setActiveChat(chatToUpdate);

    // Call the Server Action
    const result = await sendMessageToAIAction(selectedModel.id, chatToUpdate, user);
    let fullResponse = '';

    if (result.success && result.data) {
      let lastContent = '';
      let lastStreaming = true;
      for await (const delta of readStreamableValue(result.data)) {
        fullResponse += delta;
        lastContent = fullResponse;
        // Update the AI message in chatHistory
        setActiveChat(prev => {
          if (!prev) return prev;
          const updatedHistory = prev.chatHistory.map((msg, idx) =>
            idx === prev.chatHistory.length - 1
              ? { ...msg, content: lastContent, isStreaming: lastStreaming }
              : msg
          );
          return { ...prev, chatHistory: updatedHistory };
        });
      }
      // Finalize the AI message state
      lastStreaming = false;
      setActiveChat(prev => {
        if (!prev) return prev;
        const updatedHistory = prev.chatHistory.map((msg, idx) =>
          idx === prev.chatHistory.length - 1
            ? { ...msg, content: lastContent, isStreaming: lastStreaming }
            : msg
        );
        return { ...prev, chatHistory: updatedHistory };
      });
      chatToUpdate.chatHistory[chatToUpdate.chatHistory.length-1].content = fullResponse
      chatToUpdate.chatHistory[chatToUpdate.chatHistory.length-1].isStreaming = false
    } else {
      // Handle error: show an error message in the chat
      const errorMessage: Message = { id: Date.now() + 1, content: `Error: ${result.error}`, role: 'model' };
      setActiveChat(prev => {
        if (!prev) return prev;
        return { ...prev, chatHistory: [...prev.chatHistory, errorMessage] };
      });
    } 

    const saveResp = await saveChatToDbAction(chatToUpdate, user);
    if (!saveResp.success) throw new Error("Could not save chat to DB!" + saveResp.error);

    console.log(saveResp.data);

    setChatList(
      prev => {
        const existingIndex = prev.findIndex(chat => chat._id === chatToUpdate._id);
        if (existingIndex !== -1) {
          // Update existing chat
          const updatedChats = [...prev];
          updatedChats[existingIndex] = chatToUpdate;
          return updatedChats;
        } else {
          // Add new chat
          return [...prev, chatToUpdate];
        }
      }
    )

    setIsSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!activeChat) {//show new chat screen
    return (
        <div className="flex flex-col h-full bg-gray-900">
          {/* Header */}
          <header className="flex items-center justify-between p-4 border-b border-gray-700">
            <h1 className="text-xl font-bold">AI.hq</h1>
            <div className="relative">
                <ModelDropdown  selectedModel={selectedModel}  onModelSelect={setSelectedModel} />
            </div>
          </header>
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
            <ModelDropdown  selectedModel={selectedModel}  onModelSelect={setSelectedModel} />
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto p-6 space-y-8">
        {activeChat.chatHistory.map((msg, index) => (
          <div key={msg.id} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'ai' && (
              <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500 rounded-full">
                <Bot className="w-6 h-6 text-white" />
              </div>
            )}
            <div className={`max-w-xl p-4 rounded-xl ${
              msg.role === 'user'
                ? 'bg-blue-600 rounded-br-none'
                : 'bg-gray-700 rounded-bl-none'
            }`}>
              <p className="whitespace-pre-wrap">
                {msg.content}
                {/* Streaming Indicator */}
                {msg.isStreaming && <span className="inline-block w-2 h-4 bg-white ml-2 animate-pulse rounded-full" />}
              </p>
            </div>
             {msg.role === 'user' && (
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
