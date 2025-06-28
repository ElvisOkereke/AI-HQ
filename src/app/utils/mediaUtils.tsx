import { Chat, Message, MediaItem } from '../types/types';

/**
 * Gets all media items associated with a specific message
 */
export function getMessageMedia(chat: Chat, messageId: number): MediaItem[] {
  return chat.mediaItems.filter(media => media.messageId === messageId);
}

/**
 * Gets all media items for API context (previous messages)
 */
export function getContextMediaItems(chat: Chat, currentMessageId?: number): MediaItem[] {
  if (currentMessageId) {
    return chat.mediaItems.filter(media => media.messageId !== currentMessageId);
  }
  return chat.mediaItems;
}

/**
 * Gets media items for current message (new attachments)
 */
export function getCurrentMessageMedia(chat: Chat, messageId: number): MediaItem[] {
  return chat.mediaItems.filter(media => media.messageId === messageId);
}

/**
 * Converts media items to inline data format for API
 */
export function mediaItemsToInlineData(mediaItems: MediaItem[]): any[] {
  return mediaItems.map(media => ({
    inlineData: {
      mimeType: media.fileType,
      data: media.fileData
    }
  }));
}

/**
 * Adds new media items to a chat
 */
export function addMediaToChat(chat: Chat, messageId: number, files: { fileName: string, fileData: string, fileType: string }[]): Chat {
  const newMediaItems: MediaItem[] = files.map(file => ({
    id: Date.now() + Math.random(),
    messageId,
    fileName: file.fileName,
    fileData: file.fileData,
    fileType: file.fileType,
    mediaType: file.fileType.startsWith('image/') ? 'image' : 'file',
    timestamp: Date.now()
  }));

  return {
    ...chat,
    mediaItems: [...chat.mediaItems, ...newMediaItems]
  };
}

/**
 * Adds a generated image to the chat as a media item
 */
export function addGeneratedImageToChat(chat: Chat, messageId: number, imageData: string): Chat {
  const mediaItem: MediaItem = {
    id: Date.now() + Math.random(),
    messageId,
    fileName: `generated-image-${messageId}.png`,
    fileData: imageData,
    fileType: 'image/png',
    mediaType: 'image',
    timestamp: Date.now()
  };

  return {
    ...chat,
    mediaItems: [...chat.mediaItems, mediaItem]
  };
}

/**
 * Gets display text for a message with media
 */
export function getMessageDisplayContent(message: Message, mediaItems: MediaItem[]): string {
  const messageMedia = mediaItems.filter(media => media.messageId === message.id);
  
  if (messageMedia.length === 0) {
    return message.content;
  }
  
  // If message has both text and media, return the text
  if (message.content && message.content.trim()) {
    return message.content;
  }
  
  // If it's just media, show a descriptive text
  const imageCount = messageMedia.filter(m => m.mediaType === 'image').length;
  const fileCount = messageMedia.filter(m => m.mediaType === 'file').length;
  
  const parts = [];
  if (imageCount > 0) parts.push(`${imageCount} image${imageCount > 1 ? 's' : ''}`);
  if (fileCount > 0) parts.push(`${fileCount} file${fileCount > 1 ? 's' : ''}`);
  
  return parts.length > 0 ? `[${parts.join(' and ')}]` : '[Media]';
}

/**
 * Creates a new empty chat with proper structure
 */
export function createNewChat(id: any, title: string, model: string): Chat {
  return {
    _id: id,
    title,
    chatHistory: [],
    model,
    mediaItems: []
  };
}

/**
 * Gets media items that should be sent to API for context
 */
export function getAPIContextMedia(chat: Chat, lastMessageId: number): { currentMedia: MediaItem[], previousMedia: MediaItem[] } {
  const currentMedia = chat.mediaItems.filter(media => media.messageId === lastMessageId);
  const previousMedia = chat.mediaItems.filter(media => media.messageId !== lastMessageId);
  
  return { currentMedia, previousMedia };
}
