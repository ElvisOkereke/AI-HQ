'use client';
import React from 'react'
import { useState, useRef, useEffect } from 'react';
import { Building2, User, CornerDownLeft, Paperclip, AlertTriangle, X, FileText, Image, CheckCircle, Loader2, Copy, Check, Menu, MoreHorizontal, RefreshCw, GitBranch, Download, Edit, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { newObjectIdAction, sendMessageToAIAction, generateTitleAction, saveChatToDbAction, updateChatModelAction } from '../actions/dbActions'
import { readStreamableValue } from 'ai/rsc'
import ModelDropdown, { llmModels } from './ModelDropdown';
import { ChatProps, Attachment, Message, LLMModel, Chat} from "../../types/types"
import {MessageContent, MessageMenu} from './MessageFormatting';
import { FileUploadButton } from './FileUpload';


function WelcomeScreen() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <div className="p-4 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 mb-4">
                <Building2 className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white">How can I help you today?</h2>
            {/* add example prompts here later */}
        </div>
    );
}

function AttachmentPreview({ 
  attachment, 
  onRemove 
}: { 
  attachment: Attachment; 
  onRemove: (id: number) => void;
}) {
  const isImage = attachment.fileType.startsWith('image/');
  const fileName = attachment.fileName || (isImage ? 'Image' : 'Text file');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="flex items-center gap-2 bg-gray-700 rounded-lg p-2 border border-gray-600"
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {isImage ? (
          <Image className="w-4 h-4 text-blue-400 flex-shrink-0" />
        ) : (
          <FileText className="w-4 h-4 text-green-400 flex-shrink-0" />
        )}
        <span className="text-sm text-gray-300 truncate">{fileName}</span>
      </div>
      <button
        onClick={() => onRemove(attachment.id)}
        className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
        title="Remove attachment"
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  );
}

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

export default function ChatComponent({ activeChat, user, setActiveChat, setChatList }: ChatProps) {
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(llmModels[0]);
  const [showModelChangeModal, setShowModelChangeModal] = useState(false);
  const [pendingModelChange, setPendingModelChange] = useState<LLMModel | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [editingMessage, setEditingMessage] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

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
    if (isSending) scrollToBottom();
  }, [activeChat]);

  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleDownloadImage = (content: string) => {
    const link = document.createElement('a');
    link.href = content;
    link.download = `image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditMessage = (messageId: number, content: string) => {
    setEditingMessage(messageId);
    setEditText(content);
  };

  const handleSaveEdit = async (messageId: number) => {
    if (!activeChat || !user?.email) return;
    
    if (editText.trim() === '') {
      if (confirm('Delete this message? This action cannot be undone.')) {
        handleDeleteMessage(messageId);
      }
      return;
    }

    const updatedChat = {
      ...activeChat,
      chatHistory: activeChat.chatHistory.map(msg =>
        msg.id === messageId ? { ...msg, content: editText } : msg
      )
    };
    
    setActiveChat(updatedChat);
    setEditingMessage(null);
    setEditText('');
    
    try {
      await saveChatToDbAction(updatedChat, user);
      setChatList(prev => 
        prev.map(chat => 
          chat._id === activeChat._id ? updatedChat : chat
        )
      );
    } catch (error) {
      console.error('Error saving edited message:', error);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!activeChat || !user?.email) return;
    
    const updatedChat = {
      ...activeChat,
      chatHistory: activeChat.chatHistory.filter(msg => msg.id !== messageId)
    };
    
    setActiveChat(updatedChat);
    
    try {
      await saveChatToDbAction(updatedChat, user);
      setChatList(prev => 
        prev.map(chat => 
          chat._id === activeChat._id ? updatedChat : chat
        )
      );
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleRegenerateMessage = async (messageId: number) => {
    if (!activeChat || !user?.email) return;
    
    const messageIndex = activeChat.chatHistory.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return;
    
    // Remove the message and all subsequent messages
    const updatedHistory = activeChat.chatHistory.slice(0, messageIndex);
    const updatedChat = { ...activeChat, chatHistory: updatedHistory };
    setActiveChat(updatedChat);
    
    // Regenerate from the previous user message
    const lastUserMessage = updatedHistory.slice().reverse().find(msg => msg.role === 'user');
    if (lastUserMessage) {
      setIsSending(true);
      // Trigger regeneration logic similar handleSend
    }
  };

  const handleBranchChat = async (messageId: number) => {
    if (!activeChat || !user?.email) return;
    
    const messageIndex = activeChat.chatHistory.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return;
    
    // Create new chat with history up to this message
    const branchedHistory = activeChat.chatHistory.slice(0, messageIndex + 1);
    const idResp = await newObjectIdAction();
    
    if (idResp.success && idResp.data) {
      const newId = JSON.parse(idResp.data);
      const branchedChat = {
        _id: newId,
        title: `${activeChat.title} (Branch)`,
        model: activeChat.model,
        chatHistory: branchedHistory,
        attachments: activeChat.attachments
      };
      
      try {
        await saveChatToDbAction(branchedChat, user);
        setChatList(prev => [...prev, branchedChat]);
        setActiveChat(branchedChat);
      } catch (error) {
        console.error('Error creating branch:', error);
      }
    }
  };

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

  const removeAttachment = (id: number) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const handleFileUpload = (fileData: string, fileType: string, fileName: string) => {
    setAttachments(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(), // More unique ID
        fileData,
        fileType,
        fileName
      }
    ]);
  };

  const handleSend = async () => {
    if (input.trim() === '' || isSending) return;
    if (!user?.email) throw new Error('Something went wrong, user not authenticated');
    try {
      const messageInput = input;
      let messageAttachments = [] as Attachment[];
      
      setInput('');
      
      setIsSending(true);

      const id = Date.now()

      const userMessage: Message = { id: id, content: messageInput, role: 'user'};

      if (attachments.length > 0){
      messageAttachments = attachments.map(att => ({ ...att, id: id }));
      //setAttachments(updatedAttachments);
      setAttachments([]); // Clear attachments after sending
      }
      

      let chatToUpdate = activeChat;
      if (activeChat) {
        chatToUpdate = { ...activeChat, chatHistory: [...activeChat.chatHistory, userMessage], attachments: [...activeChat.attachments, ...messageAttachments] };
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
            model: selectedModel.id,
            attachments: messageAttachments
          };
          setActiveChat(chatToUpdate);
        } else throw new Error( idResp.error ? idResp.error :"No id error, " + titleResp.error ? idResp.error : "No title error.");
      }
      
      
      // Call the Server Action
      const result = await sendMessageToAIAction(selectedModel.id, chatToUpdate, user);

      // Add AI placeholder message
      const aiMessagePlaceholder: Message = {
        id: Date.now() + 1,
        content: '',
        role: 'model',
        isStreaming: true,
      };
      chatToUpdate = {
        ...chatToUpdate,
        chatHistory: [...chatToUpdate.chatHistory, aiMessagePlaceholder],
      };
      setActiveChat(chatToUpdate);
      
      let fullResponse = '';

      if (result.success && result.data) {
        let lastContent = '';
        let lastStreaming = true;
        for await (const delta of readStreamableValue(result.data.stream)) {
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

        let imgResponse = "";

        if (result.data.img) {
          for await (const delta of readStreamableValue(result.data.img)) {
            imgResponse += delta;
          }
          if (imgResponse) {
            // Add AI image message after streaming is complete
            const aiImageMessage: Message = {
              id: Date.now() + 2,
              content: `data:image/png;base64,${imgResponse}`,
              role: 'model',
              isStreaming: false,
            };
            chatToUpdate = {
              ...chatToUpdate,
              chatHistory: [...chatToUpdate.chatHistory, aiImageMessage],
            };
            setActiveChat(chatToUpdate);
          }
        }
      } else {
        // Handle error: show an error message in the chat

        chatToUpdate.chatHistory.pop(); //remove old placeholder
        setActiveChat(chatToUpdate)// update both


        const errorMessage: Message = { id: Date.now() + 1, content: `Youve probably reached token limit by having too much context or images in this chat try starting a new chat.\nError: ${result.error}`, role: 'model', isStreaming: false };
        chatToUpdate.chatHistory.push(errorMessage);
        setActiveChat(prev => {
          if (!prev) return ({
            _id: 'error-chat',
            title: 'Error Chat',
            model: selectedModel.id,
            chatHistory: [errorMessage],
            attachments: [],
          });
          return { ...prev, chatHistory: [...prev.chatHistory, errorMessage] };
        });
        
        
      } 
      console.log(chatToUpdate.attachments)

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

    } catch(error) {
      // Remove placeholder message if it exists
      if (activeChat && activeChat.chatHistory[activeChat.chatHistory.length-1].role === 'model' && activeChat.chatHistory[activeChat.chatHistory.length-1].content === "") {
        activeChat.chatHistory.pop();
      }
      
      const errorMessage: Message = { 
        id: Date.now() + 1, 
        content: `You've probably reached token limit by having too much context or images in this chat. Try starting a new chat.\nError: ${error instanceof Error ? error.message : String(error)}`, 
        role: 'model', 
        isStreaming: false 
      };
      
      setIsSending(false);
      
      let chatToUpdate: Chat;
      
      if (!activeChat) {
        // Create new error chat
        chatToUpdate = {
          _id: 'error-chat',
          title: 'Error Chat',
          model: selectedModel.id,
          chatHistory: [errorMessage],
          attachments: [],
        };
        setActiveChat(chatToUpdate);
      } else {
        // Update existing chat
        chatToUpdate = {
          ...activeChat,
          chatHistory: [...activeChat.chatHistory, errorMessage],
        };
        setActiveChat(chatToUpdate);
      }
      
      // Save the updated chat to database
      try {
        const saveResp = await saveChatToDbAction(chatToUpdate, user);
        if (!saveResp.success) {
          console.error("Could not save error chat to DB:", saveResp.error);
          // Optionally show user notification about save failure
        }
      } catch (saveError) {
        console.error("Error saving chat to DB:", saveError);
      }
    }
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
            {/* Input Footer */}
            <footer className="p-4">
              <div className="max-w-3xl mx-auto">
                {/* Attachments Preview */}
                <AnimatePresence>
                  {attachments.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-3"
                    >
                      <div className="flex flex-wrap gap-2">
                        {attachments.map((attachment) => (
                          <AttachmentPreview
                            key={attachment.id}
                            attachment={attachment}
                            onRemove={removeAttachment}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Input Container */}
                <div className="relative rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg p-2">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask anything..."
                    className="w-full bg-transparent p-3 pr-20 text-gray-100 placeholder-gray-400 focus:outline-none resize-none"
                    rows={1}
                    disabled={isSending}
                  />
                  <div className="absolute right-3 bottom-3 flex items-center gap-2">
                    <FileUploadButton onFileUpload={handleFileUpload} />
                    <button 
                      onClick={handleSend} 
                      className={`p-3 rounded-full transition-colors ${
                        !input.trim() || isSending
                          ? 'bg-gray-500 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-500'
                      } text-white`}
                      disabled={!input.trim() || isSending}
                    >
                      {isSending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <CornerDownLeft className="w-5 h-5" />
                      )}
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
        <h1 className="text-xl font-bold">{activeChat.title}</h1>
        <ModelDropdown 
          selectedModel={selectedModel} 
          onModelSelect={handleModelChange} 
        />
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto p-6 space-y-8">
        {activeChat.chatHistory.map((msg, index) => (
          <div
            key={msg.id}
            className={`flex items-start gap-4 group ${msg.role === 'user' ? 'justify-end' : ''}`}
          >
            {msg.role === 'ai' && (
              <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500 rounded-full">
                <Building2 className="w-6 h-6 text-white" />
              </div>
            )}
            <div className={`relative max-w-xl p-4 rounded-xl ${
              msg.role === 'user'
                ? 'bg-blue-600 rounded-br-none'
                : 'bg-gray-700 rounded-bl-none'
            }`}>
              {/^data:image\/[a-zA-Z]+;base64,/.test(msg.content) ? (
                <img
                  src={msg.content}
                  alt="attachment"
                  className="max-w-xs max-h-64 rounded-lg border border-gray-600"
                />
              ) : (
                <div>
                  <MessageContent content={msg.content} />
                  {/* Streaming Indicator */}
                  {msg.isStreaming && <span className="inline-block w-2 h-4 bg-white ml-2 animate-pulse rounded-full" />}
                </div>
              )}
              {/* Message Menu */}
              <div className="absolute bottom-2 right-2">
                <MessageMenu
                  message={msg}
                  onCopy={() => handleCopyMessage(msg.content)}
                  onRegenerate={msg.role !== 'user' ? () => handleRegenerateMessage(msg.id) : undefined}
                  onBranch={msg.role !== 'user' ? () => handleBranchChat(msg.id) : undefined}
                  onDelete={() => handleDeleteMessage(msg.id)}
                  onDownload={/^data:image\/[a-zA-Z]+;base64,/.test(msg.content) ? () => handleDownloadImage(msg.content) : undefined}
                  onEdit={msg.role === 'user' ? () => handleEditMessage(msg.id, msg.content) : undefined}
                />
              </div>
            </div>
            {msg.role === 'user' && (
              <div className="mt-4 w-10 h-10 flex-shrink-0 flex items-center justify-center bg-gray-600 rounded-full">
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
          {/* Attachments Preview */}
          <AnimatePresence>
            {attachments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3"
              >
                <div className="flex flex-wrap gap-2">
                  {attachments.map((attachment) => (
                    <AttachmentPreview
                      key={attachment.id}
                      attachment={attachment}
                      onRemove={removeAttachment}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Container */}
          <div className="relative rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg p-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask anything..."
              className="w-full bg-transparent p-3 pr-20 text-gray-100 placeholder-gray-400 focus:outline-none resize-none"
              rows={1}
              disabled={isSending}
            />
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              <FileUploadButton onFileUpload={handleFileUpload} />
              <button 
                onClick={handleSend} 
                className={`p-3 rounded-full transition-colors ${
                  !input.trim() || isSending
                    ? 'bg-gray-500 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-500'
                } text-white`}
                disabled={!input.trim() || isSending}
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CornerDownLeft className="w-5 h-5" />
                )}
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