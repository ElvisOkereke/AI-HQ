'use client';
import { useEffect, useRef } from 'react';
import ModelDropdown from './ModelDropdown';
import { ChatProps } from "../../types/types";
import { WelcomeScreen } from './chat/WelcomeScreen';
import { ModelChangeModal } from './chat/ModelChangeModal';
import { MessageBubble } from './chat/MessageBubble';
import { ChatComposer } from './chat/ChatComposer';
import { useChatActions } from './chat/useChatActions';

export default function ChatComponent({ activeChat, user, setActiveChat, setChatList, extraModels }: ChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    input,
    setInput,
    selectedModel,
    isSending,
    pendingMedia,
    showModelChangeModal,
    pendingModelChange,
    handleCopyMessage,
    handleDownloadImage,
    handleEditMessage,
    handleDeleteMessage,
    handleRegenerateMessage,
    handleBranchChat,
    handleModelChange,
    confirmModelChange,
    cancelModelChange,
    removePendingMedia,
    handleFileUpload,
    handleSend,
    handleKeyPress,
  } = useChatActions({ activeChat, user, setActiveChat, setChatList, extraModels });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isSending) scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChat]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  if (!activeChat) { // show new chat screen
    return (
      <div className="flex flex-col h-full bg-gray-900">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold">Multi AI Chat</h1>
          <ModelDropdown
            selectedModel={selectedModel}
            onModelSelect={handleModelChange}
            disabled={user?.isGuest}
            extraModels={extraModels}
          />
        </header>
        <WelcomeScreen />
        <ChatComposer
          input={input}
          onInputChange={setInput}
          onSend={handleSend}
          onKeyDown={handleKeyPress}
          isSending={isSending}
          pendingMedia={pendingMedia}
          onRemovePendingMedia={removePendingMedia}
          onFileUpload={handleFileUpload}
          textareaRef={textareaRef}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 font-sans">
      {/* Header */}
      <header className="flex items-center justify-between p-2 sm:p-4 border-b border-gray-700">
        <h1 className="text-lg sm:text-xl font-bold truncate flex-1 mr-2">{activeChat.title}</h1>
        <ModelDropdown
          selectedModel={selectedModel}
          onModelSelect={handleModelChange}
          disabled={user?.isGuest}
        />
      </header>
      <main className="flex-1 overflow-y-auto p-2 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 lg:space-y-8 chat-scrollbar">
        <style jsx global>{`
          .chat-scrollbar::-webkit-scrollbar {
        width: 10px;
        background: #23272f;
        border-radius: 8px;
          }
          .chat-scrollbar::-webkit-scrollbar-thumb {
        background: #444857;
        border-radius: 8px;
          }
          .chat-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #63677a;
          }
          .chat-scrollbar {
        scrollbar-width: thick;
        scrollbar-color: #444857 #23272f;
          }
        `}</style>
        {activeChat.chatHistory.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            activeChat={activeChat}
            onCopy={handleCopyMessage}
            onRegenerate={handleRegenerateMessage}
            onBranch={handleBranchChat}
            onDelete={handleDeleteMessage}
            onDownload={handleDownloadImage}
            onEdit={handleEditMessage}
          />
        ))}
        <div ref={messagesEndRef} />
      </main>

      <ChatComposer
        input={input}
        onInputChange={setInput}
        onSend={handleSend}
        onKeyDown={handleKeyPress}
        isSending={isSending}
        pendingMedia={pendingMedia}
        onRemovePendingMedia={removePendingMedia}
        onFileUpload={handleFileUpload}
        textareaRef={textareaRef}
      />

      {/* Model Change Confirmation Modal */}
      <ModelChangeModal
        isOpen={showModelChangeModal}
        onConfirm={confirmModelChange}
        onCancel={cancelModelChange}
        currentModel={activeChat.model}
        newModel={pendingModelChange?.id || ''}
        extraModels={extraModels}
      />
    </div>
  );
}
