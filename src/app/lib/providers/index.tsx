import 'server-only';
import { Chat, Message, MediaItem } from '../../types/types';
import { createStreamableValue } from 'ai/rsc';

export interface ModelProvider {
  name: string;
  sendMessage(modelId: string, chat: Chat): Promise<{ stream: any; img?: any }>;
  generateTitle?(modelId: string, userMessage: Message): Promise<string>;
  supportsImageGeneration?(modelId: string): boolean;
  supportsStreaming?(modelId: string): boolean;
}

export interface ProviderMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: MediaItem[];
}

export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
}

// Convert chat history to provider format
export function formatChatHistory(chat: Chat, includeMedia: boolean = true): ProviderMessage[] {
  return chat.chatHistory.map(msg => {
    const message: ProviderMessage = {
      role: msg.role === 'model' ? 'assistant' : msg.role as 'user' | 'assistant' | 'system',
      content: msg.content
    };

    if (includeMedia && msg.mediaIds && msg.mediaIds.length > 0) {
      message.attachments = chat.mediaItems.filter(media => 
        msg.mediaIds!.includes(media.id)
      );
    }

    return message;
  });
}

// Get media items for context (previous messages)
export function getContextMedia(chat: Chat, currentMessageId: number): MediaItem[] {
  return chat.mediaItems.filter(media => media.messageId !== currentMessageId);
}

// Get media items for current message
export function getCurrentMedia(chat: Chat, currentMessageId: number): MediaItem[] {
  return chat.mediaItems.filter(media => media.messageId === currentMessageId);
}
