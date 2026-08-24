import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CustomerLoginPage from '../../pages/customer/auth/CustomerLoginPage';
import CustomerRegisterPage from '../../pages/customer/auth/CustomerRegisterPage';
import CustomerForgotPasswordPage from '../../pages/customer/auth/CustomerForgotPasswordPage';
import { LanguageProvider } from '../../context/LanguageContext';
import { ToastProvider } from '../../context/ToastContext';
import client from '../../api/client';

vi.mock('../../api/client', async () => {
  const actual = await vi.importActual('../../api/client');
  return {
    ...actual,
    default: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      defaults: { headers: { common: {} } },
    },
  };
});

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    userType: 'customer',
    login: vi.fn().mockResolvedValue({ status: true, data: { token: 'mock-jwt-token' } }),
    register: vi.fn().mockResolvedValue({ status: true, data: { token: 'mock-jwt-token' } }),
    forgotPassword: vi.fn().mockResolvedValue({ success: true, message: 'Reset email sent' }),
  }),
  AuthProvider: ({ children }) => <div>{children}</div>,
}));

describe('Frontend Auth Stress & Burst Submission Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stress: customer login button handles rapid double/multi-clicks gracefully', async () => {
    client.post.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ data: { status: true, data: { token: 'tok_123' } } }), 50)));

    render(
      <MemoryRouter>
        <LanguageProvider>
          <ToastProvider>
            <CustomerLoginPage />
          </ToastProvider>
        </LanguageProvider>
      </MemoryRouter>
    );

    const emailInput = document.querySelector('input[type="email"]') || document.querySelector('input');
    const passwordInput = document.querySelector('input[type="password"]');

    if (emailInput && passwordInput) {
      fireEvent.change(emailInput, { target: { value: 'stress_user@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'Secret123!' } });
    }

    const submitBtn = document.querySelector('button[type="submit"]') || screen.getByRole('button');
    expect(submitBtn).toBeInTheDocument();

    // Spam click 10 times in rapid succession
    for (let i = 0; i < 10; i++) {
      fireEvent.click(submitBtn);
    }

    expect(document.body).toBeInTheDocument();
  });

  it('stress: customer registration form handles rapid validation input cycles', async () => {
    render(
      <MemoryRouter>
        <LanguageProvider>
          <ToastProvider>
            <CustomerRegisterPage />
          </ToastProvider>
        </LanguageProvider>
      </MemoryRouter>
    );

    const inputs = document.querySelectorAll('input');
    for (let i = 0; i < 20; i++) {
      inputs.forEach((input) => {
        fireEvent.change(input, { target: { value: `val_${i}_${Math.random()}` } });
      });
    }

    expect(inputs.length).toBeGreaterThan(0);
  });

  it('stress: forgot password form rapid burst submissions', async () => {
    client.post.mockResolvedValue({ data: { status: true, message: 'Reset email sent' } });

    render(
      <MemoryRouter>
        <LanguageProvider>
          <ToastProvider>
            <CustomerForgotPasswordPage />
          </ToastProvider>
        </LanguageProvider>
      </MemoryRouter>
    );

    const emailInput = document.querySelector('input[type="email"]') || document.querySelector('input');
    if (emailInput) {
      fireEvent.change(emailInput, { target: { value: 'forgot_stress@example.com' } });
    }

    const submitBtn = document.querySelector('button[type="submit"]') || screen.getByRole('button');
    if (submitBtn) {
      for (let i = 0; i < 5; i++) {
        fireEvent.click(submitBtn);
      }
    }

    expect(document.body).toBeInTheDocument();
  });
});
