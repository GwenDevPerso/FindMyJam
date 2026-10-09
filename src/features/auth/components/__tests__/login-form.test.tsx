import { render, screen, userEvent } from '@testing-library/react-native';

import { LoginForm } from '@/features/auth/components/login-form';
import { useAuth } from '@/features/auth/hooks/use-auth';

jest.mock('@/features/auth/hooks/use-auth');

const mockedUseAuth = jest.mocked(useAuth);

type AuthOverrides = Partial<Pick<ReturnType<typeof useAuth>, 'login' | 'isLoggingIn' | 'loginError'>>;

function mockAuth(overrides: AuthOverrides): jest.Mock {
  const login = jest.fn().mockResolvedValue({});

  mockedUseAuth.mockReturnValue({
    login,
    isLoggingIn: false,
    loginError: null,
    ...overrides,
  } as unknown as ReturnType<typeof useAuth>);

  return login;
}

describe('LoginForm', () => {
  it('shows validation messages and does not log in when submitted empty', async () => {
    const login = mockAuth({});
    await render(<LoginForm />);

    await userEvent.setup().press(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Invalid email address')).toBeOnTheScreen();
    expect(screen.getByText('Password must be at least 8 characters')).toBeOnTheScreen();
    expect(login).not.toHaveBeenCalled();
  });

  it('rejects a password that is too short', async () => {
    const login = mockAuth({});
    const user = userEvent.setup();
    await render(<LoginForm />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'miles@example.com');
    await user.type(screen.getByPlaceholderText('Your password'), 'short');
    await user.press(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Password must be at least 8 characters')).toBeOnTheScreen();
    expect(screen.queryByText('Invalid email address')).not.toBeOnTheScreen();
    expect(login).not.toHaveBeenCalled();
  });

  it('logs in with the entered email and password', async () => {
    const login = mockAuth({});
    const user = userEvent.setup();
    await render(<LoginForm />);

    await user.type(screen.getByPlaceholderText('you@example.com'), 'miles@example.com');
    await user.type(screen.getByPlaceholderText('Your password'), 'kind-of-blue');
    await user.press(screen.getByRole('button', { name: 'Sign in' }));

    expect(login).toHaveBeenCalledTimes(1);
    expect(login).toHaveBeenCalledWith({ email: 'miles@example.com', password: 'kind-of-blue' });
  });

  it('shows the error returned by the login attempt', async () => {
    mockAuth({ loginError: new Error('Invalid login credentials') });
    await render(<LoginForm />);

    expect(screen.getByText('Invalid login credentials')).toBeOnTheScreen();
  });

  it('disables the submit button while logging in', async () => {
    const login = mockAuth({ isLoggingIn: true });
    await render(<LoginForm />);

    const button = screen.getByRole('button');
    await userEvent.setup().press(button);

    expect(button).toBeDisabled();
    expect(login).not.toHaveBeenCalled();
  });

  it('links to account creation', async () => {
    mockAuth({});
    await render(<LoginForm />);

    expect(screen.getByText('Create an account')).toBeOnTheScreen();
  });
});
