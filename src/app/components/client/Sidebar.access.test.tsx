import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Sidebar from './Sidebar';
import { fetchChatsByUserAction } from '../actions/dbActions';

vi.mock('../actions/dbActions', () => ({
  fetchChatsByUserAction: vi.fn().mockResolvedValue({ success: true, data: [] }),
}));

vi.mock('../actions/byokActions', () => ({
  listByokConnectionsAction: vi.fn().mockResolvedValue({ success: true, data: [] }),
  addByokConnectionAction: vi.fn(),
  deleteByokConnectionAction: vi.fn(),
}));

describe('Sidebar access (no account required)', () => {
  it('gives anonymous visitors API Keys, their saved chats, and a sign-in button', async () => {
    const onSignIn = vi.fn();
    render(
      <Sidebar
        chatList={[]}
        setChatList={vi.fn()}
        setActiveChat={vi.fn()}
        onLogout={vi.fn()}
        onSignIn={onSignIn}
        user={{ name: 'Anonymous', isAnonymous: true }}
      />
    );

    expect(screen.getByText('API Keys')).toBeInTheDocument();
    expect(screen.queryByTitle('Logout')).not.toBeInTheDocument();
    await waitFor(() => expect(fetchChatsByUserAction).toHaveBeenCalledWith());

    await userEvent.setup().click(screen.getByText('Sign in'));
    expect(onSignIn).toHaveBeenCalled();
  });

  it('shows API Keys and logout for signed-in users', () => {
    render(
      <Sidebar
        chatList={[]}
        setChatList={vi.fn()}
        setActiveChat={vi.fn()}
        onLogout={vi.fn()}
        user={{ name: 'Real User', email: 'real@example.com' }}
      />
    );

    expect(screen.getByText('API Keys')).toBeInTheDocument();
    expect(screen.getByText('Real User')).toBeInTheDocument();
    expect(screen.queryByText('Sign in')).not.toBeInTheDocument();
  });
});
