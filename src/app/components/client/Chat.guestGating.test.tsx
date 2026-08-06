import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatComponent from './Chat';
import {
  newObjectIdAction,
  sendMessageToAIAction,
  generateTitleAction,
  saveChatToDbAction,
} from '../actions/dbActions';
import { readStreamableValue } from 'ai/rsc';
import { Chat } from '../../types/types';

vi.mock('../actions/dbActions', () => ({
  newObjectIdAction: vi.fn(),
  sendMessageToAIAction: vi.fn(),
  generateTitleAction: vi.fn(),
  saveChatToDbAction: vi.fn(),
  updateChatModelAction: vi.fn(),
}));

vi.mock('ai/rsc', () => ({
  readStreamableValue: vi.fn(),
}));

vi.mock('./ModelDropdown', () => ({
  __esModule: true,
  default: ({ disabled }: { disabled?: boolean }) => (
    <div data-testid="model-dropdown" data-disabled={disabled ? 'true' : 'false'} />
  ),
  llmModels: [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', icon: () => null, features: {}, description: '', provider: 'Google', category: 'multimodal' },
  ],
}));

vi.mock('./MessageFormatting', () => ({
  MessageContent: ({ content }: { content: string }) => <div>{content}</div>,
}));

vi.mock('./FileUpload', () => ({
  FileUploadButton: () => <div data-testid="file-upload" />,
}));

vi.mock('./MediaDisplay', () => ({
  MediaDisplay: () => null,
  MediaPreview: () => null,
}));

async function* fakeStream(chunks: string[]) {
  for (const chunk of chunks) {
    yield chunk;
  }
}

function makeChat(): Chat {
  return {
    _id: 'chat-1',
    title: 'Existing Chat',
    chatHistory: [],
    model: 'gemini-2.0-flash',
    mediaItems: [],
  };
}

describe('Chat guest-mode DB gating', () => {
  beforeEach(() => {
    vi.mocked(saveChatToDbAction).mockReset().mockResolvedValue({ success: true, data: 'ok' } as any);
    vi.mocked(sendMessageToAIAction).mockReset().mockResolvedValue({
      success: true,
      data: { stream: 'stream-token' },
    } as any);
    vi.mocked(readStreamableValue).mockReset().mockImplementation(() => fakeStream(['Hello']) as any);
  });

  it('does not persist to the database when sending a message as a guest', async () => {
    const user = userEvent.setup();
    const setActiveChat = vi.fn();
    const setChatList = vi.fn();

    render(
      <ChatComponent
        key="chat-1"
        activeChat={makeChat()}
        user={{ name: 'Guest', email: 'guest@local', isGuest: true }}
        setActiveChat={setActiveChat}
        setChatList={setChatList}
      />
    );

    await user.type(screen.getByPlaceholderText('Ask anything...'), 'Hello there');
    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(sendMessageToAIAction).toHaveBeenCalled();
    });

    expect(saveChatToDbAction).not.toHaveBeenCalled();
  });

  it('persists to the database when sending a message as a signed-in user', async () => {
    const user = userEvent.setup();
    const setActiveChat = vi.fn();
    const setChatList = vi.fn();

    render(
      <ChatComponent
        key="chat-1"
        activeChat={makeChat()}
        user={{ name: 'Real User', email: 'real@example.com', isGuest: false }}
        setActiveChat={setActiveChat}
        setChatList={setChatList}
      />
    );

    await user.type(screen.getByPlaceholderText('Ask anything...'), 'Hello there');
    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(saveChatToDbAction).toHaveBeenCalled();
    });
  });

  it('renders the model dropdown as disabled for guests', () => {
    render(
      <ChatComponent
        key="chat-1"
        activeChat={makeChat()}
        user={{ name: 'Guest', email: 'guest@local', isGuest: true }}
        setActiveChat={vi.fn()}
        setChatList={vi.fn()}
      />
    );

    expect(screen.getByTestId('model-dropdown')).toHaveAttribute('data-disabled', 'true');
  });
});
