import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { signIn } from 'next-auth/react';
import SignInForm from './SignIn';

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}));

describe('SignInForm', () => {
  beforeEach(() => {
    vi.mocked(signIn).mockReset();
  });

  it('renders email, password fields and the submit button', () => {
    render(<SignInForm onBack={() => {}} />);
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('disables the submit button until both fields are filled', async () => {
    const user = userEvent.setup();
    render(<SignInForm onBack={() => {}} />);

    const submit = screen.getByRole('button', { name: 'Sign In' });
    expect(submit).toBeDisabled();

    await user.type(screen.getByPlaceholderText('Email address'), 'test@example.com');
    expect(submit).toBeDisabled();

    await user.type(screen.getByPlaceholderText('Password'), 'hunter2');
    expect(submit).toBeEnabled();
  });

  it('calls next-auth signIn with credentials on submit', async () => {
    vi.mocked(signIn).mockResolvedValue({ ok: true, error: undefined } as any);
    const user = userEvent.setup();
    render(<SignInForm onBack={() => {}} />);

    await user.type(screen.getByPlaceholderText('Email address'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'hunter2');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'hunter2',
        redirect: false,
      });
    });
  });

  it('shows the returned error message when sign in fails', async () => {
    vi.mocked(signIn).mockResolvedValue({ ok: false, error: 'Invalid credentials' } as any);
    const user = userEvent.setup();
    render(<SignInForm onBack={() => {}} />);

    await user.type(screen.getByPlaceholderText('Email address'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'wrongpass');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
  });

  it('calls onBack when the back arrow is clicked', async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<SignInForm onBack={onBack} />);

    const backButton = container.querySelector('button.absolute.left-8') as HTMLElement;
    await user.click(backButton);

    expect(onBack).toHaveBeenCalled();
  });
});
