import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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

describe('Sidebar guest gating', () => {
  it('does not render the API Keys entry point for guests', () => {
    render(
      <Sidebar
        chatList={[]}
        setChatList={vi.fn()}
        setActiveChat={vi.fn()}
        onLogout={vi.fn()}
        user={{ name: 'Guest', email: 'guest@local', isGuest: true }}
      />
    );

    expect(screen.queryByText('API Keys')).not.toBeInTheDocument();
    expect(fetchChatsByUserAction).not.toHaveBeenCalled();
  });

  it('renders the API Keys entry point for signed-in users', () => {
    render(
      <Sidebar
        chatList={[]}
        setChatList={vi.fn()}
        setActiveChat={vi.fn()}
        onLogout={vi.fn()}
        user={{ name: 'Real User', email: 'real@example.com', isGuest: false }}
      />
    );

    expect(screen.getByText('API Keys')).toBeInTheDocument();
  });
});
