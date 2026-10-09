import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatComponent from './Chat';
import {
  sendMessageToAIAction,
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
  default: ({ disabled, extraModels }: { disabled?: boolean; extraModels?: unknown[] }) => (
    <div
      data-testid="model-dropdown"
      data-disabled={disabled ? 'true' : 'false'}
      data-extra-count={String(extraModels?.length ?? 0)}
    />
  ),
  llmModels: [
    { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', icon: () => null, features: {}, description: '', provider: 'Fuelix', category: 'text' },
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
    model: 'gemini-3.6-flash',
    mediaItems: [],
  };
}

const extraModel = { id: 'o4-mini', name: 'O4 Mini', icon: () => null, features: {}, description: '', provider: 'Fuelix' as const, category: 'reasoning' as const };

describe('Chat persistence and model access (no account required)', () => {
  beforeEach(() => {
    vi.mocked(saveChatToDbAction).mockReset().mockResolvedValue({ success: true, data: 'ok' } as any);
    vi.mocked(sendMessageToAIAction).mockReset().mockResolvedValue({
      success: true,
      data: { stream: 'stream-token' },
    } as any);
    vi.mocked(readStreamableValue).mockReset().mockImplementation(() => fakeStream(['Hello']) as any);
  });

  it('sends and saves without passing any client-side identity to the server', async () => {
    const user = userEvent.setup();

    render(
      <ChatComponent
        key="chat-1"
        activeChat={makeChat()}
        setActiveChat={vi.fn()}
        setChatList={vi.fn()}
      />
    );

    await user.type(screen.getByPlaceholderText('Ask anything...'), 'Hello there');
    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(saveChatToDbAction).toHaveBeenCalled();
    });

    // Identity is resolved server-side, so the actions only receive the model and chat
    expect(vi.mocked(sendMessageToAIAction).mock.calls[0]).toHaveLength(2);
    expect(vi.mocked(saveChatToDbAction).mock.calls[0]).toHaveLength(1);
  });

  it('never disables model switching', () => {
    render(
      <ChatComponent
        key="chat-1"
        activeChat={makeChat()}
        setActiveChat={vi.fn()}
        setChatList={vi.fn()}
      />
    );

    expect(screen.getByTestId('model-dropdown')).toHaveAttribute('data-disabled', 'false');
  });

  it('offers the live/BYOK models inside an existing chat, not just on the new-chat screen', () => {
    render(
      <ChatComponent
        key="chat-1"
        activeChat={makeChat()}
        setActiveChat={vi.fn()}
        setChatList={vi.fn()}
        extraModels={[extraModel]}
      />
    );

    expect(screen.getByTestId('model-dropdown')).toHaveAttribute('data-extra-count', '1');
  });
});
