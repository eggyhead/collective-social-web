/**
 * Tests for LoginButton component.
 *
 * Covers:
 * 1. Form resets state when browser back navigation triggers pageshow event
 * 2. Handle is normalized to lowercase before submission
 * 3. Form displays loading state during submission
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from '../components/ui/provider';
import { LoginButton } from '../components/LoginButton';

// Mock authRedirect utility
vi.mock('../utils/authRedirect', () => ({
  peekPostLoginRedirectReason: () => null,
}));

const API_URL = 'http://test.api';

function renderLoginButton() {
  return render(
    <Provider>
      <LoginButton apiUrl={API_URL} />
    </Provider>
  );
}

describe('LoginButton', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resets loading/error but preserves handle on pageshow (back button)', async () => {
    const user = userEvent.setup();
    renderLoginButton();

    const input = await screen.findByPlaceholderText('Enter your handle or DID');
    await user.type(input, 'MyHandle.bsky.social');

    // Spy after render to avoid interfering with Chakra setup
    vi.spyOn(document.body, 'appendChild').mockImplementation(node => {
      if (node instanceof HTMLFormElement) {
        node.submit = vi.fn();
      }
      return node;
    });

    // Submit to enter loading state
    const submitButton = screen.getByRole('button', { name: /login with atproto/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /redirecting/i })).toBeInTheDocument();
    });

    // Simulate browser back navigation (pageshow with persisted=true)
    const pageshowEvent = new PageTransitionEvent('pageshow', { persisted: true });
    fireEvent(window, pageshowEvent);

    // Handle is preserved, but loading state is cleared
    await waitFor(() => {
      expect(input).toHaveValue('MyHandle.bsky.social');
      expect(screen.getByRole('button', { name: /login with atproto/i })).not.toBeDisabled();
    });
  });

  it('does not reset on initial page load (persisted=false)', async () => {
    const user = userEvent.setup();
    renderLoginButton();

    const input = await screen.findByPlaceholderText('Enter your handle or DID');
    await user.type(input, 'MyHandle.bsky.social');

    // Simulate normal page load (persisted=false)
    const pageshowEvent = new PageTransitionEvent('pageshow', { persisted: false });
    fireEvent(window, pageshowEvent);

    // Should NOT reset on normal page loads
    expect(input).toHaveValue('MyHandle.bsky.social');
  });

  it('normalizes handle to lowercase before submission', async () => {
    const user = userEvent.setup();
    renderLoginButton();

    const input = await screen.findByPlaceholderText('Enter your handle or DID');
    await user.type(input, 'MyHandle.BSky.Social');

    // Spy on appendChild AFTER render to avoid interfering with Chakra setup
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(node => {
      if (node instanceof HTMLFormElement) {
        node.submit = vi.fn();
      }
      return node;
    });

    const submitButton = screen.getByRole('button', { name: /login with atproto/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(appendChildSpy).toHaveBeenCalled();
    });
    const formNode = appendChildSpy.mock.calls[0][0] as HTMLFormElement;
    const hiddenInput = formNode.querySelector('input[name="input"]') as HTMLInputElement;
    expect(hiddenInput.value).toBe('myhandle.bsky.social');

    appendChildSpy.mockRestore();
  });

  it('disables submit when handle is whitespace-only', async () => {
    const user = userEvent.setup();
    renderLoginButton();

    const input = await screen.findByPlaceholderText('Enter your handle or DID');
    await user.type(input, '   ');

    const submitButton = screen.getByRole('button', { name: /login with atproto/i });
    expect(submitButton).toBeDisabled();
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    renderLoginButton();

    const input = await screen.findByPlaceholderText('Enter your handle or DID');
    await user.type(input, 'test.bsky.social');

    // Spy after render
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(node => {
      if (node instanceof HTMLFormElement) {
        node.submit = vi.fn();
      }
      return node;
    });

    const submitButton = screen.getByRole('button', { name: /login with atproto/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /redirecting/i })).toBeInTheDocument();
    });

    appendChildSpy.mockRestore();
  });
});
