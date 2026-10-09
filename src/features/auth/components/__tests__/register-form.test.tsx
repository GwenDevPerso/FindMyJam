import { render, screen, userEvent } from '@testing-library/react-native';

import { RegisterForm } from '@/features/auth/components/register-form';
import { useAuth } from '@/features/auth/hooks/use-auth';

jest.mock('@/features/auth/hooks/use-auth');

const mockedUseAuth = jest.mocked(useAuth);

type AuthOverrides = Partial<Pick<ReturnType<typeof useAuth>, 'register' | 'isRegistering' | 'registerError'>>;

function mockAuth(overrides: AuthOverrides): jest.Mock {
  const register = jest.fn().mockResolvedValue({});

  mockedUseAuth.mockReturnValue({
    register,
    isRegistering: false,
    registerError: null,
    ...overrides,
  } as unknown as ReturnType<typeof useAuth>);

  return register;
}

describe('RegisterForm', () => {
  it('shows a validation message per field and does not register when submitted empty', async () => {
    const register = mockAuth({});
    await render(<RegisterForm />);

    await userEvent.setup().press(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('Username must be at least 3 characters')).toBeOnTheScreen();
    expect(screen.getByText('Invalid email address')).toBeOnTheScreen();
    expect(screen.getByText('Password must be at least 8 characters')).toBeOnTheScreen();
    expect(register).not.toHaveBeenCalled();
  });

  it('rejects a username with forbidden characters', async () => {
    const register = mockAuth({});
    const user = userEvent.setup();
    await render(<RegisterForm />);

    await user.type(screen.getByPlaceholderText('your_username'), 'miles davis');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'miles@example.com');
    await user.type(screen.getByPlaceholderText('At least 8 characters'), 'kind-of-blue');
    await user.press(screen.getByRole('button', { name: 'Create account' }));

    expect(
      await screen.findByText('Username can only contain letters, numbers, and underscores'),
    ).toBeOnTheScreen();
    expect(register).not.toHaveBeenCalled();
  });

  it('registers with the entered username, email and password', async () => {
    const register = mockAuth({});
    const user = userEvent.setup();
    await render(<RegisterForm />);

    await user.type(screen.getByPlaceholderText('your_username'), 'miles_davis');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'miles@example.com');
    await user.type(screen.getByPlaceholderText('At least 8 characters'), 'kind-of-blue');
    await user.press(screen.getByRole('button', { name: 'Create account' }));

    expect(register).toHaveBeenCalledTimes(1);
    expect(register).toHaveBeenCalledWith({
      username: 'miles_davis',
      email: 'miles@example.com',
      password: 'kind-of-blue',
    });
  });

  it('shows the error returned by the registration attempt', async () => {
    mockAuth({ registerError: new Error('User already registered') });
    await render(<RegisterForm />);

    expect(screen.getByText('User already registered')).toBeOnTheScreen();
  });

  it('disables the submit button while registering', async () => {
    const register = mockAuth({ isRegistering: true });
    await render(<RegisterForm />);

    const button = screen.getByRole('button');
    await userEvent.setup().press(button);

    expect(button).toBeDisabled();
    expect(register).not.toHaveBeenCalled();
  });

  it('links back to sign in', async () => {
    mockAuth({});
    await render(<RegisterForm />);

    expect(screen.getByText('Already have an account? Sign in')).toBeOnTheScreen();
  });
});
