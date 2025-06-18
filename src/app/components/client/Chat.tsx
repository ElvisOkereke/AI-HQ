// Chat.tsx
'use client';
import React from 'react'
import { useState, useRef, useEffect } from 'react';
import { Building2, User, CornerDownLeft, Paperclip, AlertTriangle, X, FileText, Image, CheckCircle, Loader2, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { newObjectIdAction, sendMessageToAIAction, generateTitleAction, saveChatToDbAction, updateChatModelAction } from '../actions/dbActions'
import { readStreamableValue } from 'ai/rsc'
import ModelDropdown, { llmModels } from './ModelDropdown';
import { ChatProps, Attachment, Message, LLMModel } from "../../types/types"
import SyntaxHighlighter from 'react-syntax-highlighter';
import { monokaiSublime } from 'react-syntax-highlighter/dist/esm/styles/hljs'; // Import Monokai Sublime

function WelcomeScreen() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="p-4 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 mb-4">
                <Building2 className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white">How can I help you today?</h2>
            {/* add example prompts here later */}
        </div>
    );
}

// Code Block Component with Monokai Pro Styling for SyntaxHighlighter
function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const validLanguage = language && Object.prototype.hasOwnProperty.call(monokaiSublime, language) ? language : 'plaintext';

  return (
    <div className="group my-4 w-full text-sm font-sans">
      {/* Sticky header for the code block */}
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2 rounded-t-lg border-b border-gray-700 sticky top-0 z-10">
        <span className="text-gray-400 font-mono">
          {language || 'code'}
        </span>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-2 px-3 py-1 text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy
            </>
          )}
        </button>
      </div>
      {/* SyntaxHighlighter for the code content */}
      <SyntaxHighlighter
        language={validLanguage}
        style={monokaiSublime}
        customStyle={{
          padding: '1rem',
          margin: '0', 
          borderRadius: '0 0 0.5rem 0.5rem',
          overflowX: 'auto', 
          maxHeight: '400px', 
          border: '1px solid #383830', 
          borderTop: 'none',
          backgroundColor: '#272822', 
        }}
        codeTagProps={{ className: 'font-mono' }} 
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

// Enhanced Message Content Component with Markdown-like formatting
function MessageContent({ content }: { content: string }) {
  const parseContent = (text: string) => {
    const parts: Array<{ type: string; content: string; language?: string; key: string }> = [];
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex, match.index),
          key: `text-${lastIndex}`
        });
      }

      parts.push({
        type: 'codeblock',
        content: match[2].trim(),
        language: match[1] || undefined,
        key: `code-${match.index}`
      });

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex),
        key: `text-${lastIndex}`
      });
    }

    return parts.length > 0 ? parts : [{ type: 'text', content: text, key: 'text-0' }];
  };

  const renderInlineFormatting = (text: string): (React.ReactNode | string)[] => {
    const parts: (React.ReactNode | string)[] = [];
    let currentIndex = 0;
    const inlineRegex = /(`[^`]+`)|(\*\*[^*]+\*\*)|(__[^_]+__)|(\*[^*]+\*)|(\_[^_]+\_)/g;
    let match;

    while ((match = inlineRegex.exec(text)) !== null) {
      if (match.index > currentIndex) {
        parts.push(text.substring(currentIndex, match.index));
      }

      const fullMatch = match[0];
      
      if (fullMatch.startsWith('`') && fullMatch.endsWith('`')) {
        parts.push(
          <code key={`inline-code-${match.index}`} className="bg-gray-800 text-blue-300 px-1.5 py-0.5 rounded text-xs font-mono">
            {fullMatch.slice(1, -1)}
          </code>
        );
      } else if ((fullMatch.startsWith('**') && fullMatch.endsWith('**')) || (fullMatch.startsWith('__') && fullMatch.endsWith('__'))) {
        parts.push(
          <strong key={`bold-${match.index}`} className="font-bold text-white">
            {fullMatch.slice(2, -2)}
          </strong>
        );
      } else if ((fullMatch.startsWith('*') && fullMatch.endsWith('*')) || (fullMatch.startsWith('_') && fullMatch.endsWith('_'))) {
        parts.push(
          <em key={`italic-${match.index}`} className="italic text-gray-200">
            {fullMatch.slice(1, -1)}
          </em>
        );
      }

      currentIndex = match.index + fullMatch.length;
    }

    if (currentIndex < text.length) {
      parts.push(text.substring(currentIndex));
    }

    return parts;
  };

  const renderFormattedLines = (lines: string[]): React.ReactNode => {
    return lines.map((line, i) => {
      if (line.match(/^#{1,6}\s+/)) {
        const level = line.match(/^#+/)?.[0].length || 1;
        const headingText = line.replace(/^#+\s+/, '');
        const headingClasses = {
          1: 'text-2xl font-bold text-white mt-6 mb-4 border-b border-gray-600 pb-2',
          2: 'text-xl font-bold text-white mt-5 mb-3',
          3: 'text-lg font-semibold text-white mt-4 mb-2',
          4: 'text-base font-semibold text-gray-200 mt-3 mb-2',
          5: 'text-sm font-semibold text-gray-300 mt-2 mb-1',
          6: 'text-xs font-semibold text-gray-400 mt-2 mb-1'
        };
        return (
          <div key={`heading-${i}`} className={headingClasses[level as keyof typeof headingClasses] || headingClasses[3]}>
            {renderInlineFormatting(headingText)}
          </div>
        );
      } else if (line.match(/^[\s]*[-\*\+]\s+/)) {
        const indent = (line.match(/^[\s]*/)?.[0].length || 0) / 2;
        const bulletText = line.replace(/^[\s]*[-\*\+]\s+/, '');
        return (
          <div key={`bullet-${i}`} className={`flex items-start gap-2 mb-1 ml-${indent * 4}`}>
            <span className="text-gray-400 mt-1">•</span>
            <span className="text-gray-300">{renderInlineFormatting(bulletText)}</span>
          </div>
        );
      } else if (line.match(/^[\s]*\d+\.\s+/)) {
        const indent = (line.match(/^[\s]*/)?.[0].length || 0) / 2;
        const numberMatch = line.match(/^[\s]*(\d+)\.\s+/);
        const number = numberMatch?.[1] || '1';
        const listText = line.replace(/^[\s]*\d+\.\s+/, '');
        return (
          <div key={`number-${i}`} className={`flex items-start gap-2 mb-1 ml-${indent * 4}`}>
            <span className="text-gray-400 mt-1 font-mono text-sm">{number}.</span>
            <span className="text-gray-300">{renderInlineFormatting(listText)}</span>
          </div>
        );
      } else if (line.match(/^[-\*_]{3,}$/)) {
        return <hr key={`hr-${i}`} className="border-gray-700 my-4" />;
      } else if (line.match(/^>\s+/)) {
        const quoteText = line.replace(/^>\s+/, '');
        return (
          <div key={`quote-${i}`} className="border-l-4 border-gray-500 pl-4 py-1 my-2 bg-gray-800/50 rounded-r">
            <span className="text-gray-300 italic">{renderInlineFormatting(quoteText)}</span>
          </div>
        );
      } else if (line.trim()) {
        return (
          <div key={`line-${i}`} className="mb-1 text-gray-300">
            {renderInlineFormatting(line)}
          </div>
        );
      } else {
        return <div key={`empty-${i}`} className="mb-2" />;
      }
    });
  };

  const contentParts = parseContent(content);

  return (
    <div className="w-full text-base leading-relaxed">
      {contentParts.map((part) => (
        <div key={part.key} className="w-full">
          {part.type === 'codeblock' ? (
            <CodeBlock code={part.content} language={part.language} />
          ) : (
            <div className="whitespace-pre-wrap w-full text-gray-300">
              {renderFormattedLines(part.content.split('\n'))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}


// Attachment Preview Component
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
      className="flex items-center gap-2 bg-gray-800 rounded-lg p-2 border border-gray-700"
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

function FileUploadButton({ onFileUpload }: { onFileUpload: (fileData: string, fileType: string, fileName: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadSuccess(false);

    try {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            onFileUpload(reader.result, file.type, file.name);
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 2000);
          }
          setUploading(false);
        };
        reader.onerror = () => {
          setUploading(false);
          alert('Error reading image file.');
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            onFileUpload(reader.result, file.type, file.name);
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 2000);
          }
          setUploading(false);
        };
        reader.onerror = () => {
          setUploading(false);
          alert('Error reading text file.');
        };
        reader.readAsText(file);
      } else {
        alert('Only image or .txt files are supported.');
        setUploading(false);
      }
    } catch (error) {
      console.error('File upload error:', error);
      alert('Error uploading file.');
      setUploading(false);
    }
    
    e.target.value = '';
  };

  return (
    <>
      <button
        type="button"
        className={`p-2 rounded-full transition-all duration-200 relative ${
          uploading 
            ? 'text-blue-400 bg-blue-500/20' 
            : uploadSuccess 
              ? 'text-green-400 bg-green-500/20' 
              : 'text-gray-400 hover:text-white hover:bg-white/10'
        }`}
        onClick={handleButtonClick}
        title="Attach file"
        disabled={uploading}
      >
        {uploading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : uploadSuccess ? (
          <CheckCircle className="w-5 h-5" />
        ) : (
          <Paperclip className="w-5 h-5" />
        )}
        
        {/* Status indicator dot */}
        {uploading && (
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-400 animate-pulse" />
        )}
        {uploadSuccess && !uploading && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500"
          />
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.txt"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
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

export default function ChatComponent({ activeChat, user, setActiveChat, setChatList }: ChatProps) {
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(llmModels[0]);
  const [showModelChangeModal, setShowModelChangeModal] = useState(false);
  const [pendingModelChange, setPendingModelChange] = useState<LLMModel | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

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
    if (!activeChat || activeChat.model === newModel.id) {
      setSelectedModel(newModel);
      return;
    }
    setPendingModelChange(newModel);
    setShowModelChangeModal(true);
  };

  const confirmModelChange = async () => {
    if (!pendingModelChange || !activeChat || !user?.email) return;

    try {
      const updateResult = await updateChatModelAction(activeChat._id, pendingModelChange.id, user);
      if (updateResult.success) {
        const updatedChat = { ...activeChat, model: pendingModelChange.id };
        setActiveChat(updatedChat);
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
        id: Date.now() + Math.random(),
        fileData,
        fileType,
        fileName
      }
    ]);
  };

  const handleSend = async () => {
    if (input.trim() === '' || isSending) return;
    if (!user?.email) throw new Error('Something went wrong, user not authenticated');
    
    const messageInput = input;
    const messageAttachments = [...attachments];
    
    setInput('');
    setAttachments([]);
    setIsSending(true);

    const messageId = Date.now();
    const userMessage: Message = { id: messageId, content: messageInput, role: 'user'};
    const currentAttachmentsWithMsgId = messageAttachments.map(att => ({ ...att, id: messageId }));

    let chatToUpdate = activeChat;

    if (activeChat) {
      chatToUpdate = { 
        ...activeChat, 
        chatHistory: [...activeChat.chatHistory, userMessage], 
        attachments: [...activeChat.attachments, ...currentAttachmentsWithMsgId] 
      };
      setActiveChat(chatToUpdate);
    } else {
      const idResp = await newObjectIdAction();
      const titleResp = await generateTitleAction(selectedModel.id, userMessage);
      if (idResp.success && idResp.data && titleResp.success && titleResp.data) {
        const newChatId = JSON.parse(idResp.data);
        const title = titleResp.data;
        chatToUpdate = {
          _id: newChatId,
          title: title,
          chatHistory: [userMessage],
          model: selectedModel.id,
          attachments: currentAttachmentsWithMsgId
        };
        setActiveChat(chatToUpdate);
      } else {
        throw new Error(idResp.error || titleResp.error || "Failed to create new chat.");
      }
    }

    const aiMessagePlaceholder: Message = { id: Date.now() + 1, content: '', role: 'model', isStreaming: true };
    let updatedChatHistory = [...chatToUpdate!.chatHistory, aiMessagePlaceholder];
    setActiveChat({ ...chatToUpdate!, chatHistory: updatedChatHistory });

    const result = await sendMessageToAIAction(selectedModel.id, chatToUpdate, user);
    let fullResponse = '';
    let imgResponse = "";

    try {
      if (result.success && result.data) {
        for await (const delta of readStreamableValue(result.data.stream)) {
          fullResponse += delta;
          setActiveChat(prev => {
            if (!prev) return prev;
            const updatedHistory = [...prev.chatHistory];
            updatedHistory[updatedHistory.length - 1] = { 
              ...updatedHistory[updatedHistory.length - 1], 
              content: fullResponse, 
              isStreaming: true 
            };
            return { ...prev, chatHistory: updatedHistory };
          });
        }

        if (result.data.img) {
          for await (const delta of readStreamableValue(result.data.img)) {
            imgResponse += delta;
          }
        }

        setActiveChat(prev => {
          if (!prev) return prev;
          const updatedHistory = [...prev.chatHistory];
          updatedHistory[updatedHistory.length - 1] = { 
            ...updatedHistory[updatedHistory.length - 1], 
            content: fullResponse, 
            isStreaming: false 
          };
          return { ...prev, chatHistory: updatedHistory };
        });

        if (imgResponse) {
          const aiImageMessage: Message = {
            id: Date.now() + 2,
            content: `data:image/png;base64,${imgResponse}`,
            role: 'model',
            isStreaming: false,
          };
          setActiveChat(prev => {
            if (!prev) return prev;
            return { ...prev, chatHistory: [...prev.chatHistory, aiImageMessage] };
          });
          chatToUpdate!.chatHistory.push(aiImageMessage);
        }
      } else {
        const errorMessage: Message = { id: Date.now() + 1, content: `Error: ${result.error}`, role: 'model', isStreaming: false };
        setActiveChat(prev => {
          if (!prev) return prev;
          const updatedHistory = [...prev.chatHistory];
          updatedHistory[updatedHistory.length - 1] = errorMessage; 
          return { ...prev, chatHistory: updatedHistory };
        });
        chatToUpdate!.chatHistory.push(errorMessage); 
      }
    } catch (streamError) {
        console.error("Error during streaming:", streamError);
        const errorMessage: Message = { id: Date.now() + 1, content: 'An error occurred while processing the stream.', role: 'model', isStreaming: false };
        setActiveChat(prev => {
            if (!prev) return prev;
            const updatedHistory = [...prev.chatHistory];
            updatedHistory[updatedHistory.length - 1] = errorMessage;
            return { ...prev, chatHistory: updatedHistory };
          });
        chatToUpdate!.chatHistory.push(errorMessage);
    }

    if (chatToUpdate) {
        const finalChatHistory = [...(await activeChat?.chatHistory ?? [])];
        finalChatHistory.pop(); 
        finalChatHistory.push(...updatedChatHistory.slice(updatedChatHistory.length - (imgResponse ? 2 : 1)));
        
        chatToUpdate.chatHistory = finalChatHistory;

        const saveResp = await saveChatToDbAction(chatToUpdate, user);
        if (!saveResp.success) {
            console.error("Could not save chat to DB!", saveResp.error);
        } else {
            setChatList(
                prev => {
                    const existingIndex = prev.findIndex(chat => chat._id === chatToUpdate._id);
                    if (existingIndex !== -1) {
                        const updatedChats = [...prev];
                        updatedChats[existingIndex] = chatToUpdate;
                        return updatedChats;
                    } else {
                        return [...prev, chatToUpdate];
                    }
                }
            );
        }
    }

    setIsSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Render the "New Chat" welcome screen if no active chat
  if (!activeChat) {
    return (
        <div className="flex flex-col h-full bg-gray-900">
          <header className="flex items-center justify-between p-4 border-b border-gray-700">
            <h1 className="text-xl font-bold text-white">Multi AI Chat</h1>
            <ModelDropdown 
              selectedModel={selectedModel} 
              onModelSelect={handleModelChange} 
            />
          </header>
            <WelcomeScreen />
            <footer className="p-4">
              <div className="max-w-3xl mx-auto">
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

  // Render the main chat interface
  return (
    <div className="flex flex-col h-full bg-gray-900 font-sans overflow-hidden"> {/* Added overflow-hidden to main container */}
      <header className="flex items-center justify-between p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold text-white">{activeChat.title}</h1>
        <ModelDropdown 
          selectedModel={selectedModel} 
          onModelSelect={handleModelChange} 
        />
      </header>

      <main 
        ref={messagesEndRef} // Attach ref here for scrolling
        className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800" // Scrollbar styling
      >
        {activeChat.chatHistory.map((msg, index) => (
          <div key={msg.id} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && (
              <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500 rounded-full">
                <Building2 className="w-6 h-6 text-white" />
              </div>
            )}
            {/* Increased max-width for message bubbles */}
            <div className={`max-w-[75%] p-4 rounded-xl ${
              msg.role === 'user'
                ? 'bg-blue-600 rounded-br-none' // User message bubble
                : 'bg-gray-700 rounded-bl-none' // AI message bubble
            }`}>
              {/^data:image\/[a-zA-Z]+;base64,/.test(msg.content) ? (
                <img
                  src={msg.content}
                  alt="attachment"
                  className="max-w-xs max-h-64 rounded-lg border border-gray-700"
                />
              ) : (
                <div>
                  <MessageContent content={msg.content} />
                  {msg.isStreaming && <span className="inline-block w-2 h-4 bg-white ml-2 animate-pulse rounded-full" />}
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-gray-700 rounded-full">
                <User className="w-6 h-6 text-gray-300" />
              </div>
            )}
          </div>
        ))}
        {/* This div is no longer needed here for scrolling, ref is attached to main */}
        {/* <div ref={messagesEndRef} /> */} 
      </main>

      <footer className="p-4">
        <div className="max-w-3xl mx-auto">
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