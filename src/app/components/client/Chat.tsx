'use client';
import React from 'react'
import { useState, useRef, useEffect } from 'react';
import { Bot, User, CornerDownLeft, Paperclip, AlertTriangle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { newObjectIdAction, sendMessageToAIAction, generateTitleAction, saveChatToDbAction, updateChatModelAction } from '../actions/dbActions'
import {readStreamableValue} from 'ai/rsc'
import ModelDropdown, {LLMModel, llmModels } from './ModelDropdown';


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
  model:string
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

// Model Change Confirmation Modal
function ModelChangeModal({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  currentModel, 
  newModel 
}: {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  currentModel: string;
  newModel: string;
}) {
  if (!isOpen) return null;

  const currentModelName = llmModels.find(m => m.id === currentModel)?.name || currentModel;
  const newModelName = llmModels.find(m => m.id === newModel)?.name || newModel;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full"
      >
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Change Chat Model?</h3>
            <p className="text-gray-300 text-sm">
              You're switching from <span className="font-medium text-purple-400">{currentModelName}</span> to{' '}
              <span className="font-medium text-purple-400">{newModelName}</span>.
            </p>
            <p className="text-gray-400 text-sm mt-2">
              This will transfer all conversation context to the new model. The change will be saved permanently.
            </p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
          >
            Change Model
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Chat({ activeChat, user, setActiveChat, setChatList }: ChatProps) {
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(llmModels[0]);
  const [showModelChangeModal, setShowModelChangeModal] = useState(false);
  const [pendingModelChange, setPendingModelChange] = useState<LLMModel | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isSending, setIsSending] = useState(false);

  // Update selected model when active chat changes
  useEffect(() => {
    if (activeChat?.model) {
      const chatModel = llmModels.find(m => m.id === activeChat.model);
      if (chatModel) {
        setSelectedModel(chatModel);
      }
    }
  }, [activeChat]);

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

  const handleModelChange = async (newModel: LLMModel) => {
    // If no active chat or same model, just update selected model
    if (!activeChat || activeChat.model === newModel.id) {
      setSelectedModel(newModel);
      return;
    }

    // If different model and existing chat, show confirmation
    setPendingModelChange(newModel);
    setShowModelChangeModal(true);
  };

  const confirmModelChange = async () => {
    if (!pendingModelChange || !activeChat || !user?.email) return;

    try {
      // Update chat model in database
      const updateResult = await updateChatModelAction(activeChat._id, pendingModelChange.id, user);
      
      if (updateResult.success) {
        // Update local state
        const updatedChat = { ...activeChat, model: pendingModelChange.id };
        setActiveChat(updatedChat);
        
        // Update chat list
        setChatList(prev => 
          prev.map(chat => 
            chat._id === activeChat._id 
              ? { ...chat, model: pendingModelChange.id }
              : chat
          )
        );
        
        setSelectedModel(pendingModelChange);
      } else {
        console.error('Failed to update chat model:', updateResult.error);
        // Optionally show error message to user
      }
    } catch (error) {
      console.error('Error updating chat model:', error);
    }

    setShowModelChangeModal(false);
    setPendingModelChange(null);
  };

  const cancelModelChange = () => {
    setShowModelChangeModal(false);
    setPendingModelChange(null);
  };

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
          model: selectedModel.id, // Set model for new chat
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
            <h1 className="text-xl font-bold">Multi AI Chat</h1>
            <ModelDropdown 
              selectedModel={selectedModel} 
              onModelSelect={handleModelChange} 
            />
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
        <ModelDropdown 
          selectedModel={selectedModel} 
          onModelSelect={handleModelChange} 
        />
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

      {/* Model Change Confirmation Modal */}
      <ModelChangeModal
        isOpen={showModelChangeModal}
        onConfirm={confirmModelChange}
        onCancel={cancelModelChange}
        currentModel={activeChat.model}
        newModel={pendingModelChange?.id || ''}
      />
    </div>
  );
}
