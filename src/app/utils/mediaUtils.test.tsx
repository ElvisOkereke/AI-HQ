import { describe, it, expect } from 'vitest';
import {
  createNewChat,
  addMediaToChat,
  getMessageMedia,
  getContextMediaItems,
  getMessageDisplayContent,
} from './mediaUtils';
import { Chat, MediaItem } from '../types/types';

function makeChat(overrides: Partial<Chat> = {}): Chat {
  return {
    _id: 'chat-1',
    title: 'New Chat',
    chatHistory: [],
    model: 'gemini-2.0-flash',
    mediaItems: [],
    ...overrides,
  };
}

describe('createNewChat', () => {
  it('builds an empty chat with the given id, title, and model', () => {
    const chat = createNewChat('abc123', 'My Chat', 'gemini-2.0-flash');
    expect(chat).toEqual({
      _id: 'abc123',
      title: 'My Chat',
      chatHistory: [],
      model: 'gemini-2.0-flash',
      mediaItems: [],
    });
  });
});

describe('addMediaToChat', () => {
  it('appends new media items to the chat without mutating the original', () => {
    const chat = makeChat();
    const updated = addMediaToChat(chat, 1, [
      { fileName: 'a.png', fileData: 'base64data', fileType: 'image/png' },
    ]);

    expect(chat.mediaItems).toHaveLength(0);
    expect(updated.mediaItems).toHaveLength(1);
    expect(updated.mediaItems[0]).toMatchObject({
      messageId: 1,
      fileName: 'a.png',
      fileType: 'image/png',
      mediaType: 'image',
    });
  });

  it('classifies non-image files as mediaType "file"', () => {
    const chat = makeChat();
    const updated = addMediaToChat(chat, 2, [
      { fileName: 'doc.pdf', fileData: 'base64data', fileType: 'application/pdf' },
    ]);

    expect(updated.mediaItems[0].mediaType).toBe('file');
  });

  it('preserves existing media items when adding more', () => {
    const existing: MediaItem = {
      id: 1,
      messageId: 1,
      fileName: 'old.png',
      fileData: 'x',
      fileType: 'image/png',
      mediaType: 'image',
      timestamp: 0,
    };
    const chat = makeChat({ mediaItems: [existing] });
    const updated = addMediaToChat(chat, 2, [
      { fileName: 'new.png', fileData: 'y', fileType: 'image/png' },
    ]);

    expect(updated.mediaItems).toHaveLength(2);
    expect(updated.mediaItems[0]).toBe(existing);
  });
});

describe('getMessageMedia', () => {
  it('returns only media items belonging to the given message id', () => {
    const chat = makeChat({
      mediaItems: [
        { id: 1, messageId: 1, fileName: 'a', fileData: '', fileType: 'image/png', mediaType: 'image', timestamp: 0 },
        { id: 2, messageId: 2, fileName: 'b', fileData: '', fileType: 'image/png', mediaType: 'image', timestamp: 0 },
      ],
    });

    expect(getMessageMedia(chat, 1)).toHaveLength(1);
    expect(getMessageMedia(chat, 1)[0].fileName).toBe('a');
  });
});

describe('getContextMediaItems', () => {
  it('excludes the current message media when currentMessageId is provided', () => {
    const chat = makeChat({
      mediaItems: [
        { id: 1, messageId: 1, fileName: 'a', fileData: '', fileType: 'image/png', mediaType: 'image', timestamp: 0 },
        { id: 2, messageId: 2, fileName: 'b', fileData: '', fileType: 'image/png', mediaType: 'image', timestamp: 0 },
      ],
    });

    const context = getContextMediaItems(chat, 2);
    expect(context).toHaveLength(1);
    expect(context[0].fileName).toBe('a');
  });

  it('returns all media when no currentMessageId is provided', () => {
    const chat = makeChat({
      mediaItems: [
        { id: 1, messageId: 1, fileName: 'a', fileData: '', fileType: 'image/png', mediaType: 'image', timestamp: 0 },
      ],
    });

    expect(getContextMediaItems(chat)).toHaveLength(1);
  });
});

describe('getMessageDisplayContent', () => {
  it('returns the raw text content when the message has text', () => {
    const content = getMessageDisplayContent({ id: 1, content: 'hello', role: 'user' }, []);
    expect(content).toBe('hello');
  });

  it('describes media-only messages with no text', () => {
    const mediaItems: MediaItem[] = [
      { id: 1, messageId: 1, fileName: 'a.png', fileData: '', fileType: 'image/png', mediaType: 'image', timestamp: 0 },
      { id: 2, messageId: 1, fileName: 'b.pdf', fileData: '', fileType: 'application/pdf', mediaType: 'file', timestamp: 0 },
    ];
    const content = getMessageDisplayContent({ id: 1, content: '', role: 'user' }, mediaItems);
    expect(content).toBe('[1 image and 1 file]');
  });

  it('falls back to a generic label when there is no text or classified media', () => {
    const content = getMessageDisplayContent({ id: 1, content: '  ', role: 'user' }, [
      { id: 1, messageId: 1, fileName: 'a', fileData: '', fileType: '', mediaType: 'file', timestamp: 0 },
    ]);
    expect(content).toBe('[1 file]');
  });
});
